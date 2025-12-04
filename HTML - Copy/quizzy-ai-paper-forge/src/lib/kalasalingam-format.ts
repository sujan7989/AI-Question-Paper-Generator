// Kalasalingam University Official Question Paper Format Generator
// Matches the exact format used by Kalasalingam Academy of Research and Education

export interface KalasalingamQuestion {
  number: number;
  question: string;
  pattern: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  mappingCO: number; // CO number (2, 3, 4, etc.)
  marks: number;
}

export interface CourseOutcome {
  co: string; // e.g., "CO2"
  description: string;
}

export interface KalasalingamPaper {
  courseCode: string;
  courseName: string;
  degree: string;
  duration: string; // e.g., "90 Minutes"
  maxMarks: number;
  dateSession: string;
  examType: string; // e.g., "SESSIONAL EXAMINATION – II"
  examMonth: string; // e.g., "OCTOBER 2024"
  courseOutcomes: CourseOutcome[];
  questions: KalasalingamQuestion[];
  partTitle: string; // e.g., "PART – A (25 x 2 = 50 Marks)"
}

export interface BloomsTaxonomyCount {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

export interface COBloomsDistribution {
  [co: string]: BloomsTaxonomyCount;
}

/**
 * Generate questions from PDF content in Kalasalingam University format
 */
export function generateKalasalingamQuestions(
  pdfContent: string,
  courseName: string,
  courseCode: string,
  totalQuestions: number,
  marksPerQuestion: number,
  courseOutcomes: CourseOutcome[],
  unitCOMapping: { [unitName: string]: number } // Maps unit to CO number
): KalasalingamQuestion[] {
  const questions: KalasalingamQuestion[] = [];
  
  // Extract key terms and concepts from PDF
  const terms = extractKeyTerms(pdfContent);
  const concepts = extractConcepts(pdfContent);
  
  // Distribute questions across Bloom's levels
  // Typical distribution: 50% Remember, 40% Understand, 10% Apply/Analyze
  const rememberCount = Math.floor(totalQuestions * 0.5);
  const understandCount = Math.floor(totalQuestions * 0.4);
  const applyCount = totalQuestions - rememberCount - understandCount;
  
  let qNum = 1;
  
  // Generate Remember questions
  for (let i = 0; i < rememberCount; i++) {
    questions.push({
      number: qNum++,
      question: generateRememberQuestion(terms, concepts, i, pdfContent),
      pattern: 'Remember',
      mappingCO: getCOForQuestion(i, courseOutcomes.length),
      marks: marksPerQuestion
    });
  }
  
  // Generate Understand questions
  for (let i = 0; i < understandCount; i++) {
    questions.push({
      number: qNum++,
      question: generateUnderstandQuestion(concepts, i, pdfContent),
      pattern: 'Understand',
      mappingCO: getCOForQuestion(i + rememberCount, courseOutcomes.length),
      marks: marksPerQuestion
    });
  }
  
  // Generate Apply/Analyze questions
  for (let i = 0; i < applyCount; i++) {
    const pattern = i % 2 === 0 ? 'Apply' : 'Analyze';
    questions.push({
      number: qNum++,
      question: generateHigherOrderQuestion(concepts, i, pdfContent, pattern),
      pattern: pattern as 'Apply' | 'Analyze',
      mappingCO: getCOForQuestion(i + rememberCount + understandCount, courseOutcomes.length),
      marks: marksPerQuestion
    });
  }
  
  return questions;
}

function extractKeyTerms(content: string): string[] {
  // Extract capitalized terms and technical terms
  const words = content.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,3}\b/g) || [];
  const technicalTerms = content.match(/\b[a-z]+(?:tion|ment|ness|ity|ism|ogy|ics|or|er)\b/gi) || [];
  
  const allTerms = [...words, ...technicalTerms]
    .filter(term => term.length > 3 && term.length < 50)
    .filter((term, index, arr) => arr.indexOf(term) === index);
  
  return allTerms.slice(0, 50);
}

function extractConcepts(content: string): string[] {
  const sentences = content.split(/[.!?]+/)
    .filter(s => s.trim().length > 30 && s.trim().length < 300)
    .map(s => s.trim());
  
  return sentences.slice(0, 30);
}

function getCOForQuestion(questionIndex: number, totalCOs: number): number {
  // Distribute questions across available COs
  // Typically CO2, CO3, CO4 are used
  const coNumbers = [2, 3, 4];
  return coNumbers[questionIndex % Math.min(coNumbers.length, totalCOs)];
}

function generateRememberQuestion(terms: string[], concepts: string[], index: number, content: string): string {
  const templates = [
    `What are the different types of ${terms[index % terms.length] || 'systems'} mentioned in the study material?`,
    `Define ${terms[(index + 1) % terms.length] || 'the concept'} as explained in the content.`,
    `List the main components of ${terms[(index + 2) % terms.length] || 'the system'} discussed in the document.`,
    `What is the function of ${terms[(index + 3) % terms.length] || 'the component'}?`,
    `Mention the key characteristics of ${terms[(index + 4) % terms.length] || 'the topic'}.`,
    `State the purpose of ${terms[(index + 5) % terms.length] || 'the process'} as described in the material.`,
    `What are the main features of ${terms[(index + 6) % terms.length] || 'the system'}?`,
    `Identify the types of ${terms[(index + 7) % terms.length] || 'components'} mentioned in the content.`
  ];
  
  return templates[index % templates.length];
}

function generateUnderstandQuestion(concepts: string[], index: number, content: string): string {
  const templates = [
    `Explain how the concept discussed in the study material is applied in practice.`,
    `Describe the relationship between the components mentioned in the document.`,
    `How does the system function according to the content provided?`,
    `Explain the significance of the process described in the material.`,
    `Describe the working principle as explained in the study content.`,
    `How are the different elements interconnected as per the document?`,
    `Explain the advantages mentioned in the study material.`,
    `Describe the application areas discussed in the content.`
  ];
  
  return templates[index % templates.length];
}

function generateHigherOrderQuestion(concepts: string[], index: number, content: string, pattern: string): string {
  if (pattern === 'Apply') {
    const templates = [
      `Apply the concepts from the study material to solve a practical problem.`,
      `Demonstrate how the principles discussed can be implemented.`,
      `Use the methodology from the content to design a solution.`,
      `Apply the techniques mentioned to a real-world scenario.`
    ];
    return templates[index % templates.length];
  } else {
    const templates = [
      `Analyze the advantages and disadvantages discussed in the material.`,
      `Compare and contrast the different approaches mentioned in the content.`,
      `Analyze the impact of the factors described in the study material.`,
      `Examine the relationship between the concepts presented in the document.`
    ];
    return templates[index % templates.length];
  }
}

/**
 * Calculate Bloom's Taxonomy distribution for each CO
 */
export function calculateBloomsDistribution(questions: KalasalingamQuestion[]): {
  coDistribution: COBloomsDistribution;
  totalDistribution: BloomsTaxonomyCount;
} {
  const coDistribution: COBloomsDistribution = {};
  const totalDistribution: BloomsTaxonomyCount = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0
  };
  
  questions.forEach(q => {
    const co = `CO${q.mappingCO}`;
    
    // Initialize CO if not exists
    if (!coDistribution[co]) {
      coDistribution[co] = {
        remember: 0,
        understand: 0,
        apply: 0,
        analyze: 0,
        evaluate: 0,
        create: 0
      };
    }
    
    // Add marks to appropriate category
    const pattern = q.pattern.toLowerCase() as keyof BloomsTaxonomyCount;
    coDistribution[co][pattern] += q.marks;
    totalDistribution[pattern] += q.marks;
  });
  
  return { coDistribution, totalDistribution };
}

/**
 * Format the paper in exact Kalasalingam University format
 */
export function formatKalasalingamPaper(paper: KalasalingamPaper): string {
  const { coDistribution, totalDistribution } = calculateBloomsDistribution(paper.questions);
  
  // Calculate total marks
  const totalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);
  const questionsCount = paper.questions.length;
  const marksPerQ = paper.questions[0]?.marks || 2;
  
  let output = `
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│         KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION                     │
│                     (Deemed to be University)                              │
│              Anand Nagar, Krishnankoil-626 126                             │
│                                                                            │
│              ${paper.examType} – ${paper.examMonth}                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

Course Code    : ${paper.courseCode}              Duration       : ${paper.duration}
Course Name    : ${paper.courseName}
                                                  Max. Marks     : ${paper.maxMarks}
Degree         : ${paper.degree}                 Date & Session : ${paper.dateSession}

┌────────────────────────────────────────────────────────────────────────────┐
│ COs TO BE ASSESSED DURING ${paper.examType}:                               │
├────────────────────────────────────────────────────────────────────────────┤
`;

  // Add Course Outcomes
  paper.courseOutcomes.forEach(co => {
    output += `│ ${co.co.padEnd(4)} │ ${co.description.padEnd(70)} │\n`;
  });
  
  output += `└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ ${paper.partTitle.padEnd(74)} │
│ Answer ALL Questions                                                       │
└────────────────────────────────────────────────────────────────────────────┘

┌────┬────────────────────────────────────────────────────┬──────────┬─────────┬───────┐
│ No │ Question                                           │ Pattern  │ Mapping │ Marks │
│    │                                                    │          │   COs   │       │
├────┼────────────────────────────────────────────────────┼──────────┼─────────┼───────┤
`;

  // Add all questions
  paper.questions.forEach(q => {
    const questionText = q.question.length > 50 
      ? q.question.substring(0, 47) + '...' 
      : q.question;
    
    output += `│ ${String(q.number).padStart(2)} │ ${questionText.padEnd(50)} │ ${q.pattern.padEnd(8)} │ ${String(q.mappingCO).padStart(7)} │ ${String(q.marks).padStart(5)} │\n`;
  });
  
  output += `└────┴────────────────────────────────────────────────────┴──────────┴─────────┴───────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ Assessment Pattern as per Bloom's Taxonomy:                                │
├──────┬──────────┬────────────┬───────┬─────────┬──────────┬────────┬───────┤
│  COs │ Remember │ Understand │ Apply │ Analyze │ Evaluate │ Create │ Total │
├──────┼──────────┼────────────┼───────┼─────────┼──────────┼────────┼───────┤
`;

  // Add CO-wise distribution
  const coKeys = Object.keys(coDistribution).sort();
  coKeys.forEach(co => {
    const dist = coDistribution[co];
    const coTotal = dist.remember + dist.understand + dist.apply + dist.analyze + dist.evaluate + dist.create;
    
    output += `│ ${co.padEnd(4)} │ ${String(dist.remember).padStart(8)} │ ${String(dist.understand).padStart(10)} │ ${String(dist.apply).padStart(5)} │ ${String(dist.analyze).padStart(7)} │ ${String(dist.evaluate).padStart(8)} │ ${String(dist.create).padStart(6)} │ ${String(coTotal).padStart(5)} │\n`;
  });
  
  // Add total row
  output += `├──────┼──────────┼────────────┼───────┼─────────┼──────────┼────────┼───────┤
│ Total│ ${String(totalDistribution.remember).padStart(8)} │ ${String(totalDistribution.understand).padStart(10)} │ ${String(totalDistribution.apply).padStart(5)} │ ${String(totalDistribution.analyze).padStart(7)} │ ${String(totalDistribution.evaluate).padStart(8)} │ ${String(totalDistribution.create).padStart(6)} │ ${String(totalMarks).padStart(5)} │
└──────┴──────────┴────────────┴───────┴─────────┴──────────┴────────┴───────┘


                                  *****

`;

  return output;
}

/**
 * Generate questions from PDF content with AI assistance
 */
export async function generateQuestionsFromPDFWithAI(
  pdfContent: string,
  courseName: string,
  courseCode: string,
  totalQuestions: number,
  marksPerQuestion: number,
  courseOutcomes: CourseOutcome[],
  aiProvider: 'openrouter' | 'gemini' | 'local'
): Promise<KalasalingamQuestion[]> {
  
  // For now, use the local generation
  // In future, this can be enhanced to use AI providers
  return generateKalasalingamQuestions(
    pdfContent,
    courseName,
    courseCode,
    totalQuestions,
    marksPerQuestion,
    courseOutcomes,
    {}
  );
}

/**
 * Create a complete Kalasalingam paper from user inputs
 */
export function createKalasalingamPaper(
  courseCode: string,
  courseName: string,
  degree: string,
  duration: string,
  maxMarks: number,
  dateSession: string,
  examType: string,
  examMonth: string,
  courseOutcomes: CourseOutcome[],
  questions: KalasalingamQuestion[]
): KalasalingamPaper {
  
  const questionsCount = questions.length;
  const marksPerQ = questions[0]?.marks || 2;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  
  return {
    courseCode,
    courseName,
    degree,
    duration,
    maxMarks,
    dateSession,
    examType,
    examMonth,
    courseOutcomes,
    questions,
    partTitle: `PART – A (${questionsCount} x ${marksPerQ} = ${totalMarks} Marks)`
  };
}
