import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, ExternalLink, Key, FileDown, BarChart2, Sparkles, Pencil, Check, X, RefreshCw } from 'lucide-react';
import { downloadPaperAsPDF, generateAnswerKeyHTML, exportPaperAsWord, type QuestionPaper, type KalasalingamQuestion } from '@/lib/paper';
import { useEffect, useRef, useState } from 'react';
import { type ApiProvider } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { type EvaluationReport } from '@/lib/evaluator';

interface QuestionPaperPreviewProps {
  paper: QuestionPaper;
  onBack?: () => void;
  apiProvider?: ApiProvider;
  prompt?: string;
  evaluationReport?: EvaluationReport | null;
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

const bloomColors: Record<string, string> = {
  Remember: 'bg-blue-100 text-blue-700',
  Understand: 'bg-green-100 text-green-700',
  Apply: 'bg-yellow-100 text-yellow-700',
  Analyze: 'bg-orange-100 text-orange-700',
  Evaluate: 'bg-red-100 text-red-700',
  Create: 'bg-purple-100 text-purple-700',
};

const confidenceColors: Record<string, string> = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-red-100 text-red-700',
};

/**
 * Rebuild the paper HTML by replacing question text in the existing HTML.
 * Finds each <td> that contains the original question text and swaps it.
 */
function regeneratePaperHTML(paper: QuestionPaper, updatedQuestions: KalasalingamQuestion[]): string {
  let html = paper.content;
  if (!html) return html;

  // Parse original questions to get old text → new text mapping
  const original = parseQuestionsForStats(paper.questions[0]?.question || '');

  original.forEach((orig, i) => {
    const updated = updatedQuestions[i];
    if (!updated || orig.question === updated.question) return;

    // Escape special regex chars in original question text
    const escaped = orig.question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      html = html.replace(new RegExp(escaped, 'g'), updated.question);
    } catch {
      // If regex fails, skip — don't break the paper
    }
  });

  return html;
}

export function QuestionPaperPreview({ paper, onBack, apiProvider = 'nvidia', evaluationReport }: QuestionPaperPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const answerKeyIframeRef = useRef<HTMLIFrameElement>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [answerKeyHTML, setAnswerKeyHTML] = useState('');

  // Inline edit state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<KalasalingamQuestion[]>([]);
  const [currentPaperHTML, setCurrentPaperHTML] = useState(paper?.content || '');

  const { toast } = useToast();

  const parsedQuestions = parseQuestionsForStats(paper?.questions[0]?.question || '');

  // Initialise editable questions from parsed
  useEffect(() => {
    if (parsedQuestions.length > 0 && editedQuestions.length === 0) {
      setEditedQuestions(parsedQuestions);
    }
  }, [parsedQuestions.length]);

  // Regenerate paper HTML when editedQuestions change
  useEffect(() => {
    if (editedQuestions.length > 0) {
      const updatedHTML = regeneratePaperHTML(paper, editedQuestions);
      setCurrentPaperHTML(updatedHTML);
    }
  }, [editedQuestions, paper]);

  const bloomCounts: Record<string, number> = {};
  parsedQuestions.forEach(q => { bloomCounts[q.pattern] = (bloomCounts[q.pattern] || 0) + 1; });

  const coCounts: Record<string, number> = {};
  parsedQuestions.forEach(q => { const k = `CO${q.mappingCO}`; coCounts[k] = (coCounts[k] || 0) + 1; });

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

  useEffect(() => { renderToIframe(iframeRef, currentPaperHTML); }, [currentPaperHTML]);
  useEffect(() => { if (showAnswerKey && answerKeyHTML) renderToIframe(answerKeyIframeRef, answerKeyHTML); }, [showAnswerKey, answerKeyHTML]);

  const handleAnswerKey = () => {
    setAnswerKeyHTML(generateAnswerKeyHTML(paper));
    setShowAnswerKey(true);
  };

  const openInNewWindow = () => {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(currentPaperHTML); w.document.close(); }
  };

  // Save inline edit
  const handleSaveEdit = (idx: number) => {
    const updated = [...editedQuestions];
    updated[idx] = { ...updated[idx], question: editValue };
    setEditedQuestions(updated);
    setEditingIdx(null);
    toast({ title: 'Question updated', description: 'Edit saved locally.' });
  };

  // Regenerate a single question via AI
  const handleRegenerateQuestion = async (idx: number) => {
    const q = editedQuestions[idx];
    if (!q) return;
    setRegeneratingIdx(idx);
    try {
      const prompt = `You are an exam question writer. Rewrite the following exam question to be clearer and more academically rigorous, keeping the same Bloom's level (${q.pattern}) and topic. Return ONLY the new question text, nothing else.\n\nOriginal: ${q.question}`;
      const response = await fetch(`${window.location.origin}/api/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-405b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const newQ = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        const updated = [...editedQuestions];
        updated[idx] = { ...updated[idx], question: newQ };
        setEditedQuestions(updated);
        toast({ title: 'Question regenerated', description: 'AI rewrote the question.' });
      } else {
        toast({ title: 'Regeneration failed', description: 'Try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Regeneration failed', description: 'Network error.', variant: 'destructive' });
    } finally {
      setRegeneratingIdx(null);
    }
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
          <Button variant="outline" onClick={() => downloadPaperAsPDF({ ...paper, content: currentPaperHTML })}>
            <Download className="w-4 h-4 mr-2" />Print / PDF
          </Button>
          <Button variant="outline" onClick={() => { exportPaperAsWord({ ...paper, content: currentPaperHTML }); toast({ title: 'Word Export', description: 'Downloaded as .doc file.' }); }}>
            <FileDown className="w-4 h-4 mr-2" />Export Word
          </Button>
          <Button variant={showStats ? 'secondary' : 'outline'} onClick={() => setShowStats(s => !s)}>
            <BarChart2 className="w-4 h-4 mr-2" />{showStats ? 'Hide Stats' : 'Paper Stats'}
          </Button>
          {evaluationReport && (
            <Button variant={showEvaluation ? 'secondary' : 'outline'} onClick={() => setShowEvaluation(s => !s)}>
              <Sparkles className="w-4 h-4 mr-2" />{showEvaluation ? 'Hide AI Eval' : 'AI Evaluation'}
            </Button>
          )}
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

      {/* AI Evaluation Panel */}
      {showEvaluation && evaluationReport && (
        <div className="border rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />AI Evaluation Report
            </h4>
            <div className="flex gap-3 text-xs flex-wrap">
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                Avg difficulty: <strong>{(evaluationReport.overall_difficulty * 100).toFixed(0)}%</strong>
              </span>
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                Bloom coverage: <strong>{evaluationReport.coverage_score}%</strong>
              </span>
              {evaluationReport.redundancy_count > 0 && (
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200">
                  {evaluationReport.redundancy_count} redundant
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{evaluationReport.summary}</p>

          {/* Per-question evaluation */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {evaluationReport.evaluations.slice(0, 20).map((e, i) => (
              <div key={i} className={`bg-white dark:bg-gray-800 rounded-lg p-3 border text-xs space-y-1 ${e.redundant ? 'border-red-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">
                    Q{i + 1}. {e.question.slice(0, 80)}{e.question.length > 80 ? '…' : ''}
                  </p>
                  <div className="flex gap-1 flex-wrap shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${bloomColors[e.bloom_level] || 'bg-gray-100 text-gray-700'}`}>
                      {e.bloom_level}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${confidenceColors[e.confidence]}`}>
                      {e.confidence}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {(e.difficulty_score * 100).toFixed(0)}%
                    </span>
                    {e.redundant && <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Redundant</span>}
                    {!e.bloom_accurate && <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">Bloom mismatch</span>}
                  </div>
                </div>
                {e.explanation && (
                  <p className="text-gray-500 dark:text-gray-400 italic">{e.explanation}</p>
                )}
                {e.unit_source && (
                  <p className="text-indigo-600 dark:text-indigo-400">Source: {e.unit_source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Question Editor */}
      {editedQuestions.length > 0 && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900/40">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Pencil className="w-4 h-4" />Edit Questions
            <span className="text-xs text-muted-foreground font-normal">— click edit on any question to modify or regenerate it</span>
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {editedQuestions.map((q, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border p-3 text-sm">
                {editingIdx === idx ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full border rounded p-2 text-sm resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      rows={3}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(idx)}>
                        <Check className="w-3 h-3 mr-1" />Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingIdx(null)}>
                        <X className="w-3 h-3 mr-1" />Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground mr-2">Q{q.number}.</span>
                      <span className="text-gray-800 dark:text-gray-200">{q.question}</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${bloomColors[q.pattern] || 'bg-gray-100 text-gray-700'}`}>{q.pattern}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">CO{q.mappingCO}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingIdx(idx); setEditValue(q.question); }}
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRegenerateQuestion(idx)}
                        disabled={regeneratingIdx === idx}
                        title="Regenerate with AI"
                      >
                        <RefreshCw className={`w-3 h-3 ${regeneratingIdx === idx ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
