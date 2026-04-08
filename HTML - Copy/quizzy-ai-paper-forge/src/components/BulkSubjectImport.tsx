// Feature 6: Bulk Subject Import via CSV
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParsedSubject {
  subjectName: string;
  courseCode: string;
  examType: string;
  maxMarks: string;
  valid: boolean;
  error?: string;
}

interface BulkSubjectImportProps {
  onImport?: (subjects: ParsedSubject[]) => void;
}

const SAMPLE_CSV = `Subject Name,Course Code,Exam Type,Max Marks
Data Structures,CS201,End Semester Exam / University Exam,100
Operating Systems,CS301,Internal Exam / Mid-Semester Exam,50
Computer Networks,CS401,End Semester Exam / University Exam,100`;

export function BulkSubjectImport({ onImport }: BulkSubjectImportProps) {
  const [parsed, setParsed] = useState<ParsedSubject[]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_subjects.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast({ title: 'Invalid CSV', description: 'File must have a header row and at least one data row.', variant: 'destructive' });
        return;
      }
      // Skip header
      const rows = lines.slice(1);
      const subjects: ParsedSubject[] = rows.map(row => {
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const [subjectName, courseCode, examType, maxMarks] = cols;
        if (!subjectName || !courseCode || !examType || !maxMarks) {
          return { subjectName: subjectName || '', courseCode: courseCode || '', examType: examType || '', maxMarks: maxMarks || '', valid: false, error: 'Missing required fields' };
        }
        if (isNaN(Number(maxMarks)) || Number(maxMarks) <= 0) {
          return { subjectName, courseCode, examType, maxMarks, valid: false, error: 'Max marks must be a positive number' };
        }
        return { subjectName, courseCode, examType, maxMarks, valid: true };
      });
      setParsed(subjects);
    };
    reader.readAsText(file);
  };

  const validCount = parsed.filter(s => s.valid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />Bulk Subject Import
        </CardTitle>
        <CardDescription>Import multiple subjects at once using a CSV file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadSample}>
            <Download className="w-4 h-4 mr-2" />Download Sample CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileText className="w-4 h-4 mr-2" />Choose CSV File
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {fileName && (
          <p className="text-sm text-muted-foreground">File: <strong>{fileName}</strong></p>
        )}

        {parsed.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-500">{validCount} valid</Badge>
              <Badge variant="destructive">{parsed.length - validCount} invalid</Badge>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {parsed.map((s, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded border text-sm ${s.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {s.valid ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-medium">{s.subjectName || '(empty)'}</span>
                    <span className="text-muted-foreground text-xs">{s.courseCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.maxMarks} marks</span>
                    {!s.valid && <span className="text-xs text-red-600">{s.error}</span>}
                  </div>
                </div>
              ))}
            </div>
            {validCount > 0 && (
              <Button
                onClick={() => {
                  onImport?.(parsed.filter(s => s.valid));
                  toast({ title: 'Import Ready', description: `${validCount} subjects ready. Note: Full import requires individual subject setup with PDFs.` });
                }}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />Import {validCount} Valid Subjects
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>CSV Format:</strong> Subject Name, Course Code, Exam Type, Max Marks<br />
          Note: After import, you'll need to upload PDFs for each subject individually.
        </div>
      </CardContent>
    </Card>
  );
}
