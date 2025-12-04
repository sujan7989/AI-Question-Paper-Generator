// Fallback PDF processing using FileReader and basic text extraction
export interface SimplePDFContent {
  text: string;
  numPages: number;
  title: string;
}

/**
 * Simple fallback PDF text extraction
 * This is a basic implementation that tries to extract text from PDF files
 * when the main PDF.js processor fails
 */
export async function extractPDFContentFallback(file: File): Promise<SimplePDFContent> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert to string and try to extract text
        let text = '';
        for (let i = 0; i < uint8Array.length; i++) {
          const char = String.fromCharCode(uint8Array[i]);
          // Only include printable ASCII characters
          if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
            text += char;
          } else if (char === '\n' || char === '\r' || char === '\t') {
            text += ' ';
          }
        }
        
        // Clean up the extracted text
        text = text
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/[^\w\s.,!?;:()\-]/g, '') // Remove non-printable characters
          .trim();
        
        // Extract meaningful content (remove PDF metadata/structure)
        const lines = text.split(' ').filter(line => 
          line.length > 2 && 
          !line.startsWith('/') && 
          !line.includes('obj') &&
          !line.includes('endobj') &&
          !/^\d+$/.test(line)
        );
        
        const cleanText = lines.join(' ').substring(0, 5000); // Limit to 5000 chars
        
        if (cleanText.length < 50) {
          throw new Error('Could not extract meaningful text from PDF');
        }
        
        resolve({
          text: cleanText,
          numPages: 1, // Can't determine pages with this method
          title: file.name.replace('.pdf', '')
        });
        
      } catch (error) {
        reject(new Error(`Fallback PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates sample content when PDF extraction completely fails
 * This ensures the user can still test the system
 */
export function createSamplePDFContent(fileName: string): SimplePDFContent {
  return {
    text: `Sample content from ${fileName}. This is a demonstration of how the system would work with extracted PDF content. 

Key Topics:
- Introduction to the subject matter
- Core concepts and definitions  
- Practical applications and examples
- Advanced techniques and methodologies
- Summary and conclusions

This sample content allows you to test the question generation system even when PDF extraction encounters issues. In a real scenario, this would contain the actual text extracted from your PDF document.`,
    numPages: 1,
    title: fileName.replace('.pdf', '')
  };
}