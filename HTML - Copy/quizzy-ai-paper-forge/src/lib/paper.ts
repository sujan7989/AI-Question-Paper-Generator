// src/lib/paper.ts

// Inlined types (from removed kalasalingam-format.ts)
export interface KalasalingamQuestion {
  number: number;
  question: string;
  pattern: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  mappingCO: number;
  marks: number;
}

export interface CourseOutcome {
  co: string;
  description: string;
}

interface KalasalingamPaper {
  courseCode: string;
  subject: string;
  degree: string;
  duration: string;
  totalMarks: number;
  dateSession: string;
  examType: string;
  examMonth: string;
  courseOutcomes: CourseOutcome[];
  questions: KalasalingamQuestion[];
}

function createKalasalingamPaper(
  courseCode: string, subject: string, degree: string, duration: string,
  totalMarks: number, dateSession: string, examType: string, examMonth: string,
  courseOutcomes: CourseOutcome[], questions: KalasalingamQuestion[]
): KalasalingamPaper {
  return { courseCode, subject, degree, duration, totalMarks, dateSession, examType, examMonth, courseOutcomes, questions };
}

function generateKalasalingamHTML(
  paper: KalasalingamPaper,
  parts?: Array<{ name: string; questions: number; marks: number; marksPerQuestion: number; choicesEnabled?: boolean }>
): string {
  const partConfig = parts || [
    { name: 'Part A', questions: 25, marks: 50, marksPerQuestion: 2, choicesEnabled: false }
  ];

  // Calculate total questions needed
  const totalNeeded = partConfig.reduce((sum, p) => {
    return sum + (p.choicesEnabled ? Math.ceil(p.questions * 1.5) : p.questions);
  }, 0);

  // Pad questions array if AI gave fewer than needed
  const allQuestions = [...paper.questions];
  while (allQuestions.length < totalNeeded) {
    const idx = allQuestions.length;
    allQuestions.push({
      number: idx + 1,
      question: `Question ${idx + 1}`,
      pattern: 'Remember',
      mappingCO: 2 + (idx % 3),
      marks: 2,
    });
  }

  // Re-number sequentially so Q.No in table is always 1,2,3...
  const numbered = allQuestions.map((q, i) => ({ ...q, number: i + 1 }));

  let questionIndex = 0;

  const partsHTML = partConfig.map((part) => {
    const totalGenerated = part.choicesEnabled ? Math.ceil(part.questions * 1.5) : part.questions;
    const partQuestions = numbered.slice(questionIndex, questionIndex + totalGenerated);
    questionIndex += totalGenerated;

    const choiceNote = part.choicesEnabled
      ? ` (Answer any ${part.questions} of ${totalGenerated})`
      : '';
    const partHeader = `${part.name}${choiceNote} (${part.questions} × ${part.marksPerQuestion} = ${part.marks} Marks)`;

    const questionsHTML = partQuestions.map(q => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #000;text-align:center;">${q.number}</td>
        <td style="padding:4px 8px;border:1px solid #000;">${q.question}</td>
        <td style="padding:4px 8px;border:1px solid #000;text-align:center;">${q.pattern}</td>
        <td style="padding:4px 8px;border:1px solid #000;text-align:center;">CO${q.mappingCO}</td>
        <td style="padding:4px 8px;border:1px solid #000;text-align:center;">${part.marksPerQuestion}</td>
      </tr>`).join('');

    return `
      <tr><td colspan="5" style="padding:6px 8px;border:1px solid #000;font-weight:bold;background:#f5f5f5;">
        ${partHeader}
      </td></tr>
      ${questionsHTML}`;
  }).join('');

  const coRows = paper.courseOutcomes.map(co =>
    `<tr><td style="padding:4px 8px;border:1px solid #000;">${co.co}</td><td style="padding:4px 8px;border:1px solid #000;">${co.description}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${paper.subject} - Question Paper</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; margin: 15mm; font-size: 12pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { padding: 6px 8px; border: 1px solid #000; background: #e8e8e8; font-weight: bold; }
  @media print { body { margin: 0; } @page { margin: 15mm; size: A4; } }
</style>
</head>
<body>
<table style="width:100%;border-collapse:collapse;border:none;margin-bottom:10px;">
  <tr>
    <td style="border:none;width:20%;"></td>
    <td style="border:none;width:60%;text-align:center;vertical-align:middle;padding:0;">
      <div style="font-size:14pt;font-weight:bold;line-height:1.5;">KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION</div>
      <div style="font-size:11pt;line-height:1.4;">(Deemed to be University)</div>
      <div style="font-size:12pt;font-weight:bold;margin-top:4px;line-height:1.4;">${paper.examType}</div>
      <div style="line-height:1.4;">${paper.examMonth}</div>
    </td>
    <td style="border:none;width:20%;vertical-align:top;text-align:center;padding-top:2px;">
      <div style="font-size:9pt;font-weight:bold;margin-bottom:4px;">Registration Number</div>
      <table style="border-collapse:collapse;margin:0 auto;width:auto;">
        <tr>
          ${Array(11).fill(0).map(() => `<td style="width:22px;height:26px;border:1.5px solid #000;padding:0;"></td>`).join('')}
        </tr>
      </table>
    </td>
  </tr>
</table>
<table>
  <tr>
    <td style="padding:4px 8px;border:1px solid #000;"><b>Course Code:</b> ${paper.courseCode}</td>
    <td style="padding:4px 8px;border:1px solid #000;"><b>Course Name:</b> ${paper.subject}</td>
    <td style="padding:4px 8px;border:1px solid #000;"><b>Duration:</b> ${paper.duration}</td>
    <td style="padding:4px 8px;border:1px solid #000;"><b>Max. Marks:</b> ${paper.totalMarks}</td>
  </tr>
</table>
<table>
  <tr>
    <th>Q.No</th><th>Questions</th><th>Blooms Level</th><th>CO</th><th>Marks</th>
  </tr>
  ${partsHTML}
</table>
<table>
  <tr><th colspan="2">Course Outcomes</th></tr>
  ${coRows}
</table>
</body>
</html>`;
}

export interface QuestionPaperConfig {
  totalMarks: number;
  totalQuestions: number;
  difficulty: string;
  parts: Array<{
    name: string;
    marks: number;
    questions: number;
    marksPerQuestion: number;
    choicesEnabled: boolean;
  }>;
}

export interface QuestionPaper {
  id: number;
  subjectName: string;
  generatedAt: Date;
  generatedBy: string;
  config: QuestionPaperConfig;
  questions: Array<{
    partName: string;
    question: string;
    marks: number;
  }>;
  content: string;
}

/**
 * Formats the final question paper content in Kalasalingam University format
 * @param {object} data - The data to format into a paper.
 * @returns {string} The formatted paper content.
 */
export function formatPaperContent(data: {
  subject: string;
  totalMarks: number;
  generatedQuestions: string;
  courseCode?: string;
  degree?: string;
  examType?: string;
  examMonth?: string;
  duration?: string;
  dateSession?: string;
  courseOutcomes?: CourseOutcome[];
  useKalasalingamFormat?: boolean;
  parts?: Array<{ name: string; questions: number; marks: number; marksPerQuestion: number; choicesEnabled?: boolean }>;
}): string {
  // Check if Kalasalingam format is requested
  if (data.useKalasalingamFormat && data.courseCode) {
    try {
      // Parse AI-generated questions and convert to Kalasalingam format
      const questions = parseAIQuestionsToKalasalingam(data.generatedQuestions);
      
      const paper = createKalasalingamPaper(
        data.courseCode,
        data.subject,
        data.degree || 'B. Tech',
        data.duration || '90 Minutes',
        data.totalMarks,
        data.dateSession || new Date().toLocaleDateString('en-GB'),
        data.examType || 'SESSIONAL EXAMINATION – II',
        data.examMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
        data.courseOutcomes || getDefaultCourseOutcomes(),
        questions
      );
      
      // Generate HTML format for better printing
      const htmlFormat = generateKalasalingamHTML(paper, data.parts);
      
      // Store HTML in window for printing
      (window as any).currentQuestionPaperHTML = htmlFormat;
      
      // Return HTML format (not text format!)
      return htmlFormat;
    } catch (error) {
      console.error('Error formatting in Kalasalingam format:', error);
      // Fallback to AI-generated format
      return data.generatedQuestions;
    }
  }
  
  // Return AI-generated questions directly (default behavior)
  return data.generatedQuestions;
}

/**
 * Parse AI-generated questions — lenient parser that catches all formats
 * Then re-numbers them 1..N sequentially so slicing by part always works
 */
function parseAIQuestionsToKalasalingam(generatedText: string): KalasalingamQuestion[] {
  const raw: Array<{ question: string; pattern: KalasalingamQuestion['pattern']; mappingCO: number }> = [];

  const lines = generatedText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Format 1 (preferred): Q1. text | Bloom | CO2
    const fmt1 = line.match(/^Q?\d+[\.\)]\s*(.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?(\d+)/i);
    if (fmt1) {
      let text = fmt1[1].trim();
      // strip trailing | bloom | co if duplicated
      text = text.replace(/\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?\d+\s*$/i, '').trim();
      const bloom = normaliseBloom(fmt1[2]);
      const co = clampCO(parseInt(fmt1[3]), raw.length);
      if (text.length > 3) raw.push({ question: text, pattern: bloom, mappingCO: co });
      continue;
    }

    // Format 2: plain numbered  "1. text" or "1) text"
    const fmt2 = line.match(/^(\d+)[\.\)]\s*(.+)/);
    if (fmt2) {
      let text = fmt2[2].trim();
      // strip trailing bloom/co if present
      text = text.replace(/\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?\d+\s*$/i, '').trim();
      if (text.length > 3 && !isHeaderLine(text)) {
        const bloom = inferBloom(text);
        const co = clampCO(0, raw.length);
        raw.push({ question: text, pattern: bloom, mappingCO: co });
      }
      continue;
    }

    // Format 3: line starts with a question word and is long enough (no number prefix)
    // Only pick up if previous line was a part header or blank
    if (line.length > 20 && !isHeaderLine(line) && /^(what|define|explain|describe|compare|analyze|evaluate|discuss|state|list|how|why|illustrate|derive|calculate|differentiate)/i.test(line)) {
      const text = line.replace(/\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?\d+\s*$/i, '').trim();
      if (text.length > 10) {
        const bloom = inferBloom(text);
        const co = clampCO(0, raw.length);
        raw.push({ question: text, pattern: bloom, mappingCO: co });
      }
    }
  }

  // Re-number sequentially 1..N — this is the key fix
  // The HTML generator slices by index, so numbering must be 1,2,3...
  return raw.map((r, i) => ({
    number: i + 1,
    question: r.question,
    pattern: r.pattern,
    mappingCO: r.mappingCO,
    marks: 2,
  }));
}

function normaliseBloom(raw: string): KalasalingamQuestion['pattern'] {
  const map: Record<string, KalasalingamQuestion['pattern']> = {
    remember: 'Remember', understand: 'Understand', apply: 'Apply',
    analyze: 'Analyze', analyse: 'Analyze', evaluate: 'Evaluate', create: 'Create',
  };
  return map[raw.toLowerCase()] || 'Remember';
}

function inferBloom(text: string): KalasalingamQuestion['pattern'] {
  const t = text.toLowerCase();
  if (/\b(evaluate|justify|assess|critique|judge)\b/.test(t)) return 'Evaluate';
  if (/\b(create|design|construct|develop|formulate)\b/.test(t)) return 'Create';
  if (/\b(analyze|analyse|compare|differentiate|examine|contrast)\b/.test(t)) return 'Analyze';
  if (/\b(apply|use|demonstrate|solve|calculate|implement|derive)\b/.test(t)) return 'Apply';
  if (/\b(explain|describe|discuss|illustrate|summarize|interpret)\b/.test(t)) return 'Understand';
  return 'Remember';
}

function clampCO(raw: number, idx: number): number {
  if (raw >= 2 && raw <= 4) return raw;
  return 2 + (idx % 3);
}

function isHeaderLine(text: string): boolean {
  return /^(part\s+[a-z]|section|---|\*\*\*|note:|instructions?:)/i.test(text.trim());
}

/**
 * Get default course outcomes
 */
function getDefaultCourseOutcomes(): CourseOutcome[] {
  return [
    { co: 'CO2', description: 'Analyze the optimal usage of concepts from the study material' },
    { co: 'CO3', description: 'Demonstrate the usage of principles for specific requirements' },
    { co: 'CO4', description: 'Analyze the methods and techniques for different applications' }
  ];
}


/**
 * Generate an answer key HTML for the given question paper HTML
 * Parses the question table and produces a matching answer key document
 */
export function generateAnswerKeyHTML(paper: QuestionPaper): string {
  const questions = parseAIQuestionsToKalasalingam(paper.questions[0]?.question || '');

  const rowsHTML = questions.map(q => `
    <tr>
      <td style="padding:6px 10px;border:1px solid #000;text-align:center;font-weight:bold;">${q.number}</td>
      <td style="padding:6px 10px;border:1px solid #000;">${q.question}</td>
      <td style="padding:6px 10px;border:1px solid #000;text-align:center;">${q.pattern}</td>
      <td style="padding:6px 10px;border:1px solid #000;text-align:center;">CO${q.mappingCO}</td>
      <td style="padding:6px 10px;border:1px solid #000;background:#fffde7;">
        <em style="color:#888;font-size:10pt;">Answer based on study material</em>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${paper.subjectName} - Answer Key</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; margin: 15mm; font-size: 12pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { padding: 6px 10px; border: 1px solid #000; background: #e8e8e8; font-weight: bold; }
  h2 { text-align: center; margin-bottom: 4px; }
  .subtitle { text-align: center; color: #555; margin-bottom: 16px; font-size: 11pt; }
  @media print { body { margin: 0; } @page { margin: 15mm; } }
</style>
</head>
<body>
  <h2>ANSWER KEY / MARKING SCHEME</h2>
  <div class="subtitle">${paper.subjectName} &nbsp;|&nbsp; Total Marks: ${paper.config.totalMarks} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
  <table>
    <tr>
      <th style="width:5%">Q.No</th>
      <th style="width:40%">Question</th>
      <th style="width:12%">Bloom's Level</th>
      <th style="width:8%">CO</th>
      <th style="width:35%">Expected Answer / Key Points</th>
    </tr>
    ${rowsHTML}
  </table>
  <p style="margin-top:20px;font-size:10pt;color:#555;">
    <strong>Note:</strong> This answer key is auto-generated. Examiners should refer to the uploaded study material for detailed model answers.
  </p>
</body>
</html>`;
}

/**
 * Export question paper as a Word-compatible HTML file (.doc)
 * Opens in Microsoft Word when downloaded
 */
export function exportPaperAsWord(paper: QuestionPaper) {
  const wordHTML = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
    xmlns:w='urn:schemas-microsoft-com:office:word'
    xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="UTF-8">
  <meta name=ProgId content=Word.Document>
  <meta name=Generator content='Microsoft Word 15'>
  <title>${paper.subjectName} - Question Paper</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2cm; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
    td, th { border: 1px solid #000; padding: 4pt 8pt; }
    th { background: #e8e8e8; font-weight: bold; }
  </style>
</head>
<body>
${paper.content.replace(/<html[^>]*>|<\/html>|<head>[\s\S]*?<\/head>|<!DOCTYPE[^>]*>/gi, '')}
</body>
</html>`;

  const blob = new Blob([wordHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${paper.subjectName.replace(/\s+/g, '_')}_Question_Paper.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a download of the question paper as a PDF by opening print dialog
 * @param {QuestionPaper} paper - The paper object to download.
 */
export function downloadPaperAsPDF(paper: QuestionPaper) {
  // Check if content is HTML
  const isHTML = paper.content && (paper.content.includes('<!DOCTYPE') || paper.content.includes('<html'));
  
  if (isHTML) {
    // Open HTML in new window and trigger print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(paper.content);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  } else {
    // Fallback: Create a simple HTML document with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${paper.subjectName} - Question Paper</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              margin: 20mm;
              line-height: 1.6;
            }
            @media print {
              body { margin: 0; }
              @page { margin: 15mm; }
            }
            h1 { text-align: center; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${paper.subjectName} Question Paper</h1>
            <p>Total Marks: ${paper.config.totalMarks} | Time: 3 Hours</p>
          </div>
          <pre style="white-space: pre-wrap; font-family: 'Times New Roman', Times, serif;">${paper.content}</pre>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
} 