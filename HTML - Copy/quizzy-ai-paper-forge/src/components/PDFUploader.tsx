import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { extractPDFContent, isPDFFile, type PDFContent } from '@/lib/pdf-processor';
import { processSimplePDF, isLikelyPDF } from '@/lib/simple-pdf-processor';
import { toast } from '@/hooks/use-toast';

interface PDFUploaderProps {
  onPDFProcessed: (content: PDFContent) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function PDFUploader({ onPDFProcessed, onClear, disabled }: PDFUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedPDF, setProcessedPDF] = useState<PDFContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!isPDFFile(file)) {
      setError('Please select a valid PDF file.');
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB.');
      toast({
        title: "File Too Large",
        description: "Please select a PDF file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      let content: PDFContent;
      
      try {
        // Try main PDF extraction
        content = await extractPDFContent(file);
      } catch (mainError) {
        console.warn('Main PDF extraction failed, using simple processor:', mainError);
        
        // Use simple processor as fallback
        const simpleResult = await processSimplePDF(file);
        content = {
          text: simpleResult.text,
          numPages: simpleResult.numPages,
          title: simpleResult.title,
          author: undefined,
          subject: undefined,
          keywords: undefined,
        };
        
        // Show warning that we're using demo content
        if (simpleResult.success) {
          toast({
            title: "Using Demo Content",
            description: "PDF extraction had issues, using sample content for demonstration.",
            variant: "default",
          });
        }
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setProcessedPDF(content);
      onPDFProcessed(content);
      
      const isDemo = content.title?.startsWith('[DEMO]') || content.author === 'Demo Content';
      
      toast({
        title: isDemo ? "Demo Content Ready!" : "PDF Processed Successfully!",
        description: isDemo 
          ? `Created sample content for testing (${content.numPages} pages).`
          : `Extracted content from ${content.numPages} pages.`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF';
      setError(errorMessage);
      toast({
        title: "PDF Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [onPDFProcessed]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled, isProcessing]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClear = useCallback(() => {
    setProcessedPDF(null);
    setError(null);
    setProgress(0);
    onClear?.();
  }, [onClear]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Content Extractor
        </CardTitle>
        <CardDescription>
          Upload a PDF file to extract content and generate questions based on the document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!processedPDF ? (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                disabled || isProcessing
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-gray-400 cursor-pointer'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isProcessing ? 'Processing PDF...' : 'Drop your PDF here'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files (max 10MB)
                </p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  disabled={disabled || isProcessing}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload">
                  <Button
                    variant="outline"
                    disabled={disabled || isProcessing}
                    className="cursor-pointer"
                    asChild
                  >
                    <span>Choose PDF File</span>
                  </Button>
                </label>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing PDF...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>PDF Processed Successfully!</strong>
                <br />
                <strong>Title:</strong> {processedPDF.title}
                <br />
                <strong>Pages:</strong> {processedPDF.numPages}
                <br />
                <strong>Content Length:</strong> {processedPDF.text.length.toLocaleString()} characters
                {processedPDF.author && (
                  <>
                    <br />
                    <strong>Author:</strong> {processedPDF.author}
                  </>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={handleClear} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear PDF
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}