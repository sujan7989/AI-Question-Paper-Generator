import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SubjectSetup } from '@/components/SubjectSetup';
import { QuestionPaperConfig } from '@/components/QuestionPaperConfig';
import { UserManagement } from '@/components/UserManagement';
import { Analytics } from '@/components/Analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen,
  FileText,
  Users,
  LogOut,
  PlusCircle,
  CheckCircle,
  GraduationCap,
  Book,
  Download,
  Home,
  FilePlus,
  BarChart,
  Trash2,
  Eye,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { downloadPaperAsPDF } from "@/lib/paper";
import { QuestionPaperPreview } from "@/components/QuestionPaperPreview";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

type DashboardView = 'overview' | 'subjects' | 'configure' | 'users' | 'analytics';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const { user, profile, signOut } = useAuth();
  const [showSubjectsDialog, setShowSubjectsDialog] = useState(false);
  const [showPapersDialog, setShowPapersDialog] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<any | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<any[]>([]);

  // Fetch users for admin dashboard
  useQuery({
    queryKey: ['users', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('*');
      if (error) throw error;
      setUsers(data || []);
      return data || [];
    },
    enabled: profile?.role === 'admin',
  });

  // Optimized data fetching with React Query
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: questionPapers = [] } = useQuery({
    queryKey: ['papers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_papers')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map(paper => {
        const subject = subjects.find(s => s.id === paper.subject_id);
        return {
          ...paper,
          id: paper.id,
          subjectName: subject?.subject_name || 'Loading...', // Ensure subjectName is always available
          generatedAt: new Date(paper.created_at),
          generatedBy: paper.generated_by || 'AI System',
          config: paper.paper_config || paper.generated_questions?.config || {
            totalMarks: paper.total_marks || 50,
            totalQuestions: paper.total_questions || 25,
            difficulty: 'medium',
            parts: []
          },
          questions: Array.isArray(paper.generated_questions) // Ensure questions is an array
            ? paper.generated_questions
            : (paper.generated_questions?.questions || []),
          content: paper.generated_questions?.content || '' // Ensure content is a string
        };
      }) || [];
    },
    enabled: !!user?.id && subjects.length > 0
  });

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    setSubjectToDelete({ id: subjectId, name: subjectName });
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete || !user?.id) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      await queryClient.invalidateQueries({ queryKey: ['papers'] });
      
      setSubjectToDelete(null);
      toast({
        title: "Success",
        description: `Subject "${subjectToDelete.name}" deleted successfully.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete subject: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeletePaper = async (paperId: string, paperTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${paperTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('question_papers')
        .delete()
        .eq('id', paperId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Remove from selected papers if it was selected
      setSelectedPapers(prev => prev.filter(id => id !== paperId));

      // Invalidate and refetch papers query
      await queryClient.invalidateQueries({ queryKey: ['papers'] });
      
      toast({
        title: "Success",
        description: `Paper "${paperTitle}" deleted successfully.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete paper: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleToggleSelect = (paperId: number) => {
    setSelectedPapers(prev => 
      prev.includes(paperId) 
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPapers.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedPapers.length} selected paper(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('question_papers')
        .delete()
        .in('id', selectedPapers)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Clear selection
      setSelectedPapers([]);

      // Invalidate and refetch papers query
      await queryClient.invalidateQueries({ queryKey: ['papers'] });
      
      toast({
        title: "Success",
        description: `${selectedPapers.length} paper(s) deleted successfully.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete papers: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleToggleSelectSubject = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleBulkDeleteSubjects = async () => {
    if (selectedSubjects.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedSubjects.length} selected subject(s)? This will also delete all associated units and question papers. This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .in('id', selectedSubjects)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Clear selection
      setSelectedSubjects([]);

      // Invalidate and refetch subjects query
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      
      toast({
        title: "Success",
        description: `${selectedSubjects.length} subject(s) deleted successfully.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete subjects: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (paper: any) => {
    try {
      await downloadPaperAsPDF(paper);
      toast({
        title: "Download Initiated",
        description: `Downloading ${paper.subjectName} paper.`
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: `Could not download paper: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleNewPaperGenerated = () => {
    queryClient.invalidateQueries({ queryKey: ['papers'] });
    toast({
      title: "Paper Generated",
      description: "A new question paper has been successfully generated."
    });
  };
  
  const navigationItems = [
    { name: 'Dashboard', icon: Home, view: 'overview' },
    { name: 'Subject Setup', icon: BookOpen, view: 'subjects' },
    { name: 'Generate Papers', icon: FilePlus, view: 'configure' },
    { name: 'Analytics', icon: BarChart, view: 'analytics' },
  ];
  
  if (profile?.role === 'admin') {
    navigationItems.push({ name: 'User Management', icon: Users, view: 'users' });
  }

  const renderContent = () => {
    // Show preview if a paper is selected
    if (previewPaper) {
      return (
        <QuestionPaperPreview 
          paper={previewPaper} 
          onBack={() => setPreviewPaper(null)}
        />
      );
    }

    switch (currentView) {
      case 'subjects':
        return <SubjectSetup onSubjectCreated={() => setCurrentView('configure')} />; // Corrected prop name
      case 'configure':
        return <QuestionPaperConfig 
                  papers={questionPapers} 
                  onNewPaperGenerated={handleNewPaperGenerated} 
                />;
      case 'users':
        return profile?.role === 'admin' ? <UserManagement /> : null;
      case 'analytics':
        return <Analytics />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {profile?.first_name} {profile?.last_name}</h2>
                <p className="text-muted-foreground">
                  AI-powered question paper generation system
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={profile?.role === 'admin' ? 'destructive' : 'secondary'}>
                  {profile?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </Badge>
                {profile?.subject_handled && (
                  <Badge variant="outline">{profile.subject_handled}</Badge>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowSubjectsDialog(true)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjects.length}</div>
                  <p className="text-xs text-muted-foreground">Click to view all subjects</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowPapersDialog(true)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Papers Generated</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{questionPapers.length}</div>
                  <p className="text-xs text-muted-foreground">Click to view all papers</p>
                </CardContent>
              </Card>

              {profile?.role === 'admin' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active users in system
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98%</div>
                  <p className="text-xs text-muted-foreground">
                    AI generation accuracy
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Active Subjects Dialog */}
            <Dialog open={showSubjectsDialog} onOpenChange={setShowSubjectsDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Book className="w-5 h-5 mr-2" />
                      Active Subjects
                    </div>
                    {subjects.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allIds = subjects.map(s => s.id);
                            setSelectedSubjects(selectedSubjects.length === allIds.length ? [] : allIds);
                          }}
                        >
                          {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedSubjects.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDeleteSubjects}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedSubjects.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-4 p-4 border rounded-md bg-muted/20">
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <Card key={subject.id} className={`shadow-md hover:shadow-lg transition-shadow ${selectedSubjects.includes(subject.id) ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject.id)}
                                onChange={() => handleToggleSelectSubject(subject.id)}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <CardTitle className="text-lg">{subject.subject_name}</CardTitle>
                                <CardDescription>{subject.subject_description}</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary">{subject.course_code || 'N/A'}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                          <Badge variant="outline">Course Code: {subject.course_code || 'N/A'}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubject(subject.id, subject.subject_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Book className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No subjects added yet</p>
                      <p className="text-sm">Add your first subject to get started</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Generated Papers Dialog */}
            <Dialog open={showPapersDialog} onOpenChange={setShowPapersDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Generated Papers
                    </div>
                    {questionPapers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allIds = questionPapers.map(p => p.id);
                            setSelectedPapers(selectedPapers.length === allIds.length ? [] : allIds);
                          }}
                        >
                          {selectedPapers.length === questionPapers.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedPapers.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedPapers.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-4 p-4 border rounded-md bg-muted/20">
                  {questionPapers.length > 0 ? (
                    questionPapers.map((paper) => (
                      <Card key={paper.id} className={`shadow-md hover:shadow-lg transition-shadow ${selectedPapers.includes(paper.id) ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedPapers.includes(paper.id)}
                                onChange={() => handleToggleSelect(paper.id)}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <CardTitle className="text-lg">{paper.subjectName}</CardTitle>
                                <CardDescription>Generated on {paper.generatedAt.toLocaleDateString()}</CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex justify-end items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreviewPaper(paper);
                              setShowPapersDialog(false);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(paper)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePaper(paper.id, paper.subjectName)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No papers generated yet</p>
                      <p className="text-sm">Generate your first paper to get started</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks to get you started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setCurrentView('subjects')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Add New Subject
                  </Button>
                  <Button 
                    onClick={() => setCurrentView('configure')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Question Paper
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button 
                      onClick={() => setCurrentView('users')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Engine</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PDF Processing</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Question Generation</span>
                    <Badge variant="default">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">QuestionCraft AI</span>
        </div>
        <nav className="flex items-center space-x-4">
          {navigationItems.map(item => (
            <Button
              key={item.name}
              variant={currentView === item.view ? 'default' : 'ghost'}
              onClick={() => setCurrentView(item.view as DashboardView)}
              className="flex items-center gap-2 text-base"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the subject "{subjectToDelete?.name}"? This action cannot be undone and will also delete all associated question papers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSubject}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}