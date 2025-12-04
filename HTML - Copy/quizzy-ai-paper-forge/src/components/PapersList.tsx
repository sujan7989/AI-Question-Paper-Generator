import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Eye, Calendar, User } from 'lucide-react';
import { downloadPaperAsPDF, type QuestionPaper } from '@/lib/paper';
import { QuestionPaperPreview } from '@/components/QuestionPaperPreview';

interface PapersListProps {
  papers: QuestionPaper[];
  onBack?: () => void;
}

export function PapersList({ papers, onBack }: PapersListProps) {
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);

  // If a paper is selected for preview, show the preview
  if (selectedPaper) {
    return (
      <QuestionPaperPreview 
        paper={selectedPaper} 
        onBack={() => setSelectedPaper(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {papers.length} papers generated
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent AI Papers</h2>
        
        {papers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-muted-foreground mb-2">No papers generated yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first question paper to see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {papers.slice().reverse().map((paper) => (
              <Card key={paper.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {paper.subjectName || 'Question Paper'}
                        </h3>
                        <Badge variant="outline">
                          {paper.config?.totalMarks || 'N/A'} Marks
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {paper.generatedAt ? new Date(paper.generatedAt).toLocaleDateString() : 'Unknown Date'}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {paper.generatedBy || 'AI System'}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {paper.config?.totalQuestions || paper.questions?.length || 0} Questions
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Difficulty: {paper.config?.difficulty || 'Medium'}</span>
                        <span>•</span>
                        <span>Parts: {paper.config?.parts?.length || 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPaper(paper)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPaperAsPDF(paper)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
