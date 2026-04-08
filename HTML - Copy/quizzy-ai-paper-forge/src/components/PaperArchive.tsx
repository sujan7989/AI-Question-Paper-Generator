// Feature 7: Paper Expiry/Archive System
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type QuestionPaper } from '@/lib/paper';

const ARCHIVE_KEY = 'archived_papers';

export function getArchivedPaperIds(): string[] {
  try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; }
}

function saveArchivedIds(ids: string[]) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids));
}

interface PaperArchiveProps {
  papers: QuestionPaper[];
}

export function PaperArchive({ papers }: PaperArchiveProps) {
  const [archivedIds, setArchivedIds] = useState<string[]>(getArchivedPaperIds());
  const { toast } = useToast();

  const toggleArchive = (paperId: string | number) => {
    const id = String(paperId);
    const current = getArchivedPaperIds();
    let updated: string[];
    if (current.includes(id)) {
      updated = current.filter(i => i !== id);
      toast({ title: 'Unarchived', description: 'Paper marked as active.' });
    } else {
      updated = [...current, id];
      toast({ title: 'Archived', description: 'Paper marked as "Used in Exam".' });
    }
    saveArchivedIds(updated);
    setArchivedIds(updated);
  };

  const archivedPapers = papers.filter(p => archivedIds.includes(String(p.id)));
  const activePapers = papers.filter(p => !archivedIds.includes(String(p.id)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5" />Paper Archive
        </CardTitle>
        <CardDescription>Mark papers as "Used in Exam" to archive them</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 text-sm">
          <Badge variant="default" className="bg-green-500">{activePapers.length} Active</Badge>
          <Badge variant="secondary">{archivedPapers.length} Archived</Badge>
        </div>

        {papers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No papers available</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {papers.map(paper => {
              const isArchived = archivedIds.includes(String(paper.id));
              return (
                <div key={paper.id} className={`flex items-center justify-between p-3 border rounded-lg ${isArchived ? 'bg-gray-50 opacity-70' : ''}`}>
                  <div>
                    <p className="text-sm font-medium">{paper.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(paper.generatedAt).toLocaleDateString()} · {paper.config.totalMarks} marks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isArchived && <Badge variant="secondary" className="text-xs">Used in Exam</Badge>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleArchive(paper.id)}
                      className={isArchived ? 'text-green-600' : 'text-orange-600'}
                    >
                      {isArchived ? (
                        <><RotateCcw className="w-3 h-3 mr-1" />Restore</>
                      ) : (
                        <><CheckSquare className="w-3 h-3 mr-1" />Mark Used</>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
