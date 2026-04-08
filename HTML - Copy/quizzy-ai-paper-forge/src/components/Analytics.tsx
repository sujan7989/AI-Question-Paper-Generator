import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  FileText, 
  BookOpen, 
  Users,
  Clock,
  TrendingUp,
  Target,
  Calendar as CalendarIcon,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Flame,
} from 'lucide-react';

export function Analytics() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [generatedPapers, setGeneratedPapers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  // Memoized data fetching function
  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch subjects (only for current user unless admin)
      const subjectsQuery = profile?.role === 'admin' 
        ? supabase.from('subjects').select('*')
        : supabase.from('subjects').select('*').eq('user_id', user.id);
      
      const { data: subjectsData, error: subjectsError } = await subjectsQuery;
      
      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
        toast({
          title: "Error",
          description: "Failed to fetch subjects data",
          variant: "destructive",
        });
      } else {
        setSubjects(subjectsData || []);
      }

      // Fetch papers (only for current user unless admin)
      const papersQuery = profile?.role === 'admin'
        ? supabase.from('question_papers').select('*')
        : supabase.from('question_papers').select('*').eq('user_id', user.id);
      
      const { data: papersData, error: papersError } = await papersQuery;
      
      if (papersError) {
        console.error('Error fetching papers:', papersError);
        toast({
          title: "Error",
          description: "Failed to fetch papers data",
          variant: "destructive",
        });
      } else {
        setGeneratedPapers(papersData || []);
      }

      // Fetch users (only for admin)
      if (profile?.role === 'admin') {
        const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          toast({
            title: "Error",
            description: "Failed to fetch users data",
            variant: "destructive",
          });
        } else {
          setActiveUsers(usersData || []);
        }
      } else {
        setActiveUsers([]);
      }
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Memoized computed values
  const totalSubjects = useMemo(() => subjects.length, [subjects]);
  const totalPapers = useMemo(() => generatedPapers.length, [generatedPapers]);
  const totalUsers = useMemo(() => activeUsers.length, [activeUsers]);
  
  const subjectsByExamType = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      const type = subject.exam_type || 'N/A';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }, [subjects]);

  const papersByDifficulty = useMemo(() => {
    return generatedPapers.reduce((acc, paper) => {
      const difficulty = paper.paper_config?.difficulty || 'medium';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }, [generatedPapers]);

  const recentPapers = useMemo(() => {
    return generatedPapers
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [generatedPapers]);

  // Memoized handlers
  const handleDeleteUser = useCallback(async (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userToDelete.id);

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      // Refresh users list
      await fetchAnalyticsData();
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  }, [userToDelete, fetchAnalyticsData, toast]);
    
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time insights into system usage and performance.</p>
        </div>
        <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Active subjects in system</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Papers Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPapers}</div>
            <p className="text-xs text-muted-foreground">Question papers created</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Staff and administrators</p>
            {profile?.role === 'admin' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Users
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>All Users</DialogTitle>
                    <DialogDescription>
                      Manage all users in the system. Only administrators can view and manage users.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {activeUsers.map(user => (
                      <div key={user.user_id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.first_name} {user.last_name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="w-fit mt-1">
                            {user.role === 'admin' ? 'Administrator' : 'Staff Member'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.user_id, `${user.first_name} ${user.last_name}`)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={user.user_id === profile?.user_id} // Prevent self-deletion
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <DialogClose asChild>
                      <Button variant="outline">
                        Close
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Papers / Subject</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                    {subjects.length > 0 ? (generatedPapers.length / subjects.length).toFixed(1) : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg papers per subject</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Subject Distribution
            </CardTitle>
            <CardDescription>Subjects by exam type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(subjectsByExamType).length > 0 ? (
              Object.entries(subjectsByExamType).map(([type, count]) => {
                const pct = Math.round((count / totalSubjects) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize truncate max-w-[70%]">{type}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <div className="text-3xl mb-2">📚</div>
                <p className="text-sm">No subjects yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Paper Difficulty Analysis
            </CardTitle>
            <CardDescription>Generated papers by difficulty level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(papersByDifficulty).length > 0 ? (
              Object.entries(papersByDifficulty).map(([difficulty, count]) => {
                const pct = Math.round((count / totalPapers) * 100);
                const colors: Record<string, string> = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-red-500' };
                return (
                  <div key={difficulty} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{difficulty}</span>
                      <span className="text-muted-foreground">{count} papers ({pct}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-700 ${colors[difficulty] || 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm">No papers yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>Usage metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Papers per Subject</span>
                <span className="font-bold">{totalSubjects > 0 ? (totalPapers / totalSubjects).toFixed(1) : '0'}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500 transition-all duration-700" style={{
                  width: `${Math.min(100, totalSubjects > 0 ? Math.round((totalPapers / totalSubjects) * 10) : 0)}%`
                }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Units with PDFs</span>
                <span className="font-bold">
                  {(() => {
                    const totalUnits = subjects.reduce((sum, s) => sum + (s.units?.length || 0), 0);
                    const unitsWithPDF = subjects.reduce((sum, s) => sum + (s.units?.filter((u: any) => u.extracted_content?.text)?.length || 0), 0);
                    return `${unitsWithPDF}/${totalUnits}`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500 transition-all duration-700" style={{
                  width: (() => {
                    const totalUnits = subjects.reduce((sum, s) => sum + (s.units?.length || 0), 0);
                    const unitsWithPDF = subjects.reduce((sum, s) => sum + (s.units?.filter((u: any) => u.extracted_content?.text)?.length || 0), 0);
                    return totalUnits > 0 ? `${Math.round((unitsWithPDF / totalUnits) * 100)}%` : '0%';
                  })()
                }} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm">AI Engine</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Recent Generation Activity
            </CardTitle>
            <CardDescription>Latest question papers generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPapers.length > 0 ? (
              recentPapers.map(paper => (
                <div key={paper.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="font-medium">
                    {subjects.find(s => s.id === paper.subject_id)?.subject_name || 'Unknown'} - {new Date(paper.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{paper.total_marks} marks</Badge>
                    <Badge>{paper.paper_config?.difficulty || 'medium'}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No recent papers found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Activity Report — Admin only */}
      {profile?.role === 'admin' && activeUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Activity Report
            </CardTitle>
            <CardDescription>Papers generated per staff member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers
                .filter(u => u.role === 'staff')
                .map(staffUser => {
                  const staffPapers = generatedPapers.filter(p => p.user_id === staffUser.user_id);
                  const staffSubjects = subjects.filter(s => s.user_id === staffUser.user_id);
                  const lastPaper = staffPapers.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  return (
                    <div key={staffUser.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(staffUser.first_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{staffUser.first_name} {staffUser.last_name}</p>
                          <p className="text-xs text-muted-foreground">{staffUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-lg">{staffPapers.length}</p>
                          <p className="text-xs text-muted-foreground">Papers</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg">{staffSubjects.length}</p>
                          <p className="text-xs text-muted-foreground">Subjects</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-xs font-medium">{lastPaper ? new Date(lastPaper.created_at).toLocaleDateString() : 'No activity'}</p>
                          <p className="text-xs text-muted-foreground">Last paper</p>
                        </div>
                        <Badge variant={staffPapers.length > 0 ? 'default' : 'secondary'} className={staffPapers.length > 0 ? 'bg-green-500' : ''}>
                          {staffPapers.length > 0 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              {activeUsers.filter(u => u.role === 'staff').length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No staff members found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature 4: Paper Difficulty Heatmap */}
      {generatedPapers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />Paper Difficulty Heatmap
            </CardTitle>
            <CardDescription>Visual grid showing difficulty distribution across papers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {generatedPapers.slice(0, 30).map((paper, i) => {
                const diff = paper.paper_config?.difficulty || 'medium';
                const colors: Record<string, string> = { easy: 'bg-green-400', medium: 'bg-yellow-400', hard: 'bg-red-500' };
                const subj = subjects.find(s => s.id === paper.subject_id);
                return (
                  <div
                    key={paper.id}
                    title={`${subj?.subject_name || 'Unknown'} — ${diff} — ${new Date(paper.created_at).toLocaleDateString()}`}
                    className={`w-8 h-8 rounded ${colors[diff] || 'bg-gray-300'} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" />Easy</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" />Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" />Hard</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature 8: Staff Performance Report PDF — Admin only */}
      {profile?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />Staff Performance Report
            </CardTitle>
            <CardDescription>Download monthly performance report as PDF</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const staffRows = activeUsers.filter(u => u.role === 'staff').map(u => {
                  const papers = generatedPapers.filter(p => p.user_id === u.user_id);
                  const subs = subjects.filter(s => s.user_id === u.user_id);
                  return `<tr><td>${u.first_name} ${u.last_name}</td><td>${u.email}</td><td>${subs.length}</td><td>${papers.length}</td><td>${papers.length > 0 ? 'Active' : 'Inactive'}</td></tr>`;
                }).join('');
                const html = `<!DOCTYPE html><html><head><title>Staff Report ${month}</title><style>body{font-family:Arial,sans-serif;margin:20mm;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #000;padding:8px;text-align:left;}th{background:#e8e8e8;}h1{text-align:center;}</style></head><body><h1>Staff Performance Report — ${month}</h1><table><tr><th>Name</th><th>Email</th><th>Subjects</th><th>Papers</th><th>Status</th></tr>${staffRows}</table><p style="margin-top:20px;font-size:10pt;color:#555;">Generated on ${new Date().toLocaleString()} by QuestionCraft AI</p></body></html>`;
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
              }}
            >
              <Download className="w-4 h-4 mr-2" />Download Monthly Report (PDF)
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{userToDelete?.name}"? This action cannot be undone and will remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}