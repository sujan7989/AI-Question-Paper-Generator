// Feature 10: Paper Rating by Admin - 1-5 stars with comment
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RATINGS_KEY = 'paper_ratings';

interface PaperRatingData {
  paperId: string;
  stars: number;
  comment: string;
  ratedAt: string;
}

function getRatings(): Record<string, PaperRatingData> {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); } catch { return {}; }
}

function saveRating(data: PaperRatingData) {
  const ratings = getRatings();
  ratings[data.paperId] = data;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

export function getPaperRating(paperId: string): PaperRatingData | null {
  return getRatings()[paperId] || null;
}

interface PaperRatingProps {
  paperId: string | number;
  readonly?: boolean;
}

export function PaperRating({ paperId, readonly = false }: PaperRatingProps) {
  const id = String(paperId);
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const existing = getPaperRating(id);
    if (existing) {
      setStars(existing.stars);
      setComment(existing.comment);
      setSaved(true);
    }
  }, [id]);

  const handleSave = () => {
    if (stars === 0) {
      toast({ title: 'Select a rating', description: 'Please select 1-5 stars.', variant: 'destructive' });
      return;
    }
    saveRating({ paperId: id, stars, comment, ratedAt: new Date().toISOString() });
    setSaved(true);
    toast({ title: 'Rating saved', description: `Rated ${stars} star${stars > 1 ? 's' : ''}.` });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHovered(n)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && setStars(n)}
            className="focus:outline-none disabled:cursor-default"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                n <= (hovered || stars)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {stars > 0 && <span className="text-xs text-muted-foreground ml-1">{stars}/5</span>}
      </div>
      {!readonly && (
        <>
          <Textarea
            placeholder="Add a comment (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button size="sm" onClick={handleSave} variant={saved ? 'secondary' : 'default'}>
            {saved ? 'Update Rating' : 'Save Rating'}
          </Button>
        </>
      )}
      {readonly && comment && (
        <p className="text-xs text-muted-foreground italic">"{comment}"</p>
      )}
    </div>
  );
}
