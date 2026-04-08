// AI Question Generation - Multiple provider support

export type ApiProvider = 'local' | 'gemini' | 'nvidia' | 'openrouter' | 'anthropic';

/**
 * Generate questions from PDF files directly
 */
export async function generateQuestionsFromPDFs(
  provider: ApiProvider,
  pdfFiles: Array<{ unitName: string; file: File; weightage: number }>,
  subjectName: string,
  totalMarks: number,
  questionConfig: {
    totalQuestions: number;
    difficulty: string;
    parts: Array<{ name: string; questions: number; marks: number }>;
  }
): Promise<string> {
  if (pdfFiles.length === 0) {
    throw new Error('No PDF files provided.');
  }
  switch (provider) {
    case 'nvidia': return await generateWithNvidiaAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    case 'gemini': return await generateWithGeminiAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    case 'openrouter': return await generateWithOpenRouterAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    case 'local': return await generateLocalFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    default: return await generateWithNvidiaAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
  }
}

/**
 * Generate questions from a full prompt string.
 * NVIDIA is primary — it's the only reliable provider with a valid key.
 */
export async function generateQuestions(_provider: ApiProvider, prompt: string): Promise<string> {
  // Groq — 1-2s response, free, reliable when not rate limited
  const groqResult = await generateWithGroq(prompt);
  if (groqResult && groqResult.length > 100) return groqResult;

  // NVIDIA fallback via proxy
  const nvidiaResult = await generateWithNvidiaAIFullPrompt(prompt);
  if (nvidiaResult && nvidiaResult.length > 100) return nvidiaResult;

  throw new Error('AI providers are busy. Please try again in a moment.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove "according to the text / mentioned in the material" phrases */
function cleanAIOutput(text: string): string {
  return text
    .replace(/\b(according to the (introductory |study |given |provided )?(text|material|document|introduction|passage|content))[,.]?\s*/gi, '')
    .replace(/\b(as (mentioned|stated|described|discussed|presented|outlined) in the (text|material|document|study material|introduction))[,.]?\s*/gi, '')
    .replace(/\b(based on the (text|material|study material|document|introduction))[,.]?\s*/gi, '')
    .replace(/\b(in the (context of the )?(text|material|study material|document|introduction))[,.]?\s*/gi, '')
    .replace(/\b(the (text|material|document|study material) (mentions|states|describes|discusses|presents|outlines))\s*/gi, '')
    .trim();
}

/** Clean Groq-specific artifacts — it adds hints after the | separator and sometimes stutters */
function cleanGroqOutput(text: string): string {
  return text.split('\n').map(line => {
    const trimmed = line.trim();
    if (!/^Q?\d+[\.\)]/i.test(trimmed)) return line;

    // Fix double-letter stuttering: "Mininng" → "Mining", "RRemember" → "Remember"
    const fixed = trimmed.replace(/([a-zA-Z])\1{2,}/g, '$1$1'); // max 2 consecutive same letters

    // Extract clean format: Q[n]. question | Bloom | CO[n]
    const match = fixed.match(/^(Q?\d+[\.\)]\s*.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)[^|]*\|\s*(CO[234]|\w+)/i);
    if (match) {
      const co = /^CO[234]$/i.test(match[3]) ? match[3].toUpperCase() : 'CO2';
      return `${match[1].trim()} | ${match[2]} | ${co}`;
    }
    return fixed;
  }).join('\n');
}

function cleanQuestionOutput(text: string, subjectName?: string): string {
  return text.split('\n').map(line => {
    if (/^Q?\d+[\.\)]/i.test(line.trim())) {
      let cleaned = cleanAIOutput(line);
      // Remove subject name from inside questions if it appears
      if (subjectName) {
        const escaped = subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(`\\s+in\\s+${escaped}|\\s+of\\s+${escaped}|\\s+as a type of\\s+${escaped}|\\s+in the context of\\s+${escaped}`, 'gi'), '');
      }
      return cleaned;
    }
    return line;
  }).join('\n');
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

/** Groq — fastest inference, free tier, handles full output without cutoff */
async function generateWithGroq(fullPrompt: string): Promise<string> {
  // Retry up to 3 times with delay on 429
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        // Wait 2s on first retry, 4s on second
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${window.location.origin}/api/groq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a university professor writing exam questions. Output ONLY questions in this exact format: Q1. question | Bloom | CO2. No MCQ options. No answers. No extra text. Just the questions.'
            },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2500,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (response.status === 429) {
        // Rate limited — wait and retry
        continue;
      }

      if (response.ok) {
        const data = await response.json();
        const raw: string = data.choices?.[0]?.message?.content || '';
        if (raw.trim().length < 50) return '';
        // Return raw output — parser in paper.ts handles format variations
        return raw;
      }
      return '';
    } catch { continue; }
  }
  return '';
}

/** OpenRouter auto — picks fastest available free model, responds in 1-3 seconds */
async function generateWithOpenRouterFast(fullPrompt: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(`${window.location.origin}/api/openrouter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
        max_tokens: 6000,
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text.trim().length > 100) return cleanQuestionOutput(text);
    }
    return '';
  } catch { return ''; }
}

/** Call NVIDIA directly from browser — DISABLED: key exposure risk, use proxy instead */
async function generateWithNvidiaDirect(_fullPrompt: string): Promise<string> {
  return ''; // Disabled — all NVIDIA calls go through /api/nvidia proxy
}

async function generateWithClaudeSonnet(fullPrompt: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(`${window.location.origin}/api/openrouter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text.trim().length > 100) return cleanQuestionOutput(text);
    }
    return '';
  } catch { return ''; }
}

async function generateWithGeminiAIFullPrompt(fullPrompt: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(`${window.location.origin}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text.trim().length > 50) return cleanQuestionOutput(text);
    }
    return '';
  } catch { return ''; }
}

/** Call NVIDIA directly from browser — DISABLED: key exposure risk, use proxy instead */
async function generateWithNvidiaDirectBrowser(_fullPrompt: string): Promise<string> {
  return ''; // Disabled — all NVIDIA calls go through /api/nvidia proxy
}

async function generateWithNvidiaAIFullPrompt(fullPrompt: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(`${window.location.origin}/api/nvidia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',  // Fast 8B model — responds in 2-3s
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 3000,
        stream: false
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text.trim().length > 50) return cleanQuestionOutput(text);
    }
    return '';
  } catch { return ''; }
}

async function generateWithAnthropicAIFullPrompt(fullPrompt: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(`${window.location.origin}/api/anthropic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [{ role: 'user', content: fullPrompt }]
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (response.ok) {
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      if (text.trim().length > 50) return cleanQuestionOutput(text);
    }
    return '';
  } catch { return ''; }
}

async function generateWithOpenRouterAIFullPrompt(fullPrompt: string): Promise<string> {
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemma-3-27b-it:free',
    'openrouter/auto',
  ];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 9000);
      const response = await fetch(`${window.location.origin}/api/openrouter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: fullPrompt }], temperature: 0.7, max_tokens: 4096 }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text.trim().length > 50) return cleanQuestionOutput(text);
      }
    } catch { /* try next */ }
  }
  // All failed — use local extraction
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-fallback-warning', {
      detail: { message: 'All AI providers are busy. Try again in a minute.' }
    }));
  }
  return localExtractQuestions(fullPrompt);
}

// ---------------------------------------------------------------------------
// Local fallback — extracts real terms from PDF content in the prompt
// ---------------------------------------------------------------------------

function localExtractQuestions(fullPrompt: string): string {
  const materialMatch = fullPrompt.match(/STUDY MATERIAL[^:]*:\s*([\s\S]*?)(?=\nSTRICT RULES:|RULES:|GENERATE ALL)/i);
  const material = materialMatch ? materialMatch[1].trim() : '';

  // If no material found, return empty so the error is shown to user
  if (material.length < 50) return '';

  const partsSection = fullPrompt.match(/PARTS[^:]*:\s*([\s\S]*?)(?=\nSTUDY MATERIAL|STUDY MATERIAL)/i);
  const partsText = partsSection ? partsSection[1] : '';
  const partMatches = [...partsText.matchAll(/(\w+\s+\w+):\s*(\d+)\s+questions?\s*\(Q(\d+)[–\-]Q(\d+)\)[^,]*,\s*(\d+)\s+marks[^,]*,\s*(\w+)\s+difficulty/gi)];
  const sentences = material.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 300);
  const terms = extractTermsFromMaterial(material);
  const questions: string[] = [];
  let qNum = 1;

  if (partMatches.length > 0) {
    for (const match of partMatches) {
      const count = parseInt(match[2]);
      const difficulty = match[6].toLowerCase();
      for (let i = 0; i < count; i++) {
        questions.push(buildQuestionFromMaterial(qNum++, terms, sentences, difficulty, i));
      }
    }
  } else {
    for (let i = 0; i < 25; i++) {
      const diff = i < 10 ? 'easy' : i < 20 ? 'medium' : 'hard';
      questions.push(buildQuestionFromMaterial(qNum++, terms, sentences, diff, i));
    }
  }
  return questions.join('\n');
}

function extractTermsFromMaterial(text: string): string[] {
  const defTerms = [...text.matchAll(/([A-Za-z][A-Za-z\s]{2,40}?)\s+(?:is defined as|refers to|is called|means|is a|are)/g)]
    .map(m => m[1].trim()).filter(t => t.length > 3 && t.length < 50);
  const headingTerms = text.split('\n')
    .filter(l => l.trim().length > 3 && l.trim().length < 80 && /^[A-Z]/.test(l.trim()))
    .map(l => l.trim());
  const all = [...new Set([...defTerms, ...headingTerms])].filter(t => t.length > 3);
  return all.length > 0 ? all : ['the concept', 'the method', 'the algorithm'];
}

function buildQuestionFromMaterial(num: number, terms: string[], _sentences: string[], difficulty: string, idx: number): string {
  const term = terms[idx % terms.length] || 'the concept';
  const co = `CO${2 + (idx % 3)}`;
  const easy = [`Q${num}. Define ${term}. | Remember | ${co}`, `Q${num}. What is ${term}? | Remember | ${co}`];
  const medium = [`Q${num}. Explain ${term} with an example. | Understand | ${co}`, `Q${num}. Compare ${term} with ${terms[(idx + 1) % terms.length] || 'related concepts'}. | Analyze | ${co}`];
  const hard = [`Q${num}. Analyze the advantages and disadvantages of ${term}. | Analyze | ${co}`, `Q${num}. Evaluate the effectiveness of ${term} in real-world applications. | Evaluate | ${co}`];
  const t = difficulty === 'easy' ? easy : difficulty === 'medium' ? medium : hard;
  return t[idx % t.length];
}

// ---------------------------------------------------------------------------
// PDF-file based generation (used by generateQuestionsFromPDFs)
// ---------------------------------------------------------------------------

async function generateWithNvidiaAIFromPDFs(pdfFiles: Array<{ unitName: string; file: File; weightage: number }>, subjectName: string, totalMarks: number, questionConfig: any): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let content = '';
  for (const f of pdfFiles) {
    const e = await extractRealPDFContent(f.file);
    if (e.success && e.text) content += `\n\n=== ${f.unitName} ===\n${e.text}`;
  }
  if (content.length < 100) throw new Error('Failed to extract content from PDFs');
  const prompt = `Generate a question paper for "${subjectName}" (${totalMarks} marks) from this content:\n${content.substring(0, 4000)}`;
  const r = await fetch(`${window.location.origin}/api/nvidia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'meta/llama-3.1-405b-instruct', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }) });
  if (r.ok) { const d = await r.json(); return d.choices[0].message.content; }
  throw new Error('NVIDIA proxy failed');
}

async function generateWithGeminiAIFromPDFs(pdfFiles: Array<{ unitName: string; file: File; weightage: number }>, subjectName: string, totalMarks: number, _qc: any): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let content = '';
  for (const f of pdfFiles) { const e = await extractRealPDFContent(f.file); if (e.success && e.text) content += `\n\n=== ${f.unitName} ===\n${e.text}`; }
  if (content.length < 100) throw new Error('Failed to extract content from PDFs');
  const prompt = `Generate a question paper for "${subjectName}" (${totalMarks} marks) from:\n${content.substring(0, 4000)}`;
  const r = await fetch(`${window.location.origin}/api/gemini`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gemini-1.5-flash-latest', contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4000 } }) });
  if (r.ok) { const d = await r.json(); return d.candidates[0].content.parts[0].text; }
  throw new Error('Gemini proxy failed');
}

async function generateWithOpenRouterAIFromPDFs(pdfFiles: Array<{ unitName: string; file: File; weightage: number }>, subjectName: string, totalMarks: number, _qc: any): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let content = '';
  for (const f of pdfFiles) { const e = await extractRealPDFContent(f.file); if (e.success && e.text) content += `\n\n=== ${f.unitName} ===\n${e.text}`; }
  if (content.length < 100) throw new Error('Failed to extract content from PDFs');
  const prompt = `Generate a question paper for "${subjectName}" (${totalMarks} marks) from:\n${content.substring(0, 4000)}`;
  const r = await fetch(`${window.location.origin}/api/openrouter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct:free', messages: [{ role: 'user', content: prompt }] }) });
  if (r.ok) { const d = await r.json(); return d.choices[0].message.content; }
  throw new Error('OpenRouter proxy failed');
}

export async function generateLocalFromPDFs(pdfFiles: Array<{ unitName: string; file: File; weightage: number }>, subjectName: string, totalMarks: number, _qc: any): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let content = '';
  for (const f of pdfFiles) { const e = await extractRealPDFContent(f.file); if (e.success && e.text) content += `\n\n=== ${f.unitName} ===\n${e.text}`; }
  if (content.length < 100) throw new Error('Failed to extract content from PDFs');
  return localExtractQuestions(content);
}
