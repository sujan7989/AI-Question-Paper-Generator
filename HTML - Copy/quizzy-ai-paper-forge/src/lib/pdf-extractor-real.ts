// Real PDF Content Extraction System
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

export interface PDFExtractionResult {
  text: string;
  numPages: number;
  success: boolean;
  error?: string;
}

/**
 * Extract actual text content from PDF file
 */
export async function extractRealPDFContent(file: File): Promise<PDFExtractionResult> {
  console.log('═══════════════════════════════════════════════');
  console.log('🔍 REAL PDF EXTRACTION STARTING...');
  console.log('📄 File:', file.name);
  console.log('📊 Size:', file.size, 'bytes');
  console.log('📝 Type:', file.type);
  console.log('═══════════════════════════════════════════════');
  
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('✅ File loaded into memory');
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false
    });
    
    const pdf = await loadingTask.promise;
    console.log(`✅ PDF loaded: ${pdf.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : '') || '')
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += `\n\n=== Page ${pageNum} ===\n${pageText}`;
          console.log(`✅ Page ${pageNum}: ${pageText.length} characters extracted`);
        }
        
        page.cleanup();
      } catch (pageError) {
        console.warn(`⚠️ Failed to extract page ${pageNum}:`, pageError);
      }
    }
    
    // Clean up
    pdf.destroy();
    
    // Sanitize text
    fullText = fullText
      .replace(/[\0]/g, '')
      .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
    
    if (fullText.length < 50) {
      throw new Error('Extracted text is too short or empty');
    }
    
    console.log(`✅ EXTRACTION SUCCESS: ${fullText.length} characters total`);
    console.log(`📖 Preview: ${fullText.substring(0, 200)}...`);
    
    return {
      text: fullText,
      numPages: pdf.numPages,
      success: true
    };
    
  } catch (error) {
    console.error('❌ PDF EXTRACTION FAILED:', error);
    return {
      text: '',
      numPages: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
