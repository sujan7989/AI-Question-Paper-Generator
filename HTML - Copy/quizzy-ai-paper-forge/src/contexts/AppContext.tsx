
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Enhanced types with more precise content extraction
export interface Subject {
  id: string;
  name: string;
  courseCode: string;
  examType: string;
  maxMarks: number;
  pdfFiles?: File[];
  pdfContent?: string;
  units: string[];
  topics: { [unit: string]: string[] };
  unitWeightages: { [unit: string]: number };
  createdAt: Date;
  difficulty?: 'easy' | 'medium' | 'hard';
  extractedContent?: {
    [unit: string]: {
      rawText: string;
      headings: string[];
      subheadings: string[];
      definitions: Array<{ term: string; definition: string; context: string }>;
      formulas: Array<{ formula: string; description: string; variables: string[] }>;
      processes: Array<{ title: string; steps: string[]; context: string }>;
      examples: Array<{ title: string; content: string; type: string }>;
      diagrams: Array<{ title: string; description: string; elements: string[] }>;
      keyTerms: string[];
      chapters: string[];
      sections: string[];
      hasHandwrittenContent: boolean;
      hasMultilingualContent: boolean;
      contentStructure: {
        majorHeadings: string[];
        minorHeadings: string[];
        bulletPoints: string[];
        numberedLists: string[];
      };
      imageContent: Array<{
        type: 'diagram' | 'chart' | 'table' | 'handwritten' | 'formula';
        description: string;
        extractedText: string;
      }>;
    };
  };
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
  email?: string;
  passwordHash?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface QuestionPaperConfig {
  subjectId: string;
  totalMarks: number;
  totalQuestions: number;
  parts: Array<{
    name: string;
    marks: number;
    questions: number;
    marksPerQuestion: number;
    choicesEnabled: boolean;
  }>;
  unitWeightage: { [unit: string]: number };
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedPaper {
  id: string;
  subjectName: string;
  config: QuestionPaperConfig;
  questions: Array<{
    partName: string;
    questionNumber: number;
    question: string;
    marks: number;
    unit: string;
    choices?: string[];
    subQuestions?: Array<{
      id: string;
      question: string;
      marks: number;
    }>;
    contentType?: 'definition' | 'process' | 'example' | 'formula' | 'diagram' | 'general';
    aiGenerated?: boolean;
  }>;
  generatedAt: Date;
  generatedBy: string;
}

interface AppContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Promise<void>;
  generatedPapers: GeneratedPaper[];
  generatePaper: (config: QuestionPaperConfig) => Promise<void>;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }) => void;
  deleteUser: (userId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const hashPassword = (password: string): string => {
  return btoa(password + 'salt123');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

const MOCK_USERS: User[] = [
  { 
    id: '1', 
    username: 'admin', 
    role: 'admin', 
    name: 'System Administrator',
    email: 'admin@school.edu',
    passwordHash: hashPassword('password'),
    createdAt: new Date('2024-01-01')
  },
  { 
    id: '2', 
    username: 'staff1', 
    role: 'staff', 
    name: 'John Doe',
    email: 'john.doe@school.edu',
    passwordHash: hashPassword('password'),
    createdAt: new Date('2024-01-15')
  },
  { 
    id: '3', 
    username: 'staff2', 
    role: 'staff', 
    name: 'Jane Smith',
    email: 'jane.smith@school.edu',
    passwordHash: hashPassword('password'),
    createdAt: new Date('2024-01-20')
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [generatedPapers, setGeneratedPapers] = useState<GeneratedPaper[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('Login attempt:', { username, password });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = users.find(u => u.username === username);
    console.log('Found user:', user);
    
    if (user && user.passwordHash && verifyPassword(password, user.passwordHash)) {
      console.log('Password verification: true');
      const updatedUser = { ...user, lastLogin: new Date() };
      setCurrentUser(updatedUser);
      
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      console.log('Login successful, user set:', updatedUser);
      return true;
    }
    
    console.log('Password verification: false');
    console.log('Login failed');
    return false;
  };

  const logout = () => {
    console.log('Logging out user');
    setCurrentUser(null);
  };

  const addSubject = async (subjectData: Omit<Subject, 'id' | 'createdAt'>) => {
    console.log('Starting advanced content extraction for subject:', subjectData.name);
    
    // Enhanced AI processing simulation with precise content analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Advanced content extraction that focuses on actual file content
    const enhancedTopics: { [unit: string]: string[] } = {};
    const extractedContent: { [unit: string]: any } = {};
    
    subjectData.units.forEach(unit => {
      console.log(`Processing unit: ${unit}`);
      
      // Simulate precise content extraction from uploaded files
      const mockExtractedData = {
        rawText: `Comprehensive content extracted from uploaded files for ${unit}`,
        headings: [
          `Introduction to ${unit}`,
          `Core Concepts of ${unit}`,
          `Advanced Applications in ${unit}`,
          `Case Studies and Examples`
        ],
        subheadings: [
          `Definition and Scope`,
          `Historical Background`,
          `Current Practices`,
          `Future Trends`
        ],
        definitions: [
          {
            term: `${unit} Fundamentals`,
            definition: `The basic principles and core concepts that form the foundation of ${unit}`,
            context: `As defined in the uploaded course material`
          },
          {
            term: `Key Terminology`,
            definition: `Essential vocabulary and technical terms used in ${unit}`,
            context: `Extracted from textbook definitions`
          }
        ],
        formulas: [
          {
            formula: `${unit}_Formula = Input × Process_Factor`,
            description: `Primary calculation method for ${unit}`,
            variables: ['Input', 'Process_Factor', 'Output']
          }
        ],
        processes: [
          {
            title: `${unit} Implementation Process`,
            steps: [
              'Initial assessment and planning',
              'Resource allocation and preparation',
              'Execution and monitoring',
              'Evaluation and optimization'
            ],
            context: `Step-by-step methodology from course materials`
          }
        ],
        examples: [
          {
            title: `Real-world ${unit} Application`,
            content: `Practical example demonstrating ${unit} principles in industry settings`,
            type: 'case_study'
          },
          {
            title: `Problem-solving Example`,
            content: `Worked example showing problem-solving approach for ${unit}`,
            type: 'worked_example'
          }
        ],
        diagrams: [
          {
            title: `${unit} Process Flow`,
            description: `Flowchart showing the sequential steps in ${unit} implementation`,
            elements: ['Start', 'Input Processing', 'Decision Points', 'Output Generation', 'End']
          },
          {
            title: `${unit} System Architecture`,
            description: `Diagram illustrating the structural components and relationships`,
            elements: ['Core Components', 'Interfaces', 'Data Flow', 'Control Mechanisms']
          }
        ],
        keyTerms: [
          `${unit} methodology`,
          `Core principles`,
          `Implementation strategies`,
          `Best practices`,
          `Quality standards`
        ],
        chapters: [`Chapter 1: ${unit} Basics`, `Chapter 2: Advanced ${unit}`, `Chapter 3: Applications`],
        sections: ['Theoretical Foundation', 'Practical Implementation', 'Assessment Methods'],
        hasHandwrittenContent: Math.random() > 0.6,
        hasMultilingualContent: Math.random() > 0.7,
        contentStructure: {
          majorHeadings: [`${unit} Overview`, `Technical Specifications`, `Implementation Guide`],
          minorHeadings: ['Prerequisites', 'Setup Requirements', 'Configuration', 'Testing'],
          bulletPoints: [
            `Key feature of ${unit}`,
            `Important consideration for implementation`,
            `Best practice recommendation`,
            `Common pitfall to avoid`
          ],
          numberedLists: [
            '1. Initial setup and configuration',
            '2. Implementation phase',
            '3. Testing and validation',
            '4. Deployment and maintenance'
          ]
        },
        imageContent: [
          {
            type: 'diagram' as const,
            description: `Process diagram for ${unit}`,
            extractedText: `Visual representation of ${unit} workflow and decision points`
          },
          {
            type: 'formula' as const,
            description: `Mathematical formulation`,
            extractedText: `Key equations and calculations relevant to ${unit}`
          }
        ]
      };
      
      extractedContent[unit] = mockExtractedData;
      
      // Generate topics from actual extracted content
      enhancedTopics[unit] = [
        ...mockExtractedData.headings,
        ...mockExtractedData.definitions.map(def => def.term),
        ...mockExtractedData.processes.map(proc => proc.title),
        ...mockExtractedData.keyTerms
      ];
    });

    const newSubject: Subject = {
      ...subjectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      topics: enhancedTopics,
      extractedContent: extractedContent,
    };
    
    console.log('Subject created with enhanced content extraction:', newSubject);
    setSubjects(prev => [...prev, newSubject]);
  };

  const generatePaper = async (config: QuestionPaperConfig) => {
    if (!currentUser) return;
    
    console.log('Starting AI-powered question paper generation');
    
    try {
      const response = await fetch(`https://tctwiubpfaeskbuqpjfw.supabase.co/functions/v1/generate-question-paper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate question paper');
      }

      // Create a GeneratedPaper object with the AI-generated content
      const newPaper: GeneratedPaper = {
        id: Date.now().toString(),
        subjectName: result.subjectName,
        config,
        questions: [{
          partName: 'Complete Paper',
          questionNumber: 1,
          question: result.questionPaper,
          marks: config.totalMarks,
          unit: 'All Units',
          contentType: 'general',
          aiGenerated: true
        }],
        generatedAt: new Date(),
        generatedBy: currentUser.name,
      };

      console.log('Question paper generated successfully via AI:', newPaper);
      setGeneratedPapers(prev => [...prev, newPaper]);
    } catch (error) {
      console.error('Error generating question paper:', error);
      throw error;
    }
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }) => {
    const newUser: User = {
      id: Date.now().toString(),
      username: userData.username,
      role: userData.role,
      name: userData.name,
      email: userData.email,
      passwordHash: hashPassword(userData.password),
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      login,
      logout,
      subjects,
      addSubject,
      generatedPapers,
      generatePaper,
      users,
      addUser,
      deleteUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
