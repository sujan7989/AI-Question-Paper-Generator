// Feature 1: Paper Comparison View - side by side compare 2 papers
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { type QuestionPaper } from '@/lib/paper';

interface PaperComparisonProps {
  papers: QuestionPaper[];
  onBack: () => void;
}

export function PaperComparison({ papers, onBack }: PaperComparisonProps) {
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  const leftPaper = papers.find(p => String(p.id) === leftId);
  const rightPaper = papers.find(p => String(p.id) === rightId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitCompare className="w-6 h-6" />Paper Comparison
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Paper A</label>
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger><SelectValue placeholder="Select paper A" /></SelectTrigger>
            <SelectContent>
              {papers.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.subjectName} — {new Date(p.generatedAt).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Paper B</label>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger><SelectValue placeholder="Select paper B" /></SelectTrigger>
            <SelectContent>
              {papers.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.subjectName} — {new Date(p.generatedAt).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {leftPaper && rightPaper && (
        <>
          {/* Summary comparison */}
          <div className="grid grid-cols-2 gap-4">
            {[leftPaper, rightPaper].map((paper, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{paper.subjectName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{new Date(paper.generatedAt).toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Marks</span>
                    <Badge variant="outline">{paper.config.totalMarks}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Questions</span>
                    <Badge variant="outline">{paper.config.totalQuestions}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge>{paper.config.difficulty}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parts</span>
                    <Badge variant="secondary">{paper.config.parts?.length || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Side by side iframe view */}
          <div className="grid grid-cols-2 gap-4">
            {[leftPaper, rightPaper].map((paper, i) => (
              <div key={i} className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow">
                <div className="bg-gray-100 px-3 py-1.5 text-xs font-semibold border-b">
                  Paper {i === 0 ? 'A' : 'B'}: {paper.subjectName}
                </div>
                <iframe
                  title={`Paper ${i === 0 ? 'A' : 'B'}`}
                  className="w-full"
                  style={{ border: 'none', height: '600px', display: 'block' }}
                  srcDoc={paper.content}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {(!leftPaper || !rightPaper) && (
        <div className="text-center py-16 text-muted-foreground">
          <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select two papers above to compare them side by side</p>
        </div>
      )}
    </div>
  );
}
