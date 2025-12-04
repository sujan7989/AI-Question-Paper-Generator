// Simple test script to verify AI API functionality
import { generateQuestions } from './ai';

export async function testAI() {
  console.log('🧪 Testing AI API connections...');
  
  const testPrompt = "Generate one simple multiple choice question about basic mathematics with 4 options and mark the correct answer.";
  
  // Test Gemini
  try {
    console.log('Testing Gemini API...');
    const geminiResult = await generateQuestions('gemini', testPrompt);
    console.log('✅ Gemini API working!', geminiResult.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Gemini API failed:', error.message);
  }
  
  // Test OpenRouter
  try {
    console.log('Testing OpenRouter API...');
    const openrouterResult = await generateQuestions('openrouter', testPrompt);
    console.log('✅ OpenRouter API working!', openrouterResult.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ OpenRouter API failed:', error.message);
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  console.log('🚀 AI Test available: call testAI() in console');
  (window as any).testAI = testAI;
}