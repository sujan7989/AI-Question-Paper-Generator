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
  let pdf: any = null;
  try {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/cmaps/',
      cMapPacked: true,
    });

    pdf = await loadingTask.promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Preserve line structure by grouping items by their Y position
        const itemsByLine: Record<number, string[]> = {};
        for (const item of textContent.items as any[]) {
          if (!('str' in item) || !item.str.trim()) continue;
          const y = Math.round(item.transform[5]); // Y coordinate
          if (!itemsByLine[y]) itemsByLine[y] = [];
          itemsByLine[y].push(item.str);
        }

        // Sort lines top-to-bottom (descending Y in PDF coords)
        const sortedYs = Object.keys(itemsByLine)
          .map(Number)
          .sort((a, b) => b - a);

        const pageLines = sortedYs.map(y => itemsByLine[y].join(' ').trim()).filter(Boolean);
        const pageText = pageLines.join('\n');

        if (pageText.trim()) {
          fullText += `\n\n=== Page ${pageNum} ===\n${pageText}`;
        }

        page.cleanup();
      } catch {
        // skip unreadable page
      }
    }

    // Sanitize — remove null bytes and control chars
    fullText = fullText
      .replace(/[\0]/g, '')
      .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[\uD800-\uDFFF]/g, '')
      .trim();

    if (fullText.length < 50) {
      return {
        text: '',
        numPages: pdf.numPages,
        success: false,
        error: 'This PDF appears to be image-based (scanned). Please upload a text-based PDF so content can be extracted.',
      };
    }

    return { text: fullText, numPages: pdf.numPages, success: true };

  } catch (error) {
    return {
      text: '',
      numPages: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PDF error',
    };
  } finally {
    if (pdf) { try { pdf.destroy(); } catch {} }
  }
}
