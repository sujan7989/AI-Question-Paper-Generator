import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Trash2, Search, Copy, BookMarked } from 'lucide-react';

export interface BankQuestion {
  id: string;
  question: string;
  bloom: string;
  co: string;
  subject: string;
  savedAt: string;
}

const STORAGE_KEY = 'questionBank_v1';

function loadBank(): BankQuestion[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveBank(bank: BankQuestion[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bank)); } catch {}
}

export function saveQuestionToBank(q: Omit<BankQuestion, 'id' | 'savedAt'>) {
  const bank = loadBank();
  if (bank.some(b => b.question === q.question)) return false; // duplicate
  bank.unshift({ ...q, id: Date.now().toString(), savedAt: new Date().toISOString() });
  saveBank(bank);
  return true;
}

const bloomColors: Record<string, string> = {
  Remember: 'bg-blue-100 text-blue-700',
  Understand: 'bg-green-100 text-green-700',
  Apply: 'bg-yellow-100 text-yellow-700',
  Analyze: 'bg-orange-100 text-orange-700',
  Evaluate: 'bg-red-100 text-red-700',
  Create: 'bg-purple-100 text-purple-700',
};

export function QuestionBank() {
  const [bank, setBank] = useState<BankQuestion[]>(loadBank);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filtered = bank.filter(q =>
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.subject.toLowerCase().includes(search.toLowerCase()) ||
    q.bloom.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    const updated = bank.filter(q => q.id !== id);
    setBank(updated);
    saveBank(updated);
    toast({ title: 'Removed from bank' });
  };

  const handleCopy = (q: BankQuestion) => {
    navigator.clipboard.writeText(`${q.question} | ${q.bloom} | ${q.co}`);
    toast({ title: 'Copied to clipboard' });
  };

  const handleClearAll = () => {
    if (!confirm('Clear all saved questions?')) return;
    setBank([]);
    saveBank([]);
    toast({ title: 'Question bank cleared' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7" />Question Bank
          </h2>
          <p className="text-muted-foreground">Saved questions you can reuse across papers</p>
        </div>
        {bank.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />Clear All
          </Button>
        )}
      </div>

      {bank.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookMarked className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No questions saved yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              In the paper preview, click the bookmark icon on any question to save it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions, subjects, Bloom's level..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} of {bank.length} questions</p>
          <div className="space-y-3">
            {filtered.map(q => (
              <Card key={q.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.question}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${bloomColors[q.bloom] || 'bg-gray-100 text-gray-700'}`}>{q.bloom}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{q.co}</span>
                        <span className="text-xs text-muted-foreground">{q.subject}</span>
                        <span className="text-xs text-muted-foreground">{new Date(q.savedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(q)} title="Copy">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)} title="Remove">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
