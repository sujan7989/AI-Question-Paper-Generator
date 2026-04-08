// PDF processing utilities — real extraction only, no hardcoded content
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

export interface PDFContent {
  text: string;
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\0]/g, '')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract real text content from a PDF file using PDF.js.
 * No fallback to hardcoded/generic content — throws if extraction fails.
 */
export async function extractPDFContent(file: File): Promise<PDFContent> {
  if (!file || file.size === 0) {
    throw new Error('Invalid or empty file.');
  }

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
    disableFontFace: false,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;

  let metadata: { info?: { Title?: string; Author?: string; Subject?: string; Keywords?: string } } = {};
  try { metadata = await pdf.getMetadata(); } catch { /* metadata optional */ }

  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 100);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group items by Y position to preserve line structure
      const byLine: Record<number, string[]> = {};
      for (const item of textContent.items as any[]) {
        if (!('str' in item) || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        if (!byLine[y]) byLine[y] = [];
        byLine[y].push(item.str);
      }

      const sortedYs = Object.keys(byLine).map(Number).sort((a, b) => b - a);
      const pageLines = sortedYs.map(y => byLine[y].join(' ').trim()).filter(Boolean);
      const pageText = pageLines.join('\n');

      if (pageText.trim()) {
        fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
      }

      page.cleanup();
    } catch {
      // skip unreadable page, continue
    }
  }

  pdf.destroy();

  const cleaned = sanitizeText(fullText);

  if (cleaned.length < 100) {
    throw new Error(
      `Could not extract readable text from "${file.name}". ` +
      `This PDF may be image-based or scanned. Please upload a text-based PDF ` +
      `(one where you can select and copy text).`
    );
  }

  return {
    text: cleaned,
    numPages: pdf.numPages,
    title: metadata.info?.Title ? sanitizeText(metadata.info.Title) : file.name.replace(/\.pdf$/i, ''),
    author: metadata.info?.Author ? sanitizeText(metadata.info.Author) : undefined,
    subject: metadata.info?.Subject ? sanitizeText(metadata.info.Subject) : undefined,
    keywords: metadata.info?.Keywords ? sanitizeText(metadata.info.Keywords) : undefined,
  };
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function formatPDFContentForAI(pdfContent: PDFContent, maxLength = 8000): string {
  let content = pdfContent.text;

  if (content.length > maxLength) {
    const truncated = content.substring(0, maxLength);
    const breakPoint = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('\n\n'));
    content = breakPoint > maxLength * 0.8
      ? truncated.substring(0, breakPoint + 1)
      : truncated;
    content += '\n\n[Content truncated for processing...]';
  }

  let formatted = '';
  if (pdfContent.title) formatted += `Document Title: ${pdfContent.title}\n`;
  if (pdfContent.subject) formatted += `Subject: ${pdfContent.subject}\n`;
  if (pdfContent.author) formatted += `Author: ${pdfContent.author}\n`;
  formatted += `\nDocument Content (${pdfContent.numPages} pages):\n${content}`;

  return formatted;
}
