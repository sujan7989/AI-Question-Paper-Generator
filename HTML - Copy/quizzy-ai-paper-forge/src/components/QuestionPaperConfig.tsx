import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/use-toast';
import { QuestionPaperPreview } from '@/components/QuestionPaperPreview';
import { PapersList } from '@/components/PapersList';
import { GeneratingAnimation } from '@/components/GeneratingAnimation';
import { FileText, Plus, Trash2, Brain, Target, Eye, CheckCircle } from 'lucide-react';
import { generateQuestions, type ApiProvider } from '@/lib/ai';
import { formatPaperContent, downloadPaperAsPDF, type QuestionPaper } from '@/lib/paper';
import { getUserSubjects, generatePromptFromSubjectUnits, type Subject } from '@/lib/subject-manager';

type ToastReturnType = {
  id: string;
  dismiss: () => void;
  update: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => void;
};

interface Part {
  name: string;
  marks: number;
  questions: number;
  marksPerQuestion: number;
  choicesEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Using Subject interface from subject-manager

interface QuestionPaperConfigProps {
  papers: QuestionPaper[];
  onNewPaperGenerated: (newPaper: QuestionPaper) => void;
}

export function QuestionPaperConfig({ papers, onNewPaperGenerated }: QuestionPaperConfigProps) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { toast } = useToast();
  const loadingToastRef = useRef<ToastReturnType | null>(null);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [apiProvider, setApiProvider] = useState<ApiProvider>('openrouter'); // OpenRouter with Claude - should work now!
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [parts, setParts] = useState<Part[]>([
    { name: 'Part A', marks: 20, questions: 10, marksPerQuestion: 2, choicesEnabled: false, difficulty: 'easy' },
    { name: 'Part B', marks: 30, questions: 6, marksPerQuestion: 5, choicesEnabled: true, difficulty: 'medium' },
    { name: 'Part C', marks: 50, questions: 4, marksPerQuestion: 12.5, choicesEnabled: true, difficulty: 'hard' },
  ]);
  const [unitWeightage, setUnitWeightage] = useState<{ [unit: string]: number }>({});
  const [selectedTopics, setSelectedTopics] = useState<{ [unitId: string]: string[] }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unitWeightages, setUnitWeightages] = useState<{ [unitId: string]: number }>({});
  const [weightageError, setWeightageError] = useState<string | null>(null);
  const [latestPaper, setLatestPaper] = useState<QuestionPaper | null>(null);
  const [viewingAllPapers, setViewingAllPapers] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Create a sorted version of the units to ensure consistent order
  const sortedUnits = selectedSubject?.units
    ? [...selectedSubject.units].sort((a, b) => a.unit_number - b.unit_number)
    : [];

  const addPart = () => {
    const newPartNumber = parts.length + 1;
    setParts([...parts, {
      name: `Part ${String.fromCharCode(64 + newPartNumber)}`,
      marks: 10,
      questions: 5,
      marksPerQuestion: 2,
      choicesEnabled: false,
      difficulty: 'medium'
    }]);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, i) => i !== index));
    }
  };

  const updatePart = (index: number, field: keyof Part, value: any) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    
    if (field === 'marks' || field === 'questions') {
      const marks = field === 'marks' ? value : updatedParts[index].marks;
      const questions = field === 'questions' ? value : updatedParts[index].questions;
      if (questions > 0) {
        updatedParts[index].marksPerQuestion = marks / questions;
      }
    }
    
    setParts(updatedParts);
  };

  const handleSubjectChange = (subjectId: string) => {
  setSelectedSubjectId(subjectId);
  const subject = subjects.find(s => s.id === subjectId);
  if (subject) {
    // Auto-populate total marks from subject setup
    setTotalMarks(subject.maximum_marks);
    
    const units = subject.units;
    const equalWeight = Math.round(100 / units.length);
    const weights: { [unit: string]: number } = {};
    units.forEach((unitObj, index) => {
      const unitName = unitObj.unit_name;
      weights[unitName] = index === units.length - 1 
        ? 100 - (equalWeight * (units.length - 1)) 
        : equalWeight;
    });
    setUnitWeightage(weights);
    setSelectedUnits(subject.units.map(unit => unit.id));
  }
};

  const handleTopicSelection = (unitId: string, topic: string) => {
    setSelectedTopics(prev => {
      const currentTopics = prev[unitId] || [];
      const newTopics = currentTopics.includes(topic)
        ? currentTopics.filter(t => t !== topic)
        : [...currentTopics, topic];
      return { ...prev, [unitId]: newTopics };
    });
};

  const updateUnitWeightage = (unit: string, weight: number) => {
    setUnitWeightage(prev => ({ ...prev, [unit]: weight }));
  };

  const handleUnitSelection = (unitId: string) => {
    setSelectedUnits(prev =>
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const calculateTotalWeightage = (weights: { [key: string]: number }) => {
    // Only calculate for selected units to avoid counting placeholder units
    const selectedWeights = selectedUnits.map(unitId => Number(weights[unitId]) || 0);
    const total = selectedWeights.reduce((sum, weight) => sum + weight, 0);
    console.log(`Selected units: ${selectedUnits.length}, Weights: [${selectedWeights.join(', ')}], Total: ${total}`);
    return total;
  };

  const handleWeightageChange = (unitId: string, weight: number) => {
    const newWeightages = { ...unitWeightages, [unitId]: weight };
    const total = calculateTotalWeightage(newWeightages);
    
    // Update weightages
    setUnitWeightages(newWeightages);
    
    // Validate total weightage
    if (total > 100) {
      setWeightageError(`Total weightage cannot exceed 100% (currently ${total}%)`);
    } else if (total < 100 && Object.keys(newWeightages).length > 0) {
      setWeightageError(`Total weightage must equal 100% (currently ${total}%)`);
    } else {
      setWeightageError(null);
    }
  };

  const getTotalQuestions = () => {
    // Calculate total from all parts
    // If choices enabled, we need to generate more questions
    return parts.reduce((sum, part) => {
      const requiredQuestions = part.questions;
      const actualQuestions = part.choicesEnabled ? Math.ceil(requiredQuestions * 1.5) : requiredQuestions;
      return sum + actualQuestions;
    }, 0);
  };

  const getRequiredQuestions = () => {
    // Calculate how many questions student must answer (for display)
    return parts.reduce((sum, part) => sum + part.questions, 0);
  };

  const validateConfiguration = () => {
    if (!selectedSubjectId) {
      toast({
        title: 'Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return false;
    }

    if (selectedUnits.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one unit',
        variant: 'destructive',
      });
      return false;
    }

    const totalWeight = selectedUnits.reduce((sum, unitId) => sum + (Number(unitWeightages[unitId]) || 0), 0);
    if (totalWeight !== 100) {
      toast({
        title: 'Error',
        description: `Total weightage must equal 100% (currently ${totalWeight}%)`,
        variant: 'destructive',
      });
      setWeightageError(`Total weightage must equal 100% (currently ${totalWeight}%)`);
      return false;
    }

    setWeightageError(null);

    const calculatedTotal = parts.reduce((sum, part) => sum + part.marks, 0);
    if (calculatedTotal !== totalMarks) {
      toast({
        title: "Marks Mismatch",
        description: `Total marks of parts (${calculatedTotal}) doesn't match target total marks (${totalMarks}).`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateConfiguration()) return;

    setIsGenerating(true);
    setError(null);
    
    // Clear any existing loading toast
    if (loadingToastRef.current) {
      loadingToastRef.current.dismiss();
      loadingToastRef.current = null;
    }
    
    try {
      // Show loading toast
      const providerNames = {
        nvidia: 'NVIDIA AI (Llama 3.1 405B)',
        gemini: 'Google Gemini 1.5 Pro',
        openrouter: 'OpenRouter (Claude 3 Haiku)',
        local: 'Local Generation'
      };
      
      const toastResult = toast({
        title: "Generating Questions",
        description: `Creating your question paper from uploaded PDF content using ${providerNames[apiProvider]}...`,
      }) as unknown as ToastReturnType;
      
      if (toastResult) {
        loadingToastRef.current = toastResult;
      }

      // Find the selected subject
      console.log('🔍 DEBUG: Finding selected subject with ID:', selectedSubjectId);
      const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
      if (!selectedSubject) {
        console.error('❌ DEBUG: Subject not found!');
        throw new Error('Selected subject not found');
      }
      console.log('✅ DEBUG: Subject found:', selectedSubject.subject_name);

      if (!selectedSubject.units || selectedSubject.units.length === 0) {
        console.error('❌ DEBUG: No units found in subject');
        throw new Error('Selected subject has no units. Please ensure the subject was created with PDF content.');
      }
      console.log(`✅ DEBUG: Found ${selectedSubject.units.length} units in subject`);

      // Debug each unit
      selectedSubject.units.forEach((unit, idx) => {
        console.log(`📄 DEBUG Unit ${idx + 1}: ${unit.unit_name}`);
        console.log(`   - ID: ${unit.id}`);
        console.log(`   - Selected: ${selectedUnits.includes(unit.id)}`);
        console.log(`   - Has extracted_content: ${!!unit.extracted_content}`);
        if (unit.extracted_content) {
          const content = unit.extracted_content as any;
          console.log(`   - Content text length: ${content.text?.length || 0}`);
          console.log(`   - Content preview: ${content.text?.substring(0, 100) || 'NO TEXT'}...`);
        }
      });

      // Check if selected units have extracted content
      const selectedUnitsWithContent = selectedSubject.units.filter(unit => 
        selectedUnits.includes(unit.id) && unit.extracted_content?.text
      );

      console.log(`🔍 DEBUG: Selected units: ${selectedUnits.length}`);
      console.log(`🔍 DEBUG: Selected units with content: ${selectedUnitsWithContent.length}`);

      if (selectedUnitsWithContent.length === 0) {
        console.error('❌ DEBUG: No units with extracted PDF content!');
        console.error('💡 DEBUG: Please ensure PDFs were uploaded during subject creation');
        throw new Error('No units with extracted content found. Please ensure PDFs were uploaded and processed correctly.');
      }
      
      console.log('✅ DEBUG: All validation passed, proceeding with question generation...');

      // Use extracted content from database (avoids SSL certificate issues)
      const questionConfig = {
        totalQuestions: getTotalQuestions(),
        totalMarks,
        difficulty,
        parts
      };

      console.log('📄 DEBUG: Using extracted PDF content from database...');
      
      // Get extracted content from selected units
      const relevantUnits = selectedSubject.units.filter(unit => selectedUnits.includes(unit.id));
      
      let combinedContent = '';
      
      // Process each unit and force extraction if needed
      for (const unit of relevantUnits) {
        const weightage = unitWeightages[unit.id] || 0;
        
        console.log(`🔍 Processing unit: ${unit.unit_name}`);
        console.log(`   - Has extracted_content: ${!!unit.extracted_content}`);
        console.log(`   - Content length: ${unit.extracted_content?.text?.length || 0}`);
        console.log(`   - File URL: ${unit.file_url || 'NONE'}`);
        
        if (unit.extracted_content?.text && unit.extracted_content.text.length > 100) {
          // Content exists and is good
          combinedContent += `\n\n=== ${unit.unit_name} (${weightage}% weightage) ===\n${unit.extracted_content.text}`;
          console.log(`✅ Using existing content from ${unit.unit_name}: ${unit.extracted_content.text.length} chars`);
          console.log(`📖 Content preview: ${unit.extracted_content.text.substring(0, 150)}...`);
        } else {
          // No content or too short - try to extract now
          console.warn(`⚠️ No extracted content for ${unit.unit_name} - attempting extraction now...`);
          
          if (unit.file_url) {
            try {
              console.log(`📥 Downloading PDF from: ${unit.file_url}`);
              
              // Download PDF from Supabase
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('syllabus-files')
                .download(unit.file_url);
              
              if (downloadError) {
                console.error(`❌ Download error for ${unit.unit_name}:`, downloadError);
                throw downloadError;
              }
              
              if (!fileData) {
                console.error(`❌ No file data received for ${unit.unit_name}`);
                throw new Error('No file data received');
              }
              
              console.log(`✅ Downloaded PDF for ${unit.unit_name} (${fileData.size} bytes)`);
              
              // Extract text from PDF
              const pdfFile = new File([fileData], `${unit.unit_name}.pdf`, { type: 'application/pdf' });
              const { extractRealPDFContent } = await import('@/lib/pdf-extractor-real');
              const extraction = await extractRealPDFContent(pdfFile);
              
              console.log(`📄 Extraction result for ${unit.unit_name}:`, {
                success: extraction.success,
                textLength: extraction.text?.length || 0,
                numPages: extraction.numPages,
                error: extraction.error
              });
              
              if (extraction.success && extraction.text.length > 100) {
                combinedContent += `\n\n=== ${unit.unit_name} (${weightage}% weightage) ===\n${extraction.text}`;
                console.log(`✅ EXTRACTED NOW: ${extraction.text.length} chars from ${unit.unit_name}`);
                console.log(`📖 Content preview: ${extraction.text.substring(0, 150)}...`);
                
                // Save to database for future use
                const { error: updateError } = await supabase
                  .from('units')
                  .update({
                    extracted_content: {
                      text: extraction.text,
                      numPages: extraction.numPages
                    }
                  })
                  .eq('id', unit.id);
                
                if (updateError) {
                  console.error(`⚠️ Failed to save extracted content to database:`, updateError);
                } else {
                  console.log(`💾 Saved extracted content to database for ${unit.unit_name}`);
                }
              } else {
                console.error(`❌ Extraction failed for ${unit.unit_name}:`, extraction.error || 'Text too short');
              }
            } catch (error) {
              console.error(`❌ Failed to extract PDF for ${unit.unit_name}:`, error);
            }
          } else {
            console.error(`❌ No file URL for ${unit.unit_name}`);
          }
        }
      }

      if (combinedContent.length < 100) {
        console.error('❌ CRITICAL: Combined content is too short!');
        console.error(`   - Content length: ${combinedContent.length}`);
        console.error(`   - Selected units: ${selectedUnits.length}`);
        console.error(`   - Relevant units: ${relevantUnits.length}`);
        throw new Error('No PDF content found for selected units. Please ensure PDFs were uploaded during subject creation. Try re-uploading your PDFs.');
      }

      console.log('═══════════════════════════════════════════════');
      console.log('📚 GENERATING PROPER PROMPT WITH PARTS CONFIG');
      console.log('═══════════════════════════════════════════════');
      console.log(`📊 Total questions needed: ${getTotalQuestions()}`);
      console.log(`📋 Parts configuration:`, parts);
      console.log(`🤖 API provider: ${apiProvider}`);
      console.log('═══════════════════════════════════════════════');

      // Use the proper prompt generator from subject-manager
      const { generatePromptFromSubjectUnits } = await import('@/lib/subject-manager');
      const prompt = await generatePromptFromSubjectUnits(
        selectedSubject,
        selectedUnits,
        unitWeightages,
        questionConfig
      );

      console.log('🚀 Generated proper prompt with parts configuration');
      console.log(`📝 Prompt length: ${prompt.length} characters`);
      console.log(`📖 Prompt preview (first 800 chars):`);
      console.log(prompt.substring(0, 800));
      console.log('═══════════════════════════════════════════════');

      const { generateQuestions } = await import('@/lib/ai');
      const generatedQuestions = await generateQuestions(apiProvider, prompt);
      
      console.log('✅ DEBUG: Questions generated successfully');
      console.log('📋 DEBUG: Generated questions length:', generatedQuestions.length);
      console.log('📖 DEBUG: Generated questions preview (first 1000 chars):');
      console.log(generatedQuestions.substring(0, 1000));
      const subjectName = selectedSubject.subject_name;

      if (!generatedQuestions || generatedQuestions.trim() === '') {
        console.error('❌ AI returned empty response');
        throw new Error("The AI failed to generate questions. Please try a different provider or adjust your settings.");
      }
      
      // Format in Kalasalingam University official format
      const paperContent = formatPaperContent({
        subject: subjectName,
        totalMarks,
        generatedQuestions,
        courseCode: selectedSubject.course_code || '21ECE1400',
        degree: 'B. Tech',
        duration: '90 Minutes',
        examType: 'SESSIONAL EXAMINATION – II',
        examMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
        dateSession: new Date().toLocaleDateString('en-GB'),
        useKalasalingamFormat: true, // Enable Kalasalingam format
        parts: parts, // Pass user-configured parts
        courseOutcomes: [
          { co: 'CO2', description: 'Analyze the optimal usage of concepts from the study material' },
          { co: 'CO3', description: 'Demonstrate the usage of principles for specific requirements' },
          { co: 'CO4', description: 'Analyze the methods and techniques for different applications' }
        ]
      });

      // Create the final paper object
      const newPaper: QuestionPaper = {
        id: Date.now(),
        subjectName: subjectName,
        generatedAt: new Date(),
        generatedBy: user?.email || 'AI System',
        config: {
    totalMarks,
    totalQuestions: getTotalQuestions(),
          difficulty,
    parts,
        },
        questions: [{
          partName: 'Complete Paper',
          question: generatedQuestions,
          marks: totalMarks,
        }],
        content: paperContent,
      };

      // Save to database
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save your question paper.",
          variant: "destructive",
        });
        return;
      }

      if (!selectedSubjectId) {
        toast({
          title: "Subject Required",
          description: "Please select a subject to continue.",
          variant: "destructive",
        });
        return;
      }

      const { error: dbError } = await supabase
        .from('question_papers')
        .insert({
          user_id: user?.id,
          subject_id: selectedSubjectId,
          paper_title: `${selectedSubject.subject_name} Question Paper`,
          exam_category: 'Regular',
          total_marks: totalMarks,
          total_questions: getTotalQuestions(),
          marks_per_question: Math.round(totalMarks / getTotalQuestions()),
          questions_per_section: parts.length,
          generated_questions: {
            content: paperContent,
            questions: newPaper.questions,
            config: newPaper.config
          },
          paper_config: newPaper.config,
        });

      console.log('Saving paper to database:', {
        user_id: user?.id,
        subject_id: selectedSubjectId,
        paper_title: `${selectedSubject.subject_name} Question Paper`,
        total_marks: totalMarks,
        total_questions: getTotalQuestions(),
      });

      if (dbError) {
        console.error('Database save error:', dbError);
        toast({
          title: "Save Failed",
          description: "Couldn't save to database. Your paper was generated but not saved.",
          variant: "destructive",
        });
      } else {
        // Dismiss loading toast if it exists
        if (loadingToastRef.current) {
          loadingToastRef.current.dismiss();
        }
        
        // Show success toast
        toast({
          title: "Paper Ready!",
          description: "Your question paper has been generated successfully.",
        });

        // Update state
        onNewPaperGenerated(newPaper);
        setLatestPaper(newPaper);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Dismiss loading toast if it exists
      if (loadingToastRef.current) {
        loadingToastRef.current.dismiss();
        loadingToastRef.current = null;
      }
      
      // Show error toast
      toast({
        title: 'Generation Failed',
        description: `Couldn't generate questions: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPaperAsPDF = (paper: QuestionPaper) => {
    try {
      // Ensure we have content to download
      if (!paper || !paper.content) {
        toast({
          title: "Download Failed",
          description: "Paper content is missing",
          variant: "destructive",
        });
        return;
      }

      // Format the content nicely
      const formattedContent = `# ${paper.subjectName} Question Paper
Generated on: ${paper.generatedAt.toLocaleDateString()}

${paper.content}`;

      // Create and trigger download
      const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paper.subjectName.replace(/\s+/g, '_')}_Question_Paper.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your question paper is being downloaded",
        variant: "default",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the question paper",
        variant: "destructive",
      });
    }
  };



  // Add a download button to the recent papers card
  const RecentPapersCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent AI Papers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {papers.slice(-3).reverse().map((paper) => (
            <div key={paper.id} className="p-2 border rounded text-sm">
              <div className="font-medium flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{paper.subjectName}</span>
                  <Brain className="w-3 h-3 text-blue-500" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadPaperAsPDF(paper)}
                >
                  <FileText className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                {paper.generatedAt.toLocaleDateString()} • {paper.questions.length} AI questions
              </div>
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3"
          onClick={() => {
            setShowPreview(true);
            setViewingAllPapers(false);
          }}
          disabled={papers.length === 0}
        >
          View Latest AI Paper
        </Button>
      </CardContent>
    </Card>
  );

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const userSubjects = await getUserSubjects(user.id);
        setSubjects(userSubjects);
        
        if (userSubjects.length === 0) {
          setError('No subjects found. Please create a subject first in the Subject Setup section.');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError('Failed to load subjects. Please refresh the page to try again.');
        toast({
          title: 'Error',
          description: `Failed to load subjects: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [user, toast]);

  // Only show loading screen if we have no subjects data AND we're actually loading
  if (isLoading && subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading subject data...</p>
      </div>
    );
  }

  if (isGenerating) {
    return <GeneratingAnimation isGenerating={isGenerating} />;
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md border border-destructive/30">
        <p className="text-destructive">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show papers list if viewing all papers
  if (showPreview && viewingAllPapers) {
    return (
      <PapersList 
        papers={papers} 
        onBack={() => {
          setShowPreview(false);
          setViewingAllPapers(false);
        }}
      />
    );
  }
  
  // Show single paper preview if we have a specific paper to preview
  if (showPreview && latestPaper && !viewingAllPapers) {
    return (
      <QuestionPaperPreview 
        paper={latestPaper} 
        onBack={() => {
          setShowPreview(false);
          setLatestPaper(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Generating Animation */}
      <GeneratingAnimation isGenerating={isGenerating} />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content-Focused Question Generation</h2>
          <p className="text-muted-foreground">
            Generate questions strictly from your uploaded content - no generic questions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowPreview(true);
              setViewingAllPapers(true);
            }}
            disabled={papers.length === 0}
            className="flex items-center gap-2 hover:bg-green-50"
          >
            <Eye className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Content-Only</span>
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">
              {papers.length} papers generated
            </span>
          </div>
        </div>
      </div>

      {/* Always show the main configuration section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Content-Based Configuration
              </CardTitle>
              <CardDescription>
                Questions will be generated only from your uploaded content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject">Select Subject with PDF Content</Label>
                <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject created in Subject Setup" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center space-x-2">
                          <span>
                            {subject.subject_name}
                            {subject.course_code ? ` (${subject.course_code})` : ''}
                          </span>
                          {subject.units && subject.units.some(u => u.extracted_content?.text) && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSubject && selectedSubject.units && selectedSubject.units.some(u => u.extracted_content?.text) && (
                  <div className="text-xs text-green-600 flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>PDF content available for question generation</span>
                  </div>
                )}
              </div>

              {/* Common Configuration */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks {selectedSubject && <span className="text-xs text-green-600">(from subject setup)</span>}</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    min="1"
                    max="200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">AI Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy - Basic concepts</SelectItem>
                      <SelectItem value="medium">Medium - Detailed analysis</SelectItem>
                      <SelectItem value="hard">Hard - Critical thinking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Total AI Questions</Label>
                  <Select value={String(totalQuestions)} onValueChange={(value) => setTotalQuestions(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                      <SelectItem value="20">20 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiProvider">AI Provider</Label>
                  <Select value={apiProvider} onValueChange={(value: ApiProvider) => setApiProvider(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">🤖 OpenRouter - Claude + Free Models (RECOMMENDED)</SelectItem>
                      <SelectItem value="anthropic">⭐ Anthropic Claude Direct (CORS Issues)</SelectItem>
                      <SelectItem value="local">💻 Local Generation (Fallback)</SelectItem>
                      <SelectItem value="gemini">🧠 Google Gemini (Backup)</SelectItem>
                      <SelectItem value="nvidia">🚀 NVIDIA (CORS Issues)</SelectItem>
                    </SelectContent>
                  </Select>
                  {apiProvider === 'anthropic' && (
                    <p className="text-xs text-red-600">
                      ⚠️ Anthropic Direct API has CORS issues from browser. Use OpenRouter instead (it proxies Claude for you)!
                    </p>
                  )}
                  {apiProvider === 'openrouter' && (
                    <p className="text-xs text-blue-600">
                      ℹ️ Will try FREE models first, then Claude. Add payment method at openrouter.ai/settings/billing to use your $100 credits with Claude.
                    </p>
                  )}
                  {apiProvider === 'nvidia' && (
                    <p className="text-xs text-orange-600">
                      ⚠️ NVIDIA API has CORS restrictions and cannot be called from browser. Will automatically fall back to local generation.
                    </p>
                  )}
                  {apiProvider === 'gemini' && (
                    <p className="text-xs text-orange-600">
                      ⚠️ Gemini has model availability issues. Will fall back to local generation if it fails.
                    </p>
                  )}
                  {apiProvider === 'local' && (
                    <p className="text-xs text-green-600">
                      ✅ Local generation extracts actual terms from your PDF and generates relevant questions. For AI-powered generation, try OpenRouter.
                    </p>
                  )}
                </div>
              </div>

              {/* Content info section */}
              {selectedSubject && selectedSubject.units && selectedSubject.units.length > 0 ? (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Available Content for Question Generation:
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                    {selectedSubject.units.map((unit) => (
                      <div key={unit.id} className="space-y-1">
                        <div className="font-medium">📚 {unit.unit_name}:</div>
                        <div className="ml-2 space-y-1 text-xs">
                          {unit.extracted_content?.text ? (
                            <>
                              <div>• {unit.extracted_content.numPages} pages processed</div>
                              <div>• {unit.extracted_content.text.length.toLocaleString()} characters extracted</div>
                              {unit.extracted_content.title && (
                                <div>• Title: {unit.extracted_content.title}</div>
                              )}
                              <div className="text-green-600">✅ Ready for question generation</div>
                            </>
                          ) : (
                            <div className="text-orange-600">⚠️ No PDF content - upload required</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="text-xs text-green-700">
                      <strong>Subject:</strong> {selectedSubject.subject_name} ({selectedSubject.course_code})
                      <br />
                      <strong>Total Units:</strong> {selectedSubject.units.length}
                      <br />
                      <strong>Units with Content:</strong> {selectedSubject.units.filter(u => u.extracted_content?.text).length}
                    </div>
                  </div>
                </div>
              ) : selectedSubject ? (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    No Content Available
                  </h4>
                  <div className="text-sm text-orange-800">
                    <p>This subject has no units with extracted content.</p>
                    <p className="mt-1">Please go to Subject Setup and create a subject with PDF uploads for each unit.</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Question Paper Parts</CardTitle>
                <CardDescription>
                  Configure different sections with AI-powered question generation
                </CardDescription>
              </div>
              <Button onClick={addPart} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {parts.map((part, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={part.name}
                      onChange={(e) => updatePart(index, 'name', e.target.value)}
                      className="font-medium max-w-xs"
                    />
                    {parts.length > 1 && (
                      <Button
                        onClick={() => removePart(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Total Marks</Label>
                      <Input
                        type="number"
                        value={part.marks}
                        onChange={(e) => updatePart(index, 'marks', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>AI Questions</Label>
                      <Input
                        type="number"
                        value={part.questions}
                        onChange={(e) => updatePart(index, 'questions', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Marks/Question</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {part.marksPerQuestion.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <select
                        value={part.difficulty}
                        onChange={(e) => updatePart(index, 'difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Enable Choices</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          checked={part.choicesEnabled}
                          onCheckedChange={(checked) => updatePart(index, 'choicesEnabled', checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {part.choicesEnabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Always show Unit & Weightage Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Unit & Weightage Selection</span>
                {weightageError && (
                  <span className="text-sm font-normal text-destructive">
                    {weightageError}
                  </span>
                )}
              </CardTitle>
              <CardDescription>Select up to 5 units and specify their weightage for question generation. Total weightage must equal 100%.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSubject ? (
                Array.from({ length: 5 }).map((_, index) => {
                  const unit = sortedUnits[index];
                  const identifier = unit ? unit.id : `placeholder-${index + 1}`;
                  const unitName = unit ? unit.unit_name : `Unit ${index + 1}`;

                  return (
                    <div key={identifier} className="flex items-center space-x-4">
                      <Button
                        variant={selectedUnits.includes(identifier) ? 'default' : 'outline'}
                        onClick={() => handleUnitSelection(identifier)}
                        className="flex-1 justify-start"
                      >
                        {unitName}
                      </Button>
                      <div className="relative w-32">
                        <Input
                          type="number"
                          placeholder="Weightage %"
                          value={unitWeightages[identifier] || ''}
                          onChange={(e) => handleWeightageChange(identifier, Number(e.target.value))}
                          className={`w-full ${!selectedUnits.includes(identifier) ? 'opacity-50' : ''} ${
                            weightageError ? 'border-destructive' : ''
                          }`}
                          min={0}
                          max={100}
                          disabled={!selectedUnits.includes(identifier)}
                        />
                        {selectedUnits.includes(identifier) && (
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select a subject first to configure unit weightages.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Content-Only Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subject:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedSubject?.subject_name || 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Marks:</span>
                  <span className="text-sm text-muted-foreground">{totalMarks}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">AI Questions:</span>
                  <span className="text-sm text-muted-foreground">
                    {getTotalQuestions()} total ({getRequiredQuestions()} required)
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">AI Difficulty:</span>
                  <span className="text-sm text-muted-foreground capitalize">{difficulty}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Parts:</span>
                  <span className="text-sm text-muted-foreground">{parts.length}</span>
                </div>
              </div>

              {/* Always show content sources section */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-green-800">Content Sources:</h4>
                {selectedSubject?.units?.length > 0 ? (
                  <div className="space-y-1">
                    {sortedUnits.map((unit) => (
                      <div key={unit.id} className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {unit.unit_name}: Content extracted and ready
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    <p>No units available. Please select a subject with uploaded content.</p>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Question Generation</CardTitle>
                  <CardDescription>Using intelligent content-aware analysis of your uploaded PDFs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Local AI Analysis</p>
                      <p className="text-sm text-green-600">Generates questions based on your PDF content without external APIs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced validation for Generate button */}
              {(() => {
                const totalWeightage = selectedUnits.reduce((sum, unitId) => sum + (Number(unitWeightages[unitId]) || 0), 0);
                const hasSelectedUnits = selectedUnits.length > 0;
                const hasValidWeightage = totalWeightage === 100;
                const isValidConfiguration = selectedSubjectId && hasSelectedUnits && hasValidWeightage;
                
                return (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {isValidConfiguration ? (
                      <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Generate from Content
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button 
                          disabled={true}
                          className="w-full opacity-50 cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Generate from Content
                        </Button>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {!selectedSubjectId && (
                            <p className="text-center text-red-600">• Please select a subject</p>
                          )}
                          {selectedSubjectId && !hasSelectedUnits && (
                            <p className="text-center text-red-600">• Please select at least one unit</p>
                          )}
                          {selectedSubjectId && hasSelectedUnits && !hasValidWeightage && (
                            <p className="text-center text-red-600">
                              • Unit weightage must total 100% (currently {totalWeightage}%)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Always show Recent Papers section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Papers</CardTitle>
            </CardHeader>
            <CardContent>
              {papers.length > 0 ? (
                <div className="space-y-2">
                  {papers.slice(-3).reverse().map((paper) => (
                    <div key={paper.id} className="p-2 border rounded text-sm">
                      <div className="font-medium flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{paper.subjectName}</span>
                          <Brain className="w-3 h-3 text-blue-500" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadPaperAsPDF(paper)}
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {paper.generatedAt.toLocaleDateString()} • {paper.questions.length} AI questions
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => {
                      // Show all papers list instead of just the latest one
                      setShowPreview(true);
                      setViewingAllPapers(true);
                      setLatestPaper(null); // Clear any single paper selection
                    }}
                  >
                    View Latest AI Paper
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No papers generated yet.</p>
                  <p className="text-xs mt-1">Generate your first question paper to see it here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
