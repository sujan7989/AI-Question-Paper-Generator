import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SubjectSetup } from '@/components/SubjectSetup';
import { QuestionPaperConfig } from '@/components/QuestionPaperConfig';
import { UserManagement } from '@/components/UserManagement';
import { Analytics } from '@/components/Analytics';
import { ProfilePage } from '@/components/ProfilePage';
import { QuestionBank } from '@/components/QuestionBank';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, FileText, Users, LogOut, PlusCircle, CheckCircle,
  GraduationCap, Book, Download, Home, FilePlus, BarChart,
  Trash2, Eye, Search, Menu, X, UserCircle, Database,
  ChevronUp, ChevronDown, Settings,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { downloadPaperAsPDF } from "@/lib/paper";
import { QuestionPaperPreview } from "@/components/QuestionPaperPreview";
import { useToast } from "@/hooks/use-toast";

type DashboardView = 'overview' | 'subjects' | 'configure' | 'users' | 'analytics' | 'profile' | 'bank';

// Confetti burst helper
function launchConfetti() {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-20px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (1.2 + Math.random() * 1.8) + 's';
    el.style.animationDelay = (Math.random() * 0.6) + 's';
    el.style.width = (6 + Math.random() * 8) + 'px';
    el.style.height = (6 + Math.random() * 8) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

// Skeleton card component
function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-28 rounded skeleton-shimmer" />
        <div className="h-4 w-4 rounded skeleton-shimmer" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 rounded skeleton-shimmer mb-2" />
        <div className="h-3 w-32 rounded skeleton-shimmer" />
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [viewKey, setViewKey] = useState(0);
  const { user, profile, signOut } = useAuth();
  const [showSubjectsDialog, setShowSubjectsDialog] = useState(false);
  const [showPapersDialog, setShowPapersDialog] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<any | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [paperSearch, setPaperSearch] = useState('');
  const [paperDateFilter, setPaperDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<any[]>([]);

  // Feature 20: Widget order customization
  const DEFAULT_WIDGET_ORDER = ['subjects', 'papers', 'team', 'avg'];
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dashboard_widget_order') || 'null') || DEFAULT_WIDGET_ORDER; } catch { return DEFAULT_WIDGET_ORDER; }
  });
  const [customizeMode, setCustomizeMode] = useState(false);

  const moveWidget = (idx: number, dir: -1 | 1) => {
    const newOrder = [...widgetOrder];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setWidgetOrder(newOrder);
    localStorage.setItem('dashboard_widget_order', JSON.stringify(newOrder));
  };

  const navigateTo = useCallback((view: DashboardView) => {
    setCurrentView(view);
    setViewKey(k => k + 1);
    setMobileNavOpen(false);
    setPreviewPaper(null);
  }, []);

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

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: questionPapers = [], isLoading: papersLoading } = useQuery({
    queryKey: ['papers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_papers').select('*').eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map(paper => {
        const subject = subjects.find(s => s.id === paper.subject_id);
        return {
          ...paper,
          subjectName: subject?.subject_name || 'Unknown Subject',
          generatedAt: new Date(paper.created_at),
          generatedBy: paper.generated_by || 'AI System',
          config: paper.paper_config || { totalMarks: paper.total_marks || 50, totalQuestions: paper.total_questions || 25, difficulty: 'medium', parts: [] },
          questions: Array.isArray(paper.generated_questions) ? paper.generated_questions : (paper.generated_questions?.questions || []),
          content: paper.generated_questions?.content || ''
        };
      }) || [];
    },
    enabled: !!user?.id && subjects.length > 0
  });

  // Real success rate: papers generated / (subjects * 1) capped at 100
  const successRate = subjects.length > 0
    ? Math.min(100, Math.round((questionPapers.length / Math.max(subjects.length, 1)) * 100))
    : 0;

  const filteredPapers = questionPapers.filter(p => {
    const matchesSearch = p.subjectName.toLowerCase().includes(paperSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (paperDateFilter === 'all') return true;
    const now = new Date();
    const paperDate = new Date(p.generatedAt);
    if (paperDateFilter === 'today') return paperDate.toDateString() === now.toDateString();
    if (paperDateFilter === 'week') return (now.getTime() - paperDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
    if (paperDateFilter === 'month') return (now.getTime() - paperDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
    return true;
  });
  const filteredSubjects = subjects.filter(s =>
    s.subject_name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    (s.course_code || '').toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    setSubjectToDelete({ id: subjectId, name: subjectName });
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete || !user?.id) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subjectToDelete.id).eq('user_id', user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      await queryClient.invalidateQueries({ queryKey: ['papers'] });
      setSubjectToDelete(null);
      toast({ title: "Deleted", description: `"${subjectToDelete.name}" deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePaper = async (paperId: string, paperTitle: string) => {
    if (!confirm(`Delete "${paperTitle}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('question_papers').delete().eq('id', paperId).eq('user_id', user?.id);
      if (error) throw error;
      setSelectedPapers(prev => prev.filter(id => id !== paperId));
      await queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({ title: "Deleted", description: `"${paperTitle}" deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedPapers.length || !confirm(`Delete ${selectedPapers.length} paper(s)?`)) return;
    try {
      const { error } = await supabase.from('question_papers').delete().in('id', selectedPapers).eq('user_id', user?.id);
      if (error) throw error;
      setSelectedPapers([]);
      await queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast({ title: "Deleted", description: `${selectedPapers.length} paper(s) deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDeleteSubjects = async () => {
    if (!selectedSubjects.length || !confirm(`Delete ${selectedSubjects.length} subject(s) and all their papers?`)) return;
    try {
      const { error } = await supabase.from('subjects').delete().in('id', selectedSubjects).eq('user_id', user?.id);
      if (error) throw error;
      setSelectedSubjects([]);
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: "Deleted", description: `${selectedSubjects.length} subject(s) deleted.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDownload = async (paper: any) => {
    try {
      await downloadPaperAsPDF(paper);
      toast({ title: "Download started", description: `Downloading ${paper.subjectName} paper.` });
    } catch (error: any) {
      toast({ title: "Download Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleNewPaperGenerated = () => {
    queryClient.invalidateQueries({ queryKey: ['papers'] });
    if (!confettiFired) {
      launchConfetti();
      setConfettiFired(true);
    } else {
      launchConfetti();
    }
    toast({ title: "Paper Generated 🎉", description: "Your question paper is ready." });
  };

  const navigationItems = [
    { name: 'Dashboard', icon: Home, view: 'overview' },
    { name: 'Subject Setup', icon: BookOpen, view: 'subjects' },
    { name: 'Generate Papers', icon: FilePlus, view: 'configure' },
    { name: 'Question Bank', icon: Database, view: 'bank' },
    { name: 'Analytics', icon: BarChart, view: 'analytics' },
    ...(profile?.role === 'admin' ? [{ name: 'User Management', icon: Users, view: 'users' }] : []),
  ];

  const renderContent = () => {
    if (previewPaper) {
      return (
        <div key="preview" className="view-enter">
          <QuestionPaperPreview paper={previewPaper} onBack={() => setPreviewPaper(null)} />
        </div>
      );
    }
    switch (currentView) {
      case 'subjects':
        return <div key={viewKey} className="view-enter"><SubjectSetup onSubjectCreated={() => navigateTo('configure')} /></div>;
      case 'configure':
        return <div key={viewKey} className="view-enter"><QuestionPaperConfig papers={questionPapers} onNewPaperGenerated={handleNewPaperGenerated} /></div>;
      case 'users':
        return profile?.role === 'admin' ? <div key={viewKey} className="view-enter"><UserManagement /></div> : null;
      case 'analytics':
        return <div key={viewKey} className="view-enter"><Analytics /></div>;
      case 'bank':
        return <div key={viewKey} className="view-enter"><QuestionBank /></div>;
      case 'profile':
        return <div key={viewKey} className="view-enter"><ProfilePage /></div>;
      default:
        return (
          <div key={viewKey} className="view-enter space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Welcome, {profile?.first_name ?? ''} {profile?.last_name ?? ''}
                </h2>
                <p className="text-muted-foreground">AI-powered question paper generation system</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={profile?.role === 'admin' ? 'destructive' : 'secondary'}>
                  {profile?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </Badge>
                {profile?.subject_handled && <Badge variant="outline">{profile.subject_handled}</Badge>}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Feature 20: Customizable widget order */}
              <div className="col-span-full flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setCustomizeMode(m => !m)} className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />{customizeMode ? 'Done Customizing' : 'Customize Order'}
                </Button>
              </div>
              {widgetOrder.map((widgetId, idx) => {
                const moveUp = () => moveWidget(idx, -1);
                const moveDown = () => moveWidget(idx, 1);
                const controls = customizeMode ? (
                  <div className="flex flex-col gap-0.5 ml-1">
                    <button onClick={moveUp} disabled={idx === 0} className="p-0.5 hover:bg-muted rounded disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={moveDown} disabled={idx === widgetOrder.length - 1} className="p-0.5 hover:bg-muted rounded disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                  </div>
                ) : null;

                if (widgetId === 'subjects') return (
                  <div key="subjects" className="flex items-stretch gap-1">
                    {subjectsLoading ? <SkeletonCard /> : (
                      <Card className="flex-1 cursor-pointer hover:bg-accent/50 transition-all duration-200 btn-micro" onClick={() => setShowSubjectsDialog(true)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
                          <Book className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{subjects.length}</div>
                          <p className="text-xs text-muted-foreground">Click to view all subjects</p>
                        </CardContent>
                      </Card>
                    )}
                    {controls}
                  </div>
                );
                if (widgetId === 'papers') return (
                  <div key="papers" className="flex items-stretch gap-1">
                    {papersLoading ? <SkeletonCard /> : (
                      <Card className="flex-1 cursor-pointer hover:bg-accent/50 transition-all duration-200 btn-micro" onClick={() => setShowPapersDialog(true)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Papers Generated</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{questionPapers.length}</div>
                          <p className="text-xs text-muted-foreground">Click to view all papers</p>
                        </CardContent>
                      </Card>
                    )}
                    {controls}
                  </div>
                );
                if (widgetId === 'team') return profile?.role === 'admin' ? (
                  <div key="team" className="flex items-stretch gap-1">
                    <Card className="flex-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Active users in system</p>
                      </CardContent>
                    </Card>
                    {controls}
                  </div>
                ) : null;
                if (widgetId === 'avg') return (
                  <div key="avg" className="flex items-stretch gap-1">
                    <Card className="flex-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Papers per Subject</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {subjects.length > 0 ? (questionPapers.length / subjects.length).toFixed(1) : '0'}
                        </div>
                        <p className="text-xs text-muted-foreground">Average papers per subject</p>
                      </CardContent>
                    </Card>
                    {controls}
                  </div>
                );
                return null;
              })}
            </div>

            {/* Admin Staff Overview — visible only to admin, great for HOD demo */}
            {profile?.role === 'admin' && users.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-4 h-4" />Staff Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users.filter((u: any) => u.role === 'staff').slice(0, 5).map((u: any) => {
                      const staffPapers = questionPapers.filter((p: any) => p.user_id === u.user_id || p.generatedBy === u.email);
                      return (
                        <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(u.first_name?.[0] || '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.subject_handled || u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{staffPapers.length} papers</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${staffPapers.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {staffPapers.length > 0 ? 'Active' : 'No papers'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {users.filter((u: any) => u.role === 'staff').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">No staff members yet</p>
                    )}
                  </div>
                  {users.filter((u: any) => u.role === 'staff').length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">+{users.filter((u: any) => u.role === 'staff').length - 5} more — view in Analytics</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subjects Dialog */}
            <Dialog open={showSubjectsDialog} onOpenChange={setShowSubjectsDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center"><Book className="w-5 h-5 mr-2" />Active Subjects</div>
                    {subjects.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSubjects(selectedSubjects.length === subjects.length ? [] : subjects.map(s => s.id))}>
                          {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedSubjects.length > 0 && (
                          <Button variant="destructive" size="sm" onClick={handleBulkDeleteSubjects}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete ({selectedSubjects.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search subjects..." className="pl-9" value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)} />
                </div>
                <div className="max-h-[55vh] overflow-y-auto space-y-3 p-1">
                  {filteredSubjects.length > 0 ? filteredSubjects.map(subject => (
                    <Card key={subject.id} className={`shadow-sm hover:shadow-md transition-all duration-200 ${selectedSubjects.includes(subject.id) ? 'ring-2 ring-primary' : ''}`}>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedSubjects.includes(subject.id)} onChange={() => setSelectedSubjects(prev => prev.includes(subject.id) ? prev.filter(id => id !== subject.id) : [...prev, subject.id])} className="w-4 h-4 cursor-pointer" />
                            <div>
                              <CardTitle className="text-base">{subject.subject_name}</CardTitle>
                              <CardDescription className="text-xs">{subject.subject_description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{subject.course_code || 'N/A'}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject.id, subject.subject_name)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-5xl mb-3">📚</div>
                      <p className="font-medium">{subjectSearch ? 'No subjects match your search' : 'No subjects added yet'}</p>
                      <p className="text-sm mt-1">{subjectSearch ? 'Try a different search term' : 'Add your first subject to get started'}</p>
                    </div>
                  )}
                </div>
                <DialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Papers Dialog */}
            <Dialog open={showPapersDialog} onOpenChange={setShowPapersDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center"><FileText className="w-5 h-5 mr-2" />Generated Papers</div>
                    {questionPapers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPapers(selectedPapers.length === questionPapers.length ? [] : questionPapers.map(p => p.id))}>
                          {selectedPapers.length === questionPapers.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedPapers.length > 0 && (
                          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete ({selectedPapers.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {/* Search + Date Filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search papers by subject..." className="pl-9" value={paperSearch} onChange={e => setPaperSearch(e.target.value)} />
                  </div>
                  <Select value={paperDateFilter} onValueChange={(v: any) => setPaperDateFilter(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="max-h-[55vh] overflow-y-auto space-y-3 p-1">
                  {filteredPapers.length > 0 ? filteredPapers.map(paper => (
                    <Card key={paper.id} className={`shadow-sm hover:shadow-md transition-all duration-200 ${selectedPapers.includes(paper.id) ? 'ring-2 ring-primary' : ''}`}>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedPapers.includes(paper.id)} onChange={() => setSelectedPapers(prev => prev.includes(paper.id) ? prev.filter(id => id !== paper.id) : [...prev, paper.id])} className="w-4 h-4 cursor-pointer" />
                            <div>
                              <CardTitle className="text-base">{paper.subjectName}</CardTitle>
                              <CardDescription className="text-xs">Generated on {paper.generatedAt.toLocaleDateString()}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setPreviewPaper(paper); setShowPapersDialog(false); }}>
                              <Eye className="w-4 h-4 mr-1" />Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(paper)}>
                              <Download className="w-4 h-4 mr-1" />PDF
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePaper(paper.id, paper.subjectName)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-5xl mb-3">📄</div>
                      <p className="font-medium">{paperSearch ? 'No papers match your search' : 'No papers generated yet'}</p>
                      <p className="text-sm mt-1">{paperSearch ? 'Try a different search term' : 'Generate your first paper to get started'}</p>
                    </div>
                  )}
                </div>
                <DialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Quick Actions + System Status */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><PlusCircle className="w-5 h-5 mr-2" />Quick Actions</CardTitle>
                  <CardDescription>Common tasks to get you started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => navigateTo('subjects')} className="w-full justify-start btn-micro" variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />Add New Subject
                  </Button>
                  <Button onClick={() => navigateTo('configure')} className="w-full justify-start btn-micro" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />Generate Question Paper
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button onClick={() => navigateTo('users')} className="w-full justify-start btn-micro" variant="outline">
                      <Users className="w-4 h-4 mr-2" />Manage Users
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />Recent Papers
                  </CardTitle>
                  <CardDescription>Latest generated papers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {papersLoading ? (
                    <>
                      <div className="h-10 rounded skeleton-shimmer" />
                      <div className="h-10 rounded skeleton-shimmer" />
                      <div className="h-10 rounded skeleton-shimmer" />
                    </>
                  ) : questionPapers.length > 0 ? (
                    questionPapers.slice(0, 3).map(paper => (
                      <div key={paper.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setPreviewPaper(paper)}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{paper.subjectName}</p>
                          <p className="text-xs text-muted-foreground">{paper.generatedAt.toLocaleDateString()}</p>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <div className="text-3xl mb-1">📄</div>
                      <p className="text-xs">No papers yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Your usage at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Subjects</span>
                    <Badge variant="secondary">{subjects.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Papers</span>
                    <Badge variant="secondary">{questionPapers.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Papers / Subject</span>
                    <Badge variant="outline">
                      {subjects.length > 0 ? (questionPapers.length / subjects.length).toFixed(1) : '0'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-sm text-muted-foreground">Last Paper</span>
                    <span className="text-xs text-muted-foreground">
                      {questionPapers.length > 0
                        ? questionPapers[0].generatedAt.toLocaleDateString()
                        : 'None yet'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            {questionPapers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {questionPapers.slice(0, 8).map((paper: any, i: number) => (
                      <div key={paper.id} className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="text-muted-foreground text-xs shrink-0">
                          {new Date(paper.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="truncate">Paper generated for <span className="font-medium">{paper.subjectName}</span></span>
                        <span className="text-xs text-muted-foreground shrink-0">{paper.config?.totalMarks}M</span>
                      </div>
                    ))}
                    {subjects.slice(0, 3).map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-muted-foreground text-xs shrink-0">
                          {new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="truncate">Subject added: <span className="font-medium">{s.subject_name}</span></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 sm:px-6">
        <div className="flex items-center gap-2 shrink-0">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold hidden lg:block">QuestionCraft AI</span>
        </div>

        {/* Desktop nav — scrollable so it never pushes logout off screen */}
        <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0 scrollbar-none">
          {navigationItems.map(item => (
            <Button
              key={item.name}
              variant={currentView === item.view ? 'default' : 'ghost'}
              onClick={() => navigateTo(item.view as DashboardView)}
              className="flex items-center gap-1.5 btn-micro shrink-0 px-2.5"
              size="sm"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block text-xs">{item.name}</span>
            </Button>
          ))}
        </nav>

        {/* Right side — always shrink-0 so it never gets pushed off */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <ThemeToggle />
          {/* Feature 9: Notification Bell */}
          <NotificationBell />
          {/* Role badge */}
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${profile?.role === 'admin' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
            {profile?.role === 'admin' ? '🔑 Admin' : '👤 Staff'}
          </span>
          {/* Profile avatar button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('profile')}
            className="btn-micro hidden sm:flex items-center gap-1.5 shrink-0 px-2"
            title="My Profile"
          >
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(profile?.first_name?.[0] || '?').toUpperCase()}
            </div>
            <span className="hidden xl:block text-sm">{profile?.first_name}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="btn-micro hidden sm:flex shrink-0 px-2">
            <LogOut className="h-4 w-4 mr-1" /><span className="hidden lg:block">Logout</span>
          </Button>
          {/* Mobile hamburger */}
          <Button variant="ghost" size="sm" className="md:hidden shrink-0" onClick={() => setMobileNavOpen(o => !o)}>
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden border-b bg-background/95 backdrop-blur px-4 py-2 space-y-1 view-enter z-20 relative">
          {navigationItems.map(item => (
            <Button
              key={item.name}
              variant={currentView === item.view ? 'default' : 'ghost'}
              onClick={() => navigateTo(item.view as DashboardView)}
              className="w-full justify-start gap-2"
              size="sm"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />Logout
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateTo('profile')} className="w-full justify-start gap-2">
            <UserCircle className="h-4 w-4" />My Profile
          </Button>
        </div>
      )}

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 px-4 sm:px-6 py-3 text-center text-xs text-muted-foreground">
        <span>QuestionCraft AI &nbsp;·&nbsp; Kalasalingam Academy of Research and Education &nbsp;·&nbsp; {new Date().getFullYear()}</span>
      </footer>

      <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subjectToDelete?.name}"? This will also delete all associated question papers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSubject}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
