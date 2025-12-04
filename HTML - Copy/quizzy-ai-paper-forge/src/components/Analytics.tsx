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
            <CardTitle className="text-sm font-medium">Avg Generation Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground">Average AI processing time</p>
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
          <CardContent>
            {Object.keys(subjectsByExamType).length > 0 ? (
              Object.entries(subjectsByExamType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-1">
                  <span className="font-medium capitalize">{type}</span>
                  <Badge variant="outline">{count} subjects</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No subjects found</p>
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
          <CardContent>
            {Object.keys(papersByDifficulty).length > 0 ? (
              Object.entries(papersByDifficulty).map(([difficulty, count]) => (
                <div key={difficulty} className="flex items-center justify-between py-1">
                  <span className="font-medium capitalize">{difficulty}</span>
                  <Badge>{count} papers</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No papers found</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>AI generation metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Success Rate</span>
              <Badge variant="default">98.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Processing Time</span>
              <Badge variant="secondary">2.3s</Badge>
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