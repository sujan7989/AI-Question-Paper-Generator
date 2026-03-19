import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, ExternalLink, Key, FileDown, BarChart2 } from 'lucide-react';
import { downloadPaperAsPDF, generateAnswerKeyHTML, exportPaperAsWord, type QuestionPaper, type KalasalingamQuestion } from '@/lib/paper';
import { useEffect, useRef, useState } from 'react';
import { type ApiProvider } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface QuestionPaperPreviewProps {
  paper: QuestionPaper;
  onBack?: () => void;
  apiProvider?: ApiProvider;
  prompt?: string;
}

function parseQuestionsForStats(rawText: string): KalasalingamQuestion[] {
  const questions: KalasalingamQuestion[] = [];
  const lines = rawText.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^Q(\d+)\.\s*(.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?(\d+)/i);
    if (m) {
      questions.push({
        number: parseInt(m[1]),
        question: m[2].trim(),
        pattern: m[3] as any,
        mappingCO: parseInt(m[4]),
        marks: 2,
      });
    }
  }
  return questions;
}

export function QuestionPaperPreview({ paper, onBack, apiProvider = 'nvidia' }: QuestionPaperPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const answerKeyIframeRef = useRef<HTMLIFrameElement>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [answerKeyHTML, setAnswerKeyHTML] = useState('');
  const { toast } = useToast();

  const parsedQuestions = parseQuestionsForStats(paper?.questions[0]?.question || '');

  const bloomCounts: Record<string, number> = {};
  parsedQuestions.forEach(q => { bloomCounts[q.pattern] = (bloomCounts[q.pattern] || 0) + 1; });

  const coCounts: Record<string, number> = {};
  parsedQuestions.forEach(q => { const k = `CO${q.mappingCO}`; coCounts[k] = (coCounts[k] || 0) + 1; });

  const bloomColors: Record<string, string> = {
    Remember: 'bg-blue-100 text-blue-700',
    Understand: 'bg-green-100 text-green-700',
    Apply: 'bg-yellow-100 text-yellow-700',
    Analyze: 'bg-orange-100 text-orange-700',
    Evaluate: 'bg-red-100 text-red-700',
    Create: 'bg-purple-100 text-purple-700',
  };

  function renderToIframe(ref: React.RefObject<HTMLIFrameElement>, html: string | undefined) {
    if (!ref.current || !html) return;
    const doc = ref.current.contentDocument || ref.current.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      setTimeout(() => {
        try { ref.current!.style.height = Math.max(doc.body.scrollHeight + 50, 800) + 'px'; } catch (_) {}
      }, 150);
    }
  }

  useEffect(() => { renderToIframe(iframeRef, paper?.content); }, [paper?.content]);
  useEffect(() => { if (showAnswerKey && answerKeyHTML) renderToIframe(answerKeyIframeRef, answerKeyHTML); }, [showAnswerKey, answerKeyHTML]);

  const handleAnswerKey = () => {
    setAnswerKeyHTML(generateAnswerKeyHTML(paper));
    setShowAnswerKey(true);
  };

  const openInNewWindow = () => {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(paper.content); w.document.close(); }
  };

  if (!paper) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <p className="text-red-500">Error: No paper data available to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" onClick={openInNewWindow}>
            <ExternalLink className="w-4 h-4 mr-2" />Open in New Window
          </Button>
          <Button variant="outline" onClick={() => downloadPaperAsPDF(paper)}>
            <Download className="w-4 h-4 mr-2" />Print / PDF
          </Button>
          <Button variant="outline" onClick={() => { exportPaperAsWord(paper); toast({ title: 'Word Export', description: 'Downloaded as .doc file.' }); }}>
            <FileDown className="w-4 h-4 mr-2" />Export Word
          </Button>
          <Button variant={showStats ? 'secondary' : 'outline'} onClick={() => setShowStats(s => !s)}>
            <BarChart2 className="w-4 h-4 mr-2" />{showStats ? 'Hide Stats' : 'Paper Stats'}
          </Button>
          <Button variant={showAnswerKey ? 'secondary' : 'outline'} onClick={() => showAnswerKey ? setShowAnswerKey(false) : handleAnswerKey()}>
            <Key className="w-4 h-4 mr-2" />{showAnswerKey ? 'Hide Answer Key' : 'Answer Key'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        Tip: Click "Open in New Window" for the best print experience.
      </div>

      {/* Stats Panel */}
      {showStats && parsedQuestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/40">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><BarChart2 className="w-4 h-4" />Bloom's Taxonomy</h4>
            <div className="space-y-1">
              {Object.entries(bloomCounts).map(([level, count]) => (
                <div key={level} className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium w-24 text-center ${bloomColors[level] || 'bg-gray-100 text-gray-700'}`}>{level}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-4 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded" style={{ width: `${(count / parsedQuestions.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}q</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">CO Coverage</h4>
            <div className="space-y-1">
              {Object.entries(coCounts).map(([co, count]) => (
                <div key={co} className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded font-medium w-12 text-center bg-amber-100 text-amber-700">{co}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-4 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded" style={{ width: `${(count / parsedQuestions.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}q</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {parsedQuestions.length} questions &nbsp;|&nbsp; {paper.config.totalMarks} marks
            </div>
          </div>
        </div>
      )}

      {/* Question Paper iframe */}
      <div className="border-2 border-gray-300 rounded-lg overflow-auto bg-white shadow-lg">
        <iframe ref={iframeRef} title="Question Paper Preview" className="w-full" style={{ border: 'none', minHeight: '800px', display: 'block' }} />
      </div>

      {/* Answer Key */}
      {showAnswerKey && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />Answer Key / Marking Scheme
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(answerKeyHTML); w.document.close(); } }}>
                <ExternalLink className="w-4 h-4 mr-1" />Open
              </Button>
              <Button variant="outline" size="sm" onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(answerKeyHTML); w.document.close(); setTimeout(() => w.print(), 500); } }}>
                <FileText className="w-4 h-4 mr-1" />Print
              </Button>
            </div>
          </div>
          <div className="border-2 border-amber-300 rounded-lg overflow-auto bg-white shadow-lg">
            <iframe ref={answerKeyIframeRef} title="Answer Key" className="w-full" style={{ border: 'none', minHeight: '600px', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
}
