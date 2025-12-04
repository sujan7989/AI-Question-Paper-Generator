// University Question Paper Format - Kalasalingam Academy
// Generates questions matching the exact university format

export interface UniversityQuestion {
  number: number;
  question: string;
  pattern: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  co: number; // Course Outcome (2, 3, or 4)
  marks: number;
}

export interface UniversityPaper {
  courseCode: string;
  courseName: string;
  degree: string;
  duration: string;
  maxMarks: number;
  dateSession: string;
  courseOutcomes: Array<{ co: string; description: string }>;
  questions: UniversityQuestion[];
}

/**
 * Generate questions from PDF content in university format
 */
export function generateUniversityQuestions(
  pdfContent: string,
  courseName: string,
  courseCode: string = '21ECE1400'
): UniversityPaper {
  const questions: UniversityQuestion[] = [];
  let qNum = 1;
  
  // Analyze content
  const terms = extractKeyTerms(pdfContent);
  const concepts = extractConcepts(pdfContent);
  
  // Generate 25 questions (25 x 2 = 50 marks)
  // Remember: 13 questions (26 marks)
  for (let i = 0; i < 13; i++) {
    questions.push({
      number: qNum++,
      question: generateRememberQuestion(terms, concepts, i),
      pattern: 'Remember',
      co: getCO(i),
      marks: 2
    });
  }

  
  // Understand: 11 questions (22 marks)
  for (let i = 0; i < 11; i++) {
    questions.push({
      number: qNum++,
      question: generateUnderstandQuestion(concepts, i),
      pattern: 'Understand',
      co: getCO(i + 13),
      marks: 2
    });
  }
  
  // Apply: 1 question (2 marks)
  questions.push({
    number: qNum++,
    question: generateApplyQuestion(),
    pattern: 'Apply',
    co: 2,
    marks: 2
  });
  
  return {
    courseCode,
    courseName,
    degree: 'B. Tech',
    duration: '90 Minutes',
    maxMarks: 50,
    dateSession: new Date().toLocaleDateString('en-GB'),
    courseOutcomes: [
      { co: 'CO2', description: 'Analyse the optimal usage of microcontroller' },
      { co: 'CO3', description: 'Demonstrate the usage of sensors and actuators for specific requirements' },
      { co: 'CO4', description: 'Analyse the communication protocols for different devices and its applications' }
    ],
    questions
  };
}

function extractKeyTerms(content: string): string[] {
  const words = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  return [...new Set(words)].slice(0, 30);
}

function extractConcepts(content: string): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.length > 30);
  return sentences.slice(0, 20);
}


function getCO(index: number): number {
  // Distribute across CO2, CO3, CO4
  const pattern = [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
  return pattern[index % pattern.length];
}

function generateRememberQuestion(terms: string[], concepts: string[], index: number): string {
  const questions = [
    `What are the different types of ${terms[0] || 'number systems'} commonly used in computing`,
    `Convert the decimal number 13 to its binary equivalent`,
    `How does an XOR gate differ from an OR gate`,
    `What is the key difference between analog and digital signals`,
    `What is the function of an ADC`,
    `What is Pulse Width Modulation (PWM)`,
    `What is the clock speed of the Arduino UNO microcontroller`,
    `Define a sensor and give an example`,
    `What are the four main signals in SPI communication`,
    `Explain the significance of start and stop bits in UART communication`,
    `What is Zigbee primarily used for?`,
    `What frequency bands does WiFi commonly operate in`,
    `What kind of communication is Bluetooth typically used for?`
  ];
  return questions[index] || `What is ${terms[index % terms.length]}?`;
}

function generateUnderstandQuestion(concepts: string[], index: number): string {
  const questions = [
    `How does a sensor differ from an actuator in terms of input and output`,
    `What does a humidity sensor measure`,
    `How is a flex sensor used to measure bending or flexing`,
    `Name one application where pressure sensors are used`,
    `Mention one type of proximity sensor`,
    `Where are IR sensors typically used`,
    `How does an ultrasonic sensor determine distance?`,
    `What is a relay, and how does it function`,
    `Name two types of electric motors used in actuator applications`,
    `Give one advantage of serial communication over parallel communication`,
    `Name one difference between SCI and SPI`
  ];
  return questions[index] || `Explain the concept discussed in the material`;
}

function generateApplyQuestion(): string {
  return `Convert the decimal number 13 to its binary equivalent`;
}


/**
 * Format the paper in university format with proper table structure
 */
export function formatUniversityPaper(paper: UniversityPaper): string {
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  
  let output = `
================================================================================
                                                                            
         KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION                     
                     (Deemed to be University)                              
              Anand Nagar, Krishnankoil-626 126                             
                                                                            
              SESSIONAL EXAMINATION – II – ${month}
                                                                            
================================================================================

Course Code    : ${paper.courseCode}
Course Name    : ${paper.courseName}
Degree         : ${paper.degree}
Duration       : ${paper.duration}
Max. Marks     : ${paper.maxMarks}
Date & Session : ${paper.dateSession}

COs TO BE ASSESSED DURING SESSIONAL EXAMINATION II:
${paper.courseOutcomes.map(co => `${co.co} | ${co.description}`).join('\n')}

================================================================================
PART – A (25 x 2 = 50 Marks)
Answer ALL Questions
================================================================================

`;

  // Add questions with Pattern, Mapping COs, and Marks on the RIGHT side
  paper.questions.forEach((q) => {
    const questionText = `${q.number}. ${q.question}`;
    const rightInfo = `Pattern: ${q.pattern} | Mapping COs: ${q.co} | Marks: ${q.marks}`;
    
    // Calculate spacing to align right info to the right
    const totalWidth = 80;
    const questionLength = questionText.length;
    const rightInfoLength = rightInfo.length;
    const spacing = totalWidth - questionLength - rightInfoLength;
    
    if (spacing > 0) {
      output += `${questionText}${' '.repeat(spacing)}${rightInfo}\n\n`;
    } else {
      // If question is too long, put info on next line aligned to right
      output += `${questionText}\n`;
      output += `${' '.repeat(totalWidth - rightInfoLength)}${rightInfo}\n\n`;
    }
  });

  output += `
================================================================================
Assessment Pattern as per Bloom's Taxonomy:
================================================================================

┌─────────┬──────────┬────────────┬───────┬─────────┬──────────┬────────┬───────┐
│   COs   │ Remember │ Understand │ Apply │ Analyze │ Evaluate │ Create │ Total │
├─────────┼──────────┼────────────┼───────┼─────────┼──────────┼────────┼───────┤
│   CO2   │    12    │            │   2   │         │          │        │   14  │
├─────────┼──────────┼────────────┼───────┼─────────┼──────────┼────────┼───────┤
│   CO3   │    4     │     16     │       │         │          │        │   20  │
├─────────┼──────────┼────────────┼───────┼─────────┼──────────┼────────┼───────┤
│   CO4   │    10    │     6      │       │         │          │        │   16  │
├─────────┼──────────┼────────────┼───────┼─────────┼──────────┼────────┼───────┤
│  Total  │    26    │     22     │   2   │         │          │        │   50  │
└─────────┴──────────┴────────────┴───────┴─────────┴──────────┴────────┴───────┘

================================================================================
                                  *****
================================================================================
`;

  return output;
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

function calculateBloomsDistribution(questions: UniversityQuestion[]) {
  const dist = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };
  questions.forEach(q => {
    const key = q.pattern.toLowerCase() as keyof typeof dist;
    dist[key] += q.marks;
  });
  return dist;
}
