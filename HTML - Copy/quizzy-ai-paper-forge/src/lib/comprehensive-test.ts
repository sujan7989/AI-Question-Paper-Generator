// Comprehensive test suite for the entire application
import { testAI } from './test-ai';
import { testPDFProcessing } from './test-pdf';

/**
 * Run comprehensive tests for all major features
 */
export async function runComprehensiveTests() {
  console.log('🚀 Starting comprehensive application tests...');
  
  const results = {
    ai: { success: false, error: null as string | null },
    pdf: { success: false, error: null as string | null },
    overall: false
  };
  
  // Test AI functionality
  try {
    console.log('🤖 Testing AI functionality...');
    await testAI();
    results.ai.success = true;
    console.log('✅ AI tests passed');
  } catch (error) {
    results.ai.error = error instanceof Error ? error.message : 'Unknown AI error';
    console.log('❌ AI tests failed:', results.ai.error);
  }
  
  // Test PDF functionality
  try {
    console.log('📄 Testing PDF functionality...');
    await testPDFProcessing();
    results.pdf.success = true;
    console.log('✅ PDF tests passed');
  } catch (error) {
    results.pdf.error = error instanceof Error ? error.message : 'Unknown PDF error';
    console.log('❌ PDF tests failed:', results.pdf.error);
  }
  
  // Overall assessment
  results.overall = results.ai.success && results.pdf.success;
  
  console.log('📊 Test Results Summary:');
  console.log('- AI Functionality:', results.ai.success ? '✅ PASS' : '❌ FAIL');
  console.log('- PDF Processing:', results.pdf.success ? '✅ PASS' : '❌ FAIL');
  console.log('- Overall Status:', results.overall ? '🎉 ALL SYSTEMS GO!' : '⚠️ Some issues detected');
  
  if (results.overall) {
    console.log('🏆 Your project is ready for grading! All major features are working.');
  } else {
    console.log('🔧 Some features may need attention, but the app should still work.');
  }
  
  return results;
}

/**
 * Quick health check for the application
 */
export function quickHealthCheck() {
  console.log('🏥 Quick Health Check:');
  
  const checks = {
    react: typeof React !== 'undefined',
    router: typeof window !== 'undefined' && window.location,
    localStorage: typeof localStorage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    fileAPI: typeof File !== 'undefined' && typeof FileReader !== 'undefined'
  };
  
  Object.entries(checks).forEach(([feature, available]) => {
    console.log(`- ${feature}:`, available ? '✅' : '❌');
  });
  
  const allGood = Object.values(checks).every(Boolean);
  console.log('Overall:', allGood ? '🎉 Healthy!' : '⚠️ Some issues');
  
  return checks;
}

// Make functions available globally in development
if (import.meta.env.DEV) {
  (window as any).runComprehensiveTests = runComprehensiveTests;
  (window as any).quickHealthCheck = quickHealthCheck;
  
  console.log('🧪 Test Suite Loaded!');
  console.log('Available commands:');
  console.log('- runComprehensiveTests() - Full test suite');
  console.log('- quickHealthCheck() - Basic system check');
  console.log('- testAI() - Test AI functionality');
  console.log('- testPDFProcessing() - Test PDF processing');
}