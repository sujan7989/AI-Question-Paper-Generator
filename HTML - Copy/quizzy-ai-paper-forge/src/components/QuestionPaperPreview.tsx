import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, ExternalLink, Key, FileDown, BarChart2, Sparkles, Pencil, Check, X, RefreshCw, BookMarked, Link, ChevronDown, History } from 'lucide-react';
import { downloadPaperAsPDF, generateAnswerKeyHTML, exportPaperAsWord, type QuestionPaper, type KalasalingamQuestion } from '@/lib/paper';
import { useEffect, useRef, useState } from 'react';
import { type ApiProvider } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { type EvaluationReport } from '@/lib/evaluator';
import { saveQuestionToBank } from '@/components/QuestionBank';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

// Feature 13: Auto-tag difficulty based on Bloom's level
function getDifficultyTag(bloom: string): { label: string; className: string } {
  if (['Remember', 'Understand'].includes(bloom)) return { label: 'Easy', className: 'bg-green-100 text-green-700' };
  if (['Apply', 'Analyze'].includes(bloom)) return { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Hard', className: 'bg-red-100 text-red-700' };
}

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

function buildAnswerKeyHTML(
  paper: QuestionPaper,
  questions: KalasalingamQuestion[],
  answers: Record<number, string>
): string {
  // Build part-aware marks map
  const parts = paper.config.parts || [];
  let qIndex = 0;
  const marksMap: Record<number, { marks: number; partName: string }> = {};
  for (const part of parts) {
    const count = part.choicesEnabled ? Math.ceil(part.questions * 1.5) : part.questions;
    for (let i = 0; i < count && qIndex < questions.length; i++, qIndex++) {
      marksMap[questions[qIndex].number] = { marks: part.marksPerQuestion, partName: part.name };
    }
  }
  while (qIndex < questions.length) {
    marksMap[questions[qIndex].number] = { marks: 2, partName: 'Part A' };
    qIndex++;
  }

  const rowsHTML = questions.map(q => {
    const answer = answers[q.number];
    const { marks = 2, partName = 'Part A' } = marksMap[q.number] || {};
    const isShortAnswer = marks <= 2;

    let answerHTML = '';
    if (answer) {
      const points = answer.split('•').map(p => p.trim()).filter(p => p.length > 0);
      answerHTML = points.map(p => {
        // Diagram mention
        if (p.startsWith('[Diagram:')) {
          return `<li style="margin-bottom:4px;color:#1a56db;font-style:italic;">📐 ${p.replace(/^\[|\]$/g, '')}</li>`;
        }
        // Formula mention
        if (p.startsWith('[Formula:')) {
          return `<li style="margin-bottom:4px;color:#7e3af2;font-style:italic;">🔢 ${p.replace(/^\[|\]$/g, '')}</li>`;
        }
        // Numbered heading (e.g. "1. Definition: ...")
        if (/^\d+\.\s/.test(p)) {
          return `<li style="margin-bottom:4px;font-weight:bold;">${p}</li>`;
        }
        return `<li style="margin-bottom:4px;">${p}</li>`;
      }).join('');
    } else {
      answerHTML = '<li><em style="color:#888;">Refer to study material</em></li>';
    }

    const marksLabel = isShortAnswer
      ? `<span style="font-size:9pt;color:#555;">(${marks} marks — full answer)</span>`
      : `<span style="font-size:9pt;color:#555;">(${marks} marks — key points & structure)</span>`;

    return `
    <tr>
      <td style="padding:6px 10px;border:1px solid #000;text-align:center;font-weight:bold;vertical-align:top;">${q.number}</td>
      <td style="padding:6px 10px;border:1px solid #000;vertical-align:top;">
        <div>${q.question}</div>
        <div style="margin-top:3px;font-size:9pt;color:#777;">${partName} | ${q.pattern} | CO${q.mappingCO}</div>
      </td>
      <td style="padding:6px 10px;border:1px solid #000;background:${isShortAnswer ? '#f0fff4' : '#fffde7'};vertical-align:top;">
        <div style="margin-bottom:4px;">${marksLabel}</div>
        <ul style="margin:0;padding-left:16px;font-size:10pt;">${answerHTML}</ul>
      </td>
    </tr>`;
  }).join('');

  // Group by part for part headers
  let currentPart = '';
  const rowsWithHeaders = questions.map(q => {
    const { partName = 'Part A' } = marksMap[q.number] || {};
    let header = '';
    if (partName !== currentPart) {
      currentPart = partName;
      header = `<tr><td colspan="3" style="padding:6px 10px;border:1px solid #000;font-weight:bold;background:#e8e8e8;font-size:11pt;">${partName}</td></tr>`;
    }
    const answer = answers[q.number];
    const { marks = 2 } = marksMap[q.number] || {};
    const isShortAnswer = marks <= 2;

    let answerHTML = '';
    if (answer) {
      const points = answer.split('•').map(p => p.trim()).filter(p => p.length > 0);
      answerHTML = points.map(p => {
        if (p.startsWith('[Diagram:')) return `<li style="margin-bottom:4px;color:#1a56db;font-style:italic;">📐 ${p.replace(/^\[|\]$/g, '')}</li>`;
        if (p.startsWith('[Formula:')) return `<li style="margin-bottom:4px;color:#7e3af2;font-style:italic;">🔢 ${p.replace(/^\[|\]$/g, '')}</li>`;
        if (/^\d+\.\s/.test(p)) return `<li style="margin-bottom:4px;font-weight:bold;">${p}</li>`;
        return `<li style="margin-bottom:4px;">${p}</li>`;
      }).join('');
    } else {
      answerHTML = '<li><em style="color:#888;">Refer to study material</em></li>';
    }

    const marksLabel = isShortAnswer
      ? `<span style="font-size:9pt;color:#2d6a4f;">(${marks} marks — complete answer)</span>`
      : `<span style="font-size:9pt;color:#7e5a00;">(${marks} marks — structure & key points)</span>`;

    return header + `
    <tr>
      <td style="padding:6px 10px;border:1px solid #000;text-align:center;font-weight:bold;vertical-align:top;">${q.number}</td>
      <td style="padding:6px 10px;border:1px solid #000;vertical-align:top;">
        <div>${q.question}</div>
        <div style="margin-top:3px;font-size:9pt;color:#777;">${q.pattern} | CO${q.mappingCO}</div>
      </td>
      <td style="padding:6px 10px;border:1px solid #000;background:${isShortAnswer ? '#f0fff4' : '#fffde7'};vertical-align:top;">
        <div style="margin-bottom:4px;">${marksLabel}</div>
        <ul style="margin:0;padding-left:16px;font-size:10pt;">${answerHTML}</ul>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${paper.subjectName} - Answer Key</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; margin: 15mm; font-size: 11pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { padding: 6px 10px; border: 1px solid #000; background: #d0d0d0; font-weight: bold; }
  h2 { text-align: center; margin-bottom: 4px; }
  .subtitle { text-align: center; color: #555; margin-bottom: 16px; font-size: 10pt; }
  .legend { display:flex; gap:20px; font-size:9pt; margin-bottom:10px; }
  @media print { body { margin: 0; } @page { margin: 15mm; size: A4; } }
</style>
</head>
<body>
  <h2>ANSWER KEY / MARKING SCHEME</h2>
  <div class="subtitle">
    KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION (Deemed to be University)<br/>
    ${paper.subjectName} &nbsp;|&nbsp; Total Marks: ${paper.config.totalMarks} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}
  </div>
  <div class="legend">
    <span style="background:#f0fff4;padding:2px 8px;border:1px solid #ccc;">🟢 Green = Complete answer (2 marks)</span>
    <span style="background:#fffde7;padding:2px 8px;border:1px solid #ccc;">🟡 Yellow = Structure &amp; key points (long answer)</span>
    <span style="color:#1a56db;">📐 Blue = Diagram required</span>
    <span style="color:#7e3af2;">🔢 Purple = Formula/Calculation required</span>
  </div>
  <table>
    <tr>
      <th style="width:5%">Q.No</th>
      <th style="width:35%">Question</th>
      <th style="width:60%">Model Answer / Key Points</th>
    </tr>
    ${rowsWithHeaders}
  </table>
  <p style="margin-top:16px;font-size:9pt;color:#555;">
    <strong>Note:</strong> 2-mark answers are complete. Long answers show structure, headings, diagrams and formulas required — not the full essay.
  </p>
</body>
</html>`;
}

export function QuestionPaperPreview({ paper, onBack, apiProvider = 'nvidia', evaluationReport }: QuestionPaperPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const answerKeyIframeRef = useRef<HTMLIFrameElement>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [answerKeyHTML, setAnswerKeyHTML] = useState('');
  const [answerKeyLoading, setAnswerKeyLoading] = useState(false);

  // Inline edit state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<KalasalingamQuestion[]>([]);
  const [currentPaperHTML, setCurrentPaperHTML] = useState(paper?.content || '');

  // Version history — snapshot before every regeneration so user can restore
  type Snapshot = { label: string; questions: KalasalingamQuestion[]; timestamp: string };
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const saveSnapshot = (label: string, questions: KalasalingamQuestion[]) => {
    if (questions.length === 0) return;
    setSnapshots(prev => [
      { label, questions: [...questions], timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9), // keep last 10 snapshots
    ]);
  };

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

  const handleAnswerKey = async () => {
    if (answerKeyHTML) { setShowAnswerKey(true); return; }
    setAnswerKeyLoading(true);
    setShowAnswerKey(true);
    try {
      const questions = editedQuestions.length > 0 ? editedQuestions : parsedQuestions;
      if (questions.length === 0) {
        setAnswerKeyHTML(generateAnswerKeyHTML(paper));
        return;
      }

      // Build part-aware question list so AI knows marks per question
      const parts = paper.config.parts || [];
      let qIndex = 0;
      const questionWithMarks: Array<{ q: KalasalingamQuestion; marks: number; partName: string }> = [];
      for (const part of parts) {
        const count = part.choicesEnabled ? Math.ceil(part.questions * 1.5) : part.questions;
        for (let i = 0; i < count && qIndex < questions.length; i++, qIndex++) {
          questionWithMarks.push({ q: questions[qIndex], marks: part.marksPerQuestion, partName: part.name });
        }
      }
      // Any remaining questions not covered by parts
      while (qIndex < questions.length) {
        questionWithMarks.push({ q: questions[qIndex], marks: 2, partName: 'Part A' });
        qIndex++;
      }

      const questionList = questionWithMarks.map(({ q, marks, partName }) =>
        `Q${q.number}. [${partName} - ${marks} marks | ${q.pattern}] ${q.question}`
      ).join('\n');

      const prompt = `You are a university professor writing an answer key / marking scheme for "${paper.subjectName}" exam.

For each question, generate the answer based on its marks:

RULE FOR 2-MARK QUESTIONS (Part A):
- Write the COMPLETE direct answer in 2-4 sentences
- Student can write this in 4-6 lines
- No headings needed, just the full answer
- Format: • Complete answer sentence 1 • Complete answer sentence 2

RULE FOR 5-16 MARK QUESTIONS (Part B / Part C):
- DO NOT write the full essay answer
- Give the STRUCTURE and KEY POINTS an examiner looks for:
  → Main headings the answer must cover (e.g., "1. Definition  2. Working Principle  3. Types")
  → If a diagram is needed: write "[Diagram: <diagram name>]" (e.g., "[Diagram: Decision Tree structure]")
  → If a formula/calculation is needed: write "[Formula: <formula in words>]" (e.g., "[Formula: Gini Index = 1 - Σ(pi²)]")
  → 2-3 key sub-points under each heading
- For Part B (5-10 marks): 3-4 main headings with sub-points
- For Part C (10+ marks): 5-6 main headings with sub-points, more diagrams/formulas

QUESTIONS:
${questionList}

FORMAT (strictly follow):
Q1_ANSWER: • point • point • point
Q2_ANSWER: • 1. Heading: sub-point, sub-point • 2. Heading: sub-point • [Diagram: name] • [Formula: name]
(one line per question, use • as separator between points)`;

      const response = await fetch(`${window.location.origin}/api/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-405b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      const answers: Record<number, string> = {};

      if (response.ok) {
        const data = await response.json();
        const text: string = data.choices[0].message.content;
        const matches = text.matchAll(/Q(\d+)_ANSWER:\s*(.+?)(?=Q\d+_ANSWER:|$)/gs);
        for (const m of matches) {
          answers[parseInt(m[1])] = m[2].trim();
        }
      }

      // Build HTML with real answers
      const html = buildAnswerKeyHTML(paper, questions, answers);
      setAnswerKeyHTML(html);
    } catch {
      // Fallback to placeholder if AI fails
      setAnswerKeyHTML(generateAnswerKeyHTML(paper));
    } finally {
      setAnswerKeyLoading(false);
    }
  };

  const openInNewWindow = () => {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(currentPaperHTML); w.document.close(); }
  };

  // Feature 18: Copy shareable link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/?paper=${paper.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Link copied!', description: 'Shareable paper link copied to clipboard.' });
    }).catch(() => {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    });
  };

  // Feature 17: Regenerate a specific part
  const [regeneratingPart, setRegeneratingPart] = useState<string | null>(null);
  const handleRegeneratePart = async (partName: string) => {
    setRegeneratingPart(partName);
    try {
      // Find which questions belong to this part
      const partConfig = paper.config.parts?.find(p => p.name === partName);
      if (!partConfig) {
        toast({ title: 'Part not found', variant: 'destructive' });
        return;
      }

      // Figure out start/end index for this part in editedQuestions
      let startIdx = 0;
      for (const p of paper.config.parts || []) {
        if (p.name === partName) break;
        startIdx += p.choicesEnabled ? Math.ceil(p.questions * 1.5) : p.questions;
      }
      const count = partConfig.choicesEnabled
        ? Math.ceil(partConfig.questions * 1.5)
        : partConfig.questions;
      const endIdx = startIdx + count;

      // Get existing questions for context
      const existingForPart = editedQuestions.slice(startIdx, endIdx);
      const existingText = existingForPart.map(q => `Q${q.number}. ${q.question} | ${q.pattern} | CO${q.mappingCO}`).join('\n');

      const prompt = `You are a university exam question writer for subject "${paper.subjectName}".

Regenerate EXACTLY ${count} NEW questions for ${partName} (${partConfig.marks} marks, ${partConfig.marksPerQuestion} marks each, difficulty: ${(partConfig as any).difficulty || 'medium'}).

Current questions (replace ALL of these with completely new ones):
${existingText}

STRICT FORMAT — every line must look exactly like this:
Q${startIdx + 1}. question text | Bloom | CO2

Rules:
- Bloom must be one of: Remember, Understand, Apply, Analyze, Evaluate, Create
- CO must be CO2, CO3, or CO4
- Number questions starting from Q${startIdx + 1} to Q${endIdx}
- Generate EXACTLY ${count} questions, no more, no less
- Do NOT repeat any existing questions above

Generate Q${startIdx + 1} to Q${endIdx} now:`;

      const response = await fetch(`${window.location.origin}/api/groq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a university professor writing exam questions. Output ONLY questions in the exact format requested. No extra text.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const raw: string = data.choices?.[0]?.message?.content || '';

        if (raw.trim().length < 20) {
          toast({ title: 'No questions returned', description: 'AI returned empty response. Try again.', variant: 'destructive' });
          return;
        }

        // Parse the new questions
        const newLines = raw.split('\n').filter(l => l.trim());
        const newQuestions: typeof editedQuestions = [];

        for (const line of newLines) {
          const m = line.match(/^Q?(\d+)[\.\)]\s*(.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?(\d+)/i);
          if (m) {
            newQuestions.push({
              number: parseInt(m[1]),
              question: m[2].trim(),
              pattern: m[3] as any,
              mappingCO: Math.min(4, Math.max(2, parseInt(m[4]))),
              marks: partConfig.marksPerQuestion,
            });
          }
        }

        if (newQuestions.length === 0) {
          toast({ title: 'Parse failed', description: 'Could not read AI response. Try again.', variant: 'destructive' });
          return;
        }

        // Pad or trim to exact count needed
        while (newQuestions.length < count) {
          const last = newQuestions[newQuestions.length - 1];
          newQuestions.push({ ...last, number: last.number + 1, question: `${last.question} (variant)` });
        }
        const trimmed = newQuestions.slice(0, count);

        // Re-number to match position in full paper
        const renumbered = trimmed.map((q, i) => ({ ...q, number: startIdx + i + 1 }));

        // Splice into editedQuestions — save snapshot first
        saveSnapshot(`Before ${partName} regen`, editedQuestions);
        const updated = [...editedQuestions];
        updated.splice(startIdx, count, ...renumbered);
        setEditedQuestions(updated);

        toast({ title: `${partName} regenerated ✓`, description: `${renumbered.length} new questions generated.` });
      } else {
        // Fallback to NVIDIA if Groq fails
        const nvRes = await fetch(`${window.location.origin}/api/nvidia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });
        if (nvRes.ok) {
          const nvData = await nvRes.json();
          const raw: string = nvData.choices?.[0]?.message?.content || '';
          const newLines = raw.split('\n').filter(l => l.trim());
          const newQuestions: typeof editedQuestions = [];
          for (const line of newLines) {
            const m = line.match(/^Q?(\d+)[\.\)]\s*(.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?(\d+)/i);
            if (m) newQuestions.push({ number: parseInt(m[1]), question: m[2].trim(), pattern: m[3] as any, mappingCO: Math.min(4, Math.max(2, parseInt(m[4]))), marks: partConfig.marksPerQuestion });
          }
          if (newQuestions.length > 0) {
            while (newQuestions.length < count) { const last = newQuestions[newQuestions.length - 1]; newQuestions.push({ ...last, number: last.number + 1 }); }
            const renumbered = newQuestions.slice(0, count).map((q, i) => ({ ...q, number: startIdx + i + 1 }));
            saveSnapshot(`Before ${partName} regen (fallback)`, editedQuestions);
            const updated = [...editedQuestions];
            updated.splice(startIdx, count, ...renumbered);
            setEditedQuestions(updated);
            toast({ title: `${partName} regenerated ✓`, description: `${renumbered.length} new questions generated.` });
            return;
          }
        }
        toast({ title: 'Regeneration failed', description: 'Both AI providers failed. Try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Regeneration failed', description: 'Network error. Try again.', variant: 'destructive' });
    } finally {
      setRegeneratingPart(null);
    }
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
        saveSnapshot(`Before Q${q.number} regen`, editedQuestions);
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
          <Button variant={showAnswerKey ? 'secondary' : 'outline'} onClick={() => showAnswerKey ? setShowAnswerKey(false) : handleAnswerKey()} disabled={answerKeyLoading}>
            <Key className="w-4 h-4 mr-2" />
            {answerKeyLoading ? 'Generating Answers...' : showAnswerKey ? 'Hide Answer Key' : 'Answer Key'}
          </Button>
          {/* Feature 18: Copy Link */}
          <Button variant="outline" onClick={handleCopyLink}>
            <Link className="w-4 h-4 mr-2" />Copy Link
          </Button>
          {/* Version History */}
          {snapshots.length > 0 && (
            <Button variant={showHistory ? 'secondary' : 'outline'} onClick={() => setShowHistory(s => !s)}>
              <History className="w-4 h-4 mr-2" />
              History ({snapshots.length})
            </Button>
          )}
          {/* Feature 17: Regenerate Part */}
          {paper.config.parts && paper.config.parts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!!regeneratingPart}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingPart ? 'animate-spin' : ''}`} />
                  {regeneratingPart ? `Regenerating ${regeneratingPart}...` : 'Regenerate Part'}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {paper.config.parts.map(part => (
                  <DropdownMenuItem key={part.name} onClick={() => handleRegeneratePart(part.name)}>
                    Regenerate {part.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        Tip: Click "Open in New Window" for the best print experience.
      </div>

      {/* Version History Panel */}
      {showHistory && snapshots.length > 0 && (
        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              Version History
              <span className="text-xs text-muted-foreground font-normal">— restore any previous version of your questions</span>
            </h4>
            <Button size="sm" variant="ghost" onClick={() => setShowHistory(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {snapshots.map((snap, i) => (
              <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{snap.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">at {snap.timestamp}</span>
                  <span className="text-xs text-muted-foreground ml-2">· {snap.questions.length} questions</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => {
                    saveSnapshot('Before restore', editedQuestions);
                    setEditedQuestions([...snap.questions]);
                    toast({ title: 'Version restored', description: `Restored to: ${snap.label}` });
                  }}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        {/* Feature 13: Difficulty auto-tag */}
                        {(() => { const d = getDifficultyTag(q.pattern); return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.className}`}>{d.label}</span>; })()}
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
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Save to Question Bank"
                        onClick={() => {
                          const saved = saveQuestionToBank({
                            question: q.question,
                            bloom: q.pattern,
                            co: `CO${q.mappingCO}`,
                            subject: paper.subjectName,
                          });
                          toast({ title: saved ? 'Saved to Question Bank' : 'Already in bank' });
                        }}
                      >
                        <BookMarked className="w-3 h-3 text-blue-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Paper iframe — responsive wrapper with horizontal scroll on mobile */}
      <div className="border-2 border-gray-300 rounded-lg bg-white shadow-lg overflow-x-auto">
        <div style={{ minWidth: '600px' }}>
          <iframe ref={iframeRef} title="Question Paper Preview" className="w-full" style={{ border: 'none', minHeight: '800px', display: 'block' }} />
        </div>
      </div>

      {/* Answer Key */}
      {showAnswerKey && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />Answer Key / Marking Scheme
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={answerKeyLoading} onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(answerKeyHTML); w.document.close(); } }}>
                <ExternalLink className="w-4 h-4 mr-1" />Open
              </Button>
              <Button variant="outline" size="sm" disabled={answerKeyLoading} onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(answerKeyHTML); w.document.close(); setTimeout(() => w.print(), 500); } }}>
                <FileText className="w-4 h-4 mr-1" />Print
              </Button>
            </div>
          </div>
          {answerKeyLoading ? (
            <div className="border-2 border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              <p className="text-amber-700 dark:text-amber-400 font-medium text-sm">AI is generating model answers from your PDF content...</p>
              <p className="text-amber-600/70 text-xs">This takes 10–20 seconds</p>
            </div>
          ) : (
            <div className="border-2 border-amber-300 rounded-lg overflow-auto bg-white shadow-lg">
              <iframe ref={answerKeyIframeRef} title="Answer Key" className="w-full" style={{ border: 'none', minHeight: '600px', display: 'block' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
