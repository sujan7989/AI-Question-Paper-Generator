
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, ExternalLink } from 'lucide-react';
import { downloadPaperAsPDF, type QuestionPaper } from '@/lib/paper';
import { useEffect, useRef } from 'react';

interface QuestionPaperPreviewProps {
  paper: QuestionPaper;
  onBack?: () => void;
}

export function QuestionPaperPreview({ paper, onBack }: QuestionPaperPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (iframeRef.current && paper?.content) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(paper.content);
        iframeDoc.close();
        
        // Auto-adjust iframe height after content loads
        setTimeout(() => {
          try {
            const contentHeight = iframeDoc.body.scrollHeight;
            iframe.style.height = Math.max(contentHeight + 50, 800) + 'px';
          } catch (e) {
            console.error('Could not adjust iframe height:', e);
          }
        }, 100);
      }
    }
  }, [paper?.content]);
  
  if (!paper) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p className="text-red-500">Error: No paper data available to preview</p>
      </div>
    );
  }
  
  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=900,height=1200');
    if (newWindow) {
      newWindow.document.write(paper.content);
      newWindow.document.close();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="default" onClick={openInNewWindow}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Window (Recommended)
          </Button>
          <Button variant="outline" onClick={() => downloadPaperAsPDF(paper)}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(paper.content);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
              }
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">
          💡 For best viewing experience, click "Open in New Window" button above
        </p>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-auto bg-white shadow-lg">
        <iframe
          ref={iframeRef}
          title="Question Paper Preview"
          className="w-full"
          style={{ 
            border: 'none',
            minHeight: '800px',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}