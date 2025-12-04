// src/lib/paper.ts
import { jsPDF } from 'jspdf';
import { 
  formatKalasalingamPaper, 
  createKalasalingamPaper,
  type KalasalingamQuestion,
  type CourseOutcome 
} from './kalasalingam-format';
import { generateKalasalingamHTML } from './kalasalingam-html-format';

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
      const htmlFormat = generateKalasalingamHTML(paper);
      
      // Store HTML in window for printing
      (window as any).currentQuestionPaperHTML = htmlFormat;
      
      // Return text format for preview
      return formatKalasalingamPaper(paper);
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
    const formatMatch = line.match(/^Q(\d+)\.\s*(.+?)\s*\|\s*(Remember|Understand|Apply|Analyze|Evaluate|Create)\s*\|\s*(\d+)/i);
    
    if (formatMatch) {
      const questionNumber = parseInt(formatMatch[1]);
      const questionText = formatMatch[2].trim();
      const pattern = formatMatch[3].trim() as 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
      const mappingCO = parseInt(formatMatch[4]);
      
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
      const questionText = simpleMatch[2].trim();
      
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
 * Triggers a download of the question paper as a PDF, with multi-page support and a watermark.
 * @param {QuestionPaper} paper - The paper object to download.
 */
export function downloadPaperAsPDF(paper: QuestionPaper) {
  const doc = new jsPDF();
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  let y = 45; // Initial y position after header

  // --- Footer Function ---
  const addFooter = () => {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150); // A medium gray
    const footerText = 'Generated by Quizzy AI Paper Forge';
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset text color to black
  };

  // --- Watermark Function ---
  const addWatermark = () => {
    doc.setFontSize(60);
    doc.setTextColor(230, 230, 230); // A very light gray
    doc.text('Quizzy AI', pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: 'center',
    });
    doc.setTextColor(0, 0, 0); // Reset text color to black
  };

  // --- Page Generation Loop ---
  let pageNumber = 1;
  const generatePage = () => {
    if (pageNumber > 1) doc.addPage();
    addWatermark();
    addFooter();
    pageNumber++;
  };

  // --- Header ---
  generatePage();
  doc.setFontSize(18);
  doc.text(`${paper.subjectName} Question Paper`, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Total Marks: ${paper.config.totalMarks}`, margin, 30);
  doc.text(`Time: 3 Hours`, pageWidth - margin, 30, { align: 'right' });

  // Add a line separator
  doc.line(margin, 35, pageWidth - margin, 35);

  // --- Content with Multi-Page Handling ---
  doc.setFontSize(11);
  const splitContent = doc.splitTextToSize(paper.content, pageWidth - margin * 2);

  splitContent.forEach((line: string) => {
    if (y > pageHeight - margin - 10) { // Check against footer margin
      generatePage();
      y = margin; // Reset y position
    }
    doc.text(line, margin, y);
    y += 7;
  });

  doc.save(`${paper.subjectName.replace(/\s+/g, '_')}_Question_Paper.pdf`);
} 