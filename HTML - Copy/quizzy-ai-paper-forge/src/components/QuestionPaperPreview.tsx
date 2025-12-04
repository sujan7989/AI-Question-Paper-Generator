
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { downloadPaperAsPDF, type QuestionPaper } from '@/lib/paper';

interface QuestionPaperPreviewProps {
  paper: QuestionPaper;
  onBack?: () => void;
}

export function QuestionPaperPreview({ paper, onBack }: QuestionPaperPreviewProps) {
  // Debug logging
  console.log('QuestionPaperPreview received paper:', paper);
  
  // Error handling for missing paper data
  if (!paper) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Error: No paper data available to preview</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => downloadPaperAsPDF(paper)}>
            <Download className="w-4 h-4 mr-2" />
            Download as PDF
          </Button>
          {(window as any).currentQuestionPaperHTML && (
            <Button 
              variant="outline"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write((window as any).currentQuestionPaperHTML);
                  printWindow.document.close();
                  setTimeout(() => printWindow.print(), 250);
                }
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Print
            </Button>
          )}
        </div>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="text-center border-b">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{paper.subjectName || 'Question Paper'}</h2>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {paper.generatedAt ? new Date(paper.generatedAt).toLocaleDateString() : 'Unknown Date'}
              </div>
              <Badge variant="outline">
                Max Marks: {paper.config?.totalMarks || 'N/A'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="prose max-w-none">
            {/* Check if HTML format is available */}
            {(window as any).currentQuestionPaperHTML ? (
              <div 
                dangerouslySetInnerHTML={{ __html: (window as any).currentQuestionPaperHTML }}
                className="kalasalingam-paper"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {paper.content || 'No content available'}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}