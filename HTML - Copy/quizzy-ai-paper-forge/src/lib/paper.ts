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

  let questionIndex = 0;

  const partsHTML = partConfig.map((part) => {
    // When choices enabled, AI generates 50% more questions (e.g. 6 questions, answer any 4)
    const totalGenerated = part.choicesEnabled ? Math.ceil(part.questions * 1.5) : part.questions;
    const partQuestions = paper.questions.slice(questionIndex, questionIndex + totalGenerated);
    questionIndex += totalGenerated;

    // Part header: show "Answer any X of Y" when choices enabled
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
 * Parse AI-generated questions and convert to Kalasalingam format
 */
function parseAIQuestionsToKalasalingam(generatedText: string): KalasalingamQuestion[] {
  const questions: KalasalingamQuestion[] = [];
  
  console.log('🔍 Parsing AI-generated questions for Kalasalingam format...');
  console.log('📄 Generated text length:', generatedText.length);
  
  // Try to parse questions from AI response
  const lines = generatedText.split('\n').filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    // Look for format: Q[number]. [Question] | [Pattern] | [CO]
    const formatMatch = line.match(/^Q(\d+)\.\s*(.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?(\d+)/i);
    
    if (formatMatch) {
      const questionNumber = parseInt(formatMatch[1]);
      let questionText = formatMatch[2].trim();
      const pattern = formatMatch[3].trim() as 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
      // Ensure CO is always in range 2-4 (CO1 is not valid for exam papers)
      const rawCO = parseInt(formatMatch[4]);
      const mappingCO = rawCO >= 2 && rawCO <= 4 ? rawCO : 2 + ((questionNumber - 1) % 3);
      
      // Clean up question text - remove any trailing pattern/CO information
      questionText = questionText.replace(/\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?\d+\s*$/i, '');
      questionText = questionText.replace(/\s*\(.*?\)\s*$/, ''); // Remove any trailing parentheses
      
      questions.push({
        number: questionNumber,
        question: questionText,
        pattern,
        mappingCO,
        marks: 2
      });
      
      console.log(`✅ Parsed Q${questionNumber}: ${pattern} | CO${mappingCO}`);
      continue;
    }
    
    // Fallback: Look for numbered questions without format
    const simpleMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
    if (simpleMatch) {
      const questionNumber = parseInt(simpleMatch[1]);
      let questionText = simpleMatch[2].trim();
      
      // Clean up question text - remove pattern/CO info if present
      questionText = questionText.replace(/\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(?:CO)?\d+\s*$/i, '');
      
      // Determine pattern based on question keywords
      let pattern: 'Remember' | 'Understand' | 'Apply' | 'Analyze' = 'Remember';
      const lowerText = questionText.toLowerCase();
      
      if (lowerText.includes('explain') || lowerText.includes('describe') || lowerText.includes('discuss')) {
        pattern = 'Understand';
      } else if (lowerText.includes('apply') || lowerText.includes('use') || lowerText.includes('demonstrate')) {
        pattern = 'Apply';
      } else if (lowerText.includes('analyze') || lowerText.includes('compare') || lowerText.includes('examine')) {
        pattern = 'Analyze';
      } else if (lowerText.includes('what') || lowerText.includes('define') || lowerText.includes('list') || lowerText.includes('state')) {
        pattern = 'Remember';
      }
      
      // Assign CO based on question number (distribute across CO2, CO3, CO4)
      const mappingCO = 2 + ((questionNumber - 1) % 3);
      
      questions.push({
        number: questionNumber,
        question: questionText,
        pattern,
        mappingCO,
        marks: 2
      });
      
      console.log(`✅ Parsed Q${questionNumber} (fallback): ${pattern} | CO${mappingCO}`);
    }
  }
  
  console.log(`📊 Total questions parsed: ${questions.length}`);
  
  // If parsing failed completely, extract questions from text
  if (questions.length === 0) {
    console.warn('⚠️ No questions parsed, extracting from text...');
    
    // Split by common question patterns
    const questionPatterns = generatedText.split(/(?=\d+\.|Q\d+\.)/);
    
    questionPatterns.forEach((text, index) => {
      if (text.trim().length > 10 && index > 0) {
        const questionNumber = index;
        const questionText = text.replace(/^\d+\.|^Q\d+\./, '').trim().split('\n')[0];
        
        if (questionText.length > 5) {
          const pattern = questionNumber <= 13 ? 'Remember' : questionNumber <= 24 ? 'Understand' : 'Apply';
          const mappingCO = 2 + ((questionNumber - 1) % 3);
          
          questions.push({
            number: questionNumber,
            question: questionText,
            pattern: pattern as 'Remember' | 'Understand' | 'Apply',
            mappingCO,
            marks: 2
          });
        }
      }
    });
  }
  
  // Last resort: create from content if still no questions
  if (questions.length === 0) {
    console.error('❌ Failed to parse any questions, using fallback');
    for (let i = 1; i <= 25; i++) {
      questions.push({
        number: i,
        question: `Question ${i} based on study material content`,
        pattern: i <= 13 ? 'Remember' : i <= 24 ? 'Understand' : 'Apply',
        mappingCO: 2 + ((i - 1) % 3),
        marks: 2
      });
    }
  }
  
  return questions.sort((a, b) => a.number - b.number);
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