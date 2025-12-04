// Simple system test to verify everything is working
import { generateQuestions } from './ai';

/**
 * Test the complete system functionality
 */
export async function testCompleteSystem() {
  console.log('🧪 Testing complete system functionality...');
  
  try {
    // Test AI generation
    console.log('Testing AI question generation...');
    const testPrompt = `
Subject: Computer Science
Total Marks: 100
Difficulty: medium

Source Content:
Programming fundamentals including variables, functions, loops, and data structures.
Object-oriented programming concepts such as classes, inheritance, and polymorphism.
Database management systems and SQL queries.
Web development technologies including HTML, CSS, and JavaScript.

Generate a question paper with:
- Part A: 5 short questions (20 marks)
- Part B: 3 medium questions (30 marks)  
- Part C: 2 long questions (50 marks)
`;

    const result = await generateQuestions('gemini', testPrompt);
    
    if (result && result.length > 100) {
      console.log('✅ AI generation working!');
      console.log('Sample output:', result.substring(0, 200) + '...');
      return { success: true, message: 'System is working perfectly!' };
    } else {
      throw new Error('AI generation returned insufficient content');
    }
    
  } catch (error) {
    console.error('❌ System test failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Make test available globally in development
if (import.meta.env.DEV) {
  (window as any).testCompleteSystem = testCompleteSystem;
  console.log('🧪 System test available: call testCompleteSystem() in console');
}