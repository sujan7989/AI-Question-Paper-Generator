// Simple test for PDF processing functionality
import { processSimplePDF } from './simple-pdf-processor';

/**
 * Test the PDF processing with a mock file
 */
export async function testPDFProcessing() {
  console.log('🧪 Testing PDF processing...');
  
  try {
    // Create a mock PDF file for testing
    const mockPDFContent = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    const mockFile = new File([mockPDFContent], 'test-document.pdf', { type: 'application/pdf' });
    
    console.log('📄 Created mock PDF file:', mockFile.name, mockFile.size, 'bytes');
    
    // Test the simple processor
    const result = await processSimplePDF(mockFile);
    
    console.log('✅ PDF processing test results:', {
      success: result.success,
      title: result.title,
      pages: result.numPages,
      textLength: result.text.length,
      textPreview: result.text.substring(0, 200) + '...'
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ PDF processing test failed:', error);
    throw error;
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  console.log('🚀 PDF Test available: call testPDFProcessing() in console');
  (window as any).testPDFProcessing = testPDFProcessing;
}