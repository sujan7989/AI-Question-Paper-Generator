// REAL PDF Text Extractor - Actually reads PDF files
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * ACTUALLY extract text from PDF file
 */
export async function extractRealPDFText(file: File): Promise<string> {
  console.log('🔍 REAL PDF EXTRACTION starting for:', file.name);
  
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('📄 File converted to ArrayBuffer:', arrayBuffer.byteLength, 'bytes');
    
    // Load PDF document
    const pdf = await pdfjsLib.ge