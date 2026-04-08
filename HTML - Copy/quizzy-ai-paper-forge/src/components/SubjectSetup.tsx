import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createSubjectWithUnits, type SubjectFormData } from '@/lib/subject-manager';
import { Upload, FileText, Book, Brain, Zap, CheckCircle, AlertCircle, FileCheck, Eye } from 'lucide-react';

interface UnitData {
  name: string;
  pdfFile?: File;
  weightage: number;
  pdfPreviewUrl?: string; // Feature 12: PDF first-page preview
}

interface SubjectSetupProps {
  onSubjectCreated: () => void;
}

export function SubjectSetup({ onSubjectCreated }: SubjectSetupProps) {
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [examType, setExamType] = useState<'objective' | 'descriptive' | ''>('');
  const [specificExamType, setSpecificExamType] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [numUnits, setNumUnits] = useState(0);
  const [units, setUnits] = useState<UnitData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  const descriptiveExamTypes = [
    'Formative Assessment (FA)', 'Summative Assessment (SA)', 'Unit Test', 
    'Periodic Test', 'Mid-Term Exam', 'Annual Exam / Final Exam', 'Board Exam', 
    'Internal Exam / Mid-Semester Exam', 'End-Semester Exam / University Exam', 'Assignment'
  ];

  const objectiveExamTypes = [
    'Weekly Test / Class Test', 'Entrance Exam', 'Competitive / Certification Exams', 
    'Online Exam (objective)', 'Formative Assessment (objective)'
  ];
  
  const allExamTypes = [...descriptiveExamTypes, ...objectiveExamTypes];

  const handleExamTypeChange = (value: string) => {
    setSpecificExamType(value);
    if (descriptiveExamTypes.includes(value)) {
      setExamType('descriptive');
    } else if (objectiveExamTypes.includes(value)) {
      setExamType('objective');
    } else {
      setExamType('');
    }
  };

  const handleUnitsChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num < 0) return;
    
    setNumUnits(num);
    
    const newUnits: UnitData[] = Array.from({ length: num }, (_, i) => ({
      name: units[i]?.name || `Unit ${i + 1}`,
      pdfFile: units[i]?.pdfFile,
      weightage: units[i]?.weightage || Math.floor(100 / (num || 1)),
    }));
    setUnits(newUnits);
  };

  const updateUnit = (index: number, field: keyof UnitData, value: any) => {
    const newUnits = [...units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setUnits(newUnits);
  };

  const handleFileChange = (index: number, files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      const newUnits = [...units];
      newUnits[index] = { ...newUnits[index], pdfFile: file, pdfPreviewUrl: url };
      setUnits(newUnits);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      return toast({ title: "Authentication Error", description: "Please log in to continue.", variant: "destructive" });
    }

    if (!subjectName.trim() || !courseCode.trim() || !examType || !maxMarks || units.length === 0) {
      return toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
    }

    const totalWeightage = units.reduce((sum, unit) => sum + unit.weightage, 0);
    if (Math.round(totalWeightage) !== 100) {
      return toast({ title: "Invalid Weightage", description: `Total weightage must be 100%. Current: ${totalWeightage}%`, variant: "destructive" });
    }

    // Check if at least one unit has a PDF
    const unitsWithPDF = units.filter(unit => unit.pdfFile);
    if (unitsWithPDF.length === 0) {
      return toast({ 
        title: "No PDFs Uploaded", 
        description: "Please upload at least one PDF file for content extraction.", 
        variant: "destructive" 
      });
    }

    setIsLoading(true);
    setProcessingProgress(0);
    setProcessingMessage('Starting subject creation...');

    try {
      const formData: SubjectFormData = {
        subjectName,
        courseCode,
        examType,
        maxMarks: parseInt(maxMarks),
        numUnits,
        units: units.map(unit => ({
          name: unit.name,
          weightage: unit.weightage,
          pdfFile: unit.pdfFile
        }))
      };

      await createSubjectWithUnits(
        formData,
        user.id,
        (progress, message) => {
          setProcessingProgress(progress);
          setProcessingMessage(message);
        }
      );
      
      toast({ 
        title: "Subject Created Successfully!", 
        description: `${subjectName} is ready with PDF content extracted.` 
      });
      
      onSubjectCreated();
      
      // Reset form
      setSubjectName('');
      setCourseCode('');
      setExamType('');
      setSpecificExamType('');
      setMaxMarks('');
      setNumUnits(0);
      setUnits([]);
      
    } catch (error: any) {
      console.error('Subject creation error:', error);
      toast({ 
        title: "Error Creating Subject", 
        description: error.message || 'An unexpected error occurred', 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
      setProcessingMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subject & Syllabus Setup</h2>
        <p className="text-muted-foreground">Configure subjects with AI-powered content extraction from uploaded materials.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Brain className="w-6 h-6 mr-2" />Subject Configuration</CardTitle>
          <CardDescription>Configure subject details and upload syllabus materials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name *</Label>
                <Input id="subjectName" placeholder="e.g., Advanced Computer Science" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code *</Label>
                <Input id="courseCode" placeholder="e.g., CS101" value={courseCode} onChange={(e) => setCourseCode(e.target.value.toUpperCase())} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type *</Label>
                <Select value={specificExamType} onValueChange={handleExamTypeChange} required>
                  <SelectTrigger><SelectValue placeholder="Select exam type" /></SelectTrigger>
                  <SelectContent>
                    {allExamTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMarks">Maximum Marks *</Label>
                <Input id="maxMarks" type="number" placeholder="e.g., 100" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} min="1" required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="numUnits">Number of Units/Chapters *</Label>
                <Input id="numUnits" type="number" placeholder="How many units?" value={numUnits || ''} onChange={(e) => handleUnitsChange(e.target.value)} min="1" max="20" required />
              </div>
            </div>
            
            {units.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h4 className="font-semibold flex items-center"><FileText className="w-4 h-4 mr-2" />Unit Configuration</h4>
                {units.map((unit, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Unit {index + 1}: {unit.name}</Label>
                          <Input placeholder={`Enter name for Unit ${index + 1}`} value={unit.name} onChange={(e) => updateUnit(index, 'name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Weightage (%)</Label>
                          <Input type="number" placeholder="%" value={unit.weightage} onChange={(e) => updateUnit(index, 'weightage', parseInt(e.target.value) || 0)} required />
                        </div>
                        <div className="md:col-span-3">
                          <Label className="flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload PDF for Unit {index + 1} *
                          </Label>
                          <Input 
                            type="file" 
                            accept=".pdf" 
                            onChange={(e) => handleFileChange(index, e.target.files)} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                          />
                          {unit.pdfFile ? (
                            <div className="flex items-center text-xs text-green-600 mt-1">
                              <FileCheck className="w-3 h-3 mr-1" />
                              {unit.pdfFile.name} ({(unit.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          ) : (
                            <div className="flex items-center text-xs text-orange-600 mt-1">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              PDF required for content extraction
                            </div>
                          )}
                          {/* Feature 12: PDF Preview */}
                          {unit.pdfPreviewUrl && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Eye className="w-3 h-3" />PDF Preview (first page)</p>
                              <iframe
                                src={`${unit.pdfPreviewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full rounded border"
                                style={{ height: '200px' }}
                                title={`Preview of ${unit.pdfFile?.name}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {isLoading && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{processingMessage}</span>
                      <span className="text-sm font-bold text-blue-600">{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="w-full h-2" />
                    <div className="grid grid-cols-4 gap-1 text-xs text-center">
                      {[
                        { label: 'Creating Subject', threshold: 20 },
                        { label: 'Uploading PDFs', threshold: 50 },
                        { label: 'Extracting Content', threshold: 80 },
                        { label: 'Saving to DB', threshold: 100 },
                      ].map((step) => (
                        <div
                          key={step.label}
                          className={`p-1 rounded text-xs ${
                            processingProgress >= step.threshold
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : processingProgress >= step.threshold - 30
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                          }`}
                        >
                          {processingProgress >= step.threshold ? '✓ ' : ''}{step.label}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Please wait — PDF extraction may take 10–30 seconds per file.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {units.length > 0 && !isLoading && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-sm">
                    <strong>Ready to create:</strong> {subjectName || 'Subject'} with {units.length} units
                    <br />
                    <strong>PDFs uploaded:</strong> {units.filter(u => u.pdfFile).length} of {units.length} units
                    <br />
                    <strong>Total weightage:</strong> {units.reduce((sum, unit) => sum + unit.weightage, 0)}%
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Zap className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><Book className="w-4 h-4 mr-2" />Create Subject</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}