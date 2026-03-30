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
    throw new Error('No PDF files provided. Please ensure PDFs are uploaded for the selected units.');
  }

  switch (provider) {
    case 'nvidia':
      return await generateWithNvidiaAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    case 'gemini':
      return await generateWithGeminiAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    case 'openrouter':
      return await generateWithOpenRouterAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    case 'local':
      return await generateLocalFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
    default:
      return await generateWithNvidiaAIFromPDFs(pdfFiles, subjectName, totalMarks, questionConfig);
  }
}

/**
 * Generate questions from a full prompt string
 */
export async function generateQuestions(provider: ApiProvider, prompt: string): Promise<string> {
  switch (provider) {
    case 'anthropic':
      return await generateWithAnthropicAIFullPrompt(prompt);
    case 'openrouter':
      return await generateWithOpenRouterAIFullPrompt(prompt);
    case 'nvidia':
      return await generateWithNvidiaAIFullPrompt(prompt);
    case 'gemini':
      return await generateWithGeminiAIFullPrompt(prompt);
    case 'local': {
      const contentMatch = prompt.match(/CONTENT TO USE FOR QUESTIONS:\s*([\s\S]*?)(?=\n\nCRITICAL REQUIREMENTS:)/);
      const content = contentMatch ? contentMatch[1].trim() : prompt;
      const subjectMatch = prompt.match(/SUBJECT:\s*([^\n]+)/);
      const subject = subjectMatch ? subjectMatch[1] : 'Subject';
      const marksMatch = prompt.match(/TOTAL MARKS:\s*(\d+)/);
      const totalMarks = marksMatch ? marksMatch[1] : '100';
      return generateQuestionsFromPDFContent(content, subject, totalMarks);
    }
    default:
      return await generateWithOpenRouterAIFullPrompt(prompt);
  }
}

/**
 * Local fallback: generate questions from extracted PDF text
 */
function generateQuestionsFromPDFContent(content: string, subject: string, totalMarks: string): string {
  const partsMatch = content.match(/PARTS CONFIGURATION:([\s\S]*?)CONTENT TO USE FOR QUESTIONS:/);
  let parts: Array<{ name: string; questions: number; marks: number }> = [];

  if (partsMatch) {
    const partLines = partsMatch[1].split('\n').filter(l => l.includes('questions'));
    partLines.forEach(line => {
      const match = line.match(/(\w+\s+\w+)\s+-\s+(\d+)\s+questions\s+×\s+(\d+)\s+marks\s+=\s+(\d+)\s+marks/);
      if (match) {
        parts.push({ name: match[1], questions: parseInt(match[2]), marks: parseInt(match[4]) });
      }
    });
  }

  const contentMatch = content.match(/CONTENT TO USE FOR QUESTIONS:\s*([\s\S]*?)(?=\n\nCRITICAL REQUIREMENTS:|$)/);
  const actualPDFContent = contentMatch ? contentMatch[1].trim() : content;

  const sentences = actualPDFContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const paragraphs = actualPDFContent.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  const technicalTerms = actualPDFContent.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,3}\b/g) || [];
  const keyTerms = [...new Set(technicalTerms)].filter(t => t.length > 3 && t.length < 60).slice(0, 100);

  const definitions = sentences.filter(s =>
    s.toLowerCase().includes('is defined as') ||
    s.toLowerCase().includes('refers to') ||
    s.toLowerCase().includes('consists of') ||
    s.toLowerCase().includes('involves')
  );

  const importantSentences = sentences.filter(s =>
    s.length > 30 && s.length < 300 &&
    (s.toLowerCase().includes('algorithm') ||
     s.toLowerCase().includes('method') ||
     s.toLowerCase().includes('technique') ||
     s.toLowerCase().includes('model') ||
     s.toLowerCase().includes('system'))
  ).slice(0, 50);

  let allQuestions: string[] = [];
  let questionNumber = 1;

  parts.forEach(part => {
    for (let i = 0; i < part.questions; i++) {
      const termIndex = (questionNumber - 1) % Math.max(keyTerms.length, 1);
      const term = keyTerms[termIndex] || 'the concept';
      const marksPerQ = Math.round(part.marks / part.questions);
      let question = '';

      if (part.name.includes('A')) {
        if (definitions.length > i) {
          const defTerm = definitions[i].split(/is defined as|refers to|consists of|involves/i)[0].trim();
          question = `Q${questionNumber}. What is ${defTerm}? | Remember | ${marksPerQ}`;
        } else if (keyTerms.length > i) {
          const types = [
            `Q${questionNumber}. Define ${keyTerms[i]} | Remember | ${marksPerQ}`,
            `Q${questionNumber}. What is ${keyTerms[i]}? | Remember | ${marksPerQ}`,
            `Q${questionNumber}. Explain ${keyTerms[i]} | Understand | ${marksPerQ}`,
          ];
          question = types[i % types.length];
        } else {
          question = `Q${questionNumber}. Define ${term} | Remember | ${marksPerQ}`;
        }
      } else if (part.name.includes('B')) {
        const t1 = keyTerms[i * 2] || term;
        const t2 = keyTerms[i * 2 + 1] || term;
        const types = [
          `Q${questionNumber}. Explain how ${t1} works in detail | Understand | ${marksPerQ}`,
          `Q${questionNumber}. Compare ${t1} and ${t2} | Analyze | ${marksPerQ}`,
          `Q${questionNumber}. Describe the applications of ${t1} | Apply | ${marksPerQ}`,
        ];
        question = types[i % types.length];
      } else {
        if (paragraphs.length > i) {
          const paraTerms = keyTerms.filter(t => paragraphs[i].toLowerCase().includes(t.toLowerCase()));
          const mainTopic = paraTerms[0] || term;
          const types = [
            `Q${questionNumber}. Explain ${mainTopic} with suitable examples and diagrams | Understand | ${marksPerQ}`,
            `Q${questionNumber}. Discuss ${mainTopic} in detail with its applications | Apply | ${marksPerQ}`,
          ];
          question = types[i % types.length];
        } else {
          question = `Q${questionNumber}. Explain ${term} comprehensively with examples | Understand | ${marksPerQ}`;
        }
      }

      allQuestions.push(question);
      questionNumber++;
    }
  });

  return allQuestions.join('\n');
}

/**
 * OpenRouter - full prompt via Vercel proxy (key never exposed to browser)
 */
async function generateWithOpenRouterAIFullPrompt(fullPrompt: string): Promise<string> {
  const workingModels = [
    { model: 'openrouter/auto', maxTokens: 2000 },
    { model: 'meta-llama/llama-3.3-70b-instruct:free', maxTokens: 2000 },
    { model: 'mistralai/mistral-small-3.1-24b-instruct:free', maxTokens: 2000 },
    { model: 'nvidia/nemotron-3-super-120b-a12b:free', maxTokens: 2000 },
    { model: 'google/gemma-3-27b-it:free', maxTokens: 2000 },
    { model: 'openai/gpt-oss-120b:free', maxTokens: 2000 },
    { model: 'qwen/qwen3-next-80b-a3b-instruct:free', maxTokens: 2000 },
    { model: 'arcee-ai/trinity-large-preview:free', maxTokens: 2000 },
    { model: 'stepfun/step-3.5-flash:free', maxTokens: 2000 },
    { model: 'anthropic/claude-3-haiku', maxTokens: 2000 },
  ];

  const proxyUrl = `${window.location.origin}/api/openrouter`;
  let response = null;

  for (const modelConfig of workingModels) {
    try {
      response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.7,
          max_tokens: modelConfig.maxTokens
        })
      });

      if (response.ok) break;

      const errorBody = await response.text();
      if (response.status === 429 || response.status === 404 || response.status === 500) {
        response = null;
        continue;
      }
      response = null;
    } catch (error) {
      response = null;
    }
  }

  if (!response) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-fallback-warning', {
        detail: { message: 'All AI providers are busy (rate limited). Using local generation — question quality may be lower. Try again in a minute.' }
      }));
    }
    const subjectMatch = fullPrompt.match(/SUBJECT:\s*([^\n]+)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Subject';
    const marksMatch = fullPrompt.match(/TOTAL MARKS:\s*(\d+)/);
    const totalMarks = marksMatch ? marksMatch[1] : '100';
    return generateQuestionsFromPDFContent(fullPrompt, subject, totalMarks);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Gemini - full prompt via Vercel proxy (key never exposed to browser)
 */
async function generateWithGeminiAIFullPrompt(fullPrompt: string): Promise<string> {
  try {
    const proxyUrl = `${window.location.origin}/api/gemini`;
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-pro',
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.candidates?.[0]?.content) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('Unexpected Gemini response format');
    }
    throw new Error(`Gemini proxy failed: ${response.status}`);
  } catch (error) {
    const subjectMatch = fullPrompt.match(/SUBJECT:\s*([^\n]+)/);
    const subject = subjectMatch ? subjectMatch[1] : 'Subject';
    const marksMatch = fullPrompt.match(/TOTAL MARKS:\s*(\d+)/);
    const totalMarks = marksMatch ? marksMatch[1] : '100';
    return generateQuestionsFromPDFContent(fullPrompt, subject, totalMarks);
  }
}

/**
 * NVIDIA NIM - full prompt via Vercel proxy (key never exposed to browser)
 */
async function generateWithNvidiaAIFullPrompt(fullPrompt: string): Promise<string> {
  try {
    const proxyUrl = `${window.location.origin}/api/nvidia`;
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta/llama-3.1-405b-instruct',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 8192,
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    return await generateWithOpenRouterAIFullPrompt(fullPrompt);
  } catch (error) {
    return await generateWithOpenRouterAIFullPrompt(fullPrompt);
  }
}

/**
 * Anthropic Claude - full prompt via Vercel proxy (key never exposed to browser)
 */
async function generateWithAnthropicAIFullPrompt(fullPrompt: string): Promise<string> {
  try {
    const proxyUrl = `${window.location.origin}/api/anthropic`;
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.content[0].text;
    }
    throw new Error(`Anthropic proxy failed: ${response.status}`);
  } catch (error) {
    const subjectMatch = fullPrompt.match(/SUBJECT:\s*([^\n]+)/);
    const subject = subjectMatch ? subjectMatch[1] : 'Subject';
    const marksMatch = fullPrompt.match(/TOTAL MARKS:\s*(\d+)/);
    const totalMarks = marksMatch ? marksMatch[1] : '100';
    return generateQuestionsFromPDFContent(fullPrompt, subject, totalMarks);
  }
}

/**
 * NVIDIA - from PDF files via Vercel proxy (key never exposed to browser)
 */
async function generateWithNvidiaAIFromPDFs(
  pdfFiles: Array<{ unitName: string; file: File; weightage: number }>,
  subjectName: string,
  totalMarks: number,
  questionConfig: any
): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let combinedContent = '';
  for (const pdfFile of pdfFiles) {
    const extraction = await extractRealPDFContent(pdfFile.file);
    if (extraction.success && extraction.text) {
      combinedContent += `\n\n=== ${pdfFile.unitName} (${pdfFile.weightage}% weightage) ===\n${extraction.text}`;
    }
  }
  if (combinedContent.length < 100) throw new Error('Failed to extract content from PDFs');

  const aiPrompt = `You are an expert university professor. Create a comprehensive academic question paper based EXCLUSIVELY on the following PDF content.\n\nSubject: ${subjectName}\nTotal Marks: ${totalMarks}\n\nPDF CONTENT:\n${combinedContent.substring(0, 15000)}\n\nGenerate the question paper now.`;

  const proxyUrl = `${window.location.origin}/api/nvidia`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta/llama-3.1-405b-instruct',
      messages: [{ role: 'user', content: aiPrompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].message.content;
  }
  throw new Error(`NVIDIA proxy failed: ${response.status}`);
}

/**
 * Gemini - from PDF files via Vercel proxy (key never exposed to browser)
 */
async function generateWithGeminiAIFromPDFs(
  pdfFiles: Array<{ unitName: string; file: File; weightage: number }>,
  subjectName: string,
  totalMarks: number,
  questionConfig: any
): Promise<string> {
  // Gemini file upload requires direct API access with key — extract text and send via proxy instead
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let combinedContent = '';
  for (const pdfFile of pdfFiles) {
    const extraction = await extractRealPDFContent(pdfFile.file);
    if (extraction.success && extraction.text) {
      combinedContent += `\n\n=== ${pdfFile.unitName} (${pdfFile.weightage}% weightage) ===\n${extraction.text}`;
    }
  }
  if (combinedContent.length < 100) throw new Error('Failed to extract content from PDFs');

  const prompt = `Create a comprehensive academic question paper for "${subjectName}" (${totalMarks} marks) based EXCLUSIVELY on the following PDF content:\n\n${combinedContent.substring(0, 15000)}`;

  const proxyUrl = `${window.location.origin}/api/gemini`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-pro',
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error(`Gemini proxy failed: ${response.status}`);
}

/**
 * OpenRouter - from PDF files via Vercel proxy (key never exposed to browser)
 */
async function generateWithOpenRouterAIFromPDFs(
  pdfFiles: Array<{ unitName: string; file: File; weightage: number }>,
  subjectName: string,
  totalMarks: number,
  questionConfig: any
): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let combinedContent = '';
  for (const pdfFile of pdfFiles) {
    const extraction = await extractRealPDFContent(pdfFile.file);
    if (extraction.success && extraction.text) {
      combinedContent += `\n\n=== ${pdfFile.unitName} ===\n${extraction.text}`;
    }
  }
  if (combinedContent.length < 100) throw new Error('Failed to extract content from PDFs');

  const aiPrompt = `Create a comprehensive academic question paper based on this PDF content:\n\nSubject: ${subjectName}\nTotal Marks: ${totalMarks}\n\nCONTENT: ${combinedContent.substring(0, 10000)}`;

  const proxyUrl = `${window.location.origin}/api/openrouter`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: aiPrompt }]
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].message.content;
  }
  throw new Error('OpenRouter proxy failed');
}

/**
 * Local fallback - from PDF files
 */
export async function generateLocalFromPDFs(
  pdfFiles: Array<{ unitName: string; file: File; weightage: number }>,
  subjectName: string,
  totalMarks: number,
  questionConfig: any
): Promise<string> {
  const { extractRealPDFContent } = await import('./pdf-extractor-real');
  let combinedContent = '';
  for (const pdfFile of pdfFiles) {
    const extraction = await extractRealPDFContent(pdfFile.file);
    if (extraction.success && extraction.text) {
      combinedContent += `\n\n=== ${pdfFile.unitName} ===\n${extraction.text}`;
    }
  }
  if (combinedContent.length < 100) throw new Error('Failed to extract content from PDFs for local generation');
  return generateQuestionsFromPDFContent(combinedContent, subjectName, String(totalMarks));
}
