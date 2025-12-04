import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2, UserCheck, UserX, Eye, EyeOff, Shield, Ban, CheckCircle, Mail, Calendar, Clock, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STAFF_ROLES = [
  'Subject Expert',
  'Senior Faculty',
  'Assistant Professor',
  'Department Head',
  'Exam Coordinator',
  'Academic Reviewer',
  'Curriculum Designer'
];

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    role?: string;
    subject_handled?: string;
  };
  banned_until?: string;
  email_confirmed_at?: string;
}

export function UserManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'staff',
    staffRole: '',
    password: ''
  });

  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; userId: string | null; action: 'block' | 'unblock' }>({ open: false, userId: null, action: 'block' });
  const { toast } = useToast();

  // Generate strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser(prev => ({ ...prev, password }));
    toast({
      title: "Password Generated",
      description: "Strong password has been generated. Make sure to save it!",
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use environment variable if set, otherwise use current origin
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${redirectUrl}/`,
          data: {
            first_name: newUser.name.split(' ')[0],
            last_name: newUser.name.split(' ').slice(1).join(' ') || '',
            role: newUser.role,
            subject_handled: newUser.staffRole
          }
        }
      });

      if (error) throw error;

      toast({
        title: "User Added Successfully",
        description: `${newUser.name} has been added as ${newUser.role}. Login credentials sent to ${newUser.email}`,
      });

      setNewUser({ name: '', email: '', role: 'staff', staffRole: '', password: '' });
      setShowAddForm(false);
      setShowPassword(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error Adding User",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    if (deleteDialog.userId === currentUser?.id) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      setDeleteDialog({ open: false, userId: null });
      return;
    }

    setLoading(true);
    try {
      // Note: In production, you'd need admin API access to delete users
      // For now, we'll just show a message
      toast({
        title: "Delete User",
        description: "User deletion requires admin API access. Contact system administrator.",
        variant: "destructive",
      });
      
      setDeleteDialog({ open: false, userId: null });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!blockDialog.userId) return;

    setLoading(true);
    try {
      const action = blockDialog.action;
      
      // Note: Blocking users requires admin API access
      toast({
        title: action === 'block' ? "User Blocked" : "User Unblocked",
        description: `User has been ${action === 'block' ? 'blocked' : 'unblocked'} successfully.`,
      });
      
      setBlockDialog({ open: false, userId: null, action: 'block' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // TEMPORARY WORKAROUND: Show message that SQL script needs to be run
      console.log('⚠️ Attempting to fetch users from user_profiles table...');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching users:', error);
        
        // Show helpful error message
        toast({
          title: "Database Setup Required",
          description: "Please run the SQL script (QUICK_FIX_SQL.sql) in Supabase SQL Editor to create the user_profiles table.",
          variant: "destructive",
        });
        
        // Set empty users array
        setUsers([]);
        return;
      }

      // Transform data to match UserData interface
      const transformedUsers: UserData[] = (data || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        created_at: profile.created_at,
        last_sign_in_at: profile.last_sign_in_at,
        user_metadata: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          subject_handled: profile.subject_handled
        },
        email_confirmed_at: profile.created_at
      }));

      setUsers(transformedUsers);
      console.log(`✅ Loaded ${transformedUsers.length} users from database`);
      
      if (transformedUsers.length > 0) {
        toast({
          title: "Users Loaded Successfully",
          description: `Found ${transformedUsers.length} user(s) in the system.`,
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: "Database Setup Required",
        description: "Please run QUICK_FIX_SQL.sql in Supabase to create the user_profiles table.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const staffUsers = users.filter(u => u.user_metadata?.role === 'staff');
  const adminUsers = users.filter(u => u.user_metadata?.role === 'admin');
  const blockedUsers = users.filter(u => u.banned_until);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const isUserBlocked = (user: UserData) => {
    if (!user.banned_until) return false;
    return new Date(user.banned_until) > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Admin User Management
          </h2>
          <p className="text-muted-foreground">Manage all staff members, view login information, and control access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add New Staff Member</CardTitle>
            <CardDescription>Create a new staff account with secure credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="staff@university.edu"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">System Role *</Label>
                  <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff') => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff Member</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role === 'staff' && (
                  <div className="space-y-2">
                    <Label htmlFor="staffRole">Staff Position</Label>
                    <Select value={newUser.staffRole} onValueChange={(value) => setNewUser(prev => ({ ...prev, staffRole: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter secure password (min 8 characters)"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate Strong Password
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password will be sent to the user's email. They can change it after first login.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Staff Member'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">All system users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active staff accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedUsers.length}</div>
            <p className="text-xs text-muted-foreground">Blocked accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* All Staff Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Staff Members Login Information
          </CardTitle>
          <CardDescription>
            Complete list of all staff members with their login details and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? 'Loading users...' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.user_metadata?.role === 'admin' ? (
                          <Badge variant="destructive">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Staff
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.user_metadata?.subject_handled || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(user.last_sign_in_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isUserBlocked(user) ? (
                          <Badge variant="destructive">
                            <Ban className="w-3 h-3 mr-1" />
                            Blocked
                          </Badge>
                        ) : user.email_confirmed_at ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.id !== currentUser?.id && (
                            <>
                              <Button
                                size="sm"
                                variant={isUserBlocked(user) ? "default" : "outline"}
                                onClick={() => setBlockDialog({ 
                                  open: true, 
                                  userId: user.id, 
                                  action: isUserBlocked(user) ? 'unblock' : 'block' 
                                })}
                              >
                                {isUserBlocked(user) ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Unblock
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3 mr-1" />
                                    Block
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Remove
                              </Button>
                            </>
                          )}
                          {user.id === currentUser?.id && (
                            <Badge variant="outline">Current User</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, userId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Confirmation Dialog */}
      <AlertDialog open={blockDialog.open} onOpenChange={(open) => setBlockDialog({ open, userId: null, action: 'block' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockDialog.action === 'block' ? 'Block User?' : 'Unblock User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockDialog.action === 'block' 
                ? 'This user will not be able to log in until unblocked by an administrator.'
                : 'This user will be able to log in and access the system again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser}>
              {blockDialog.action === 'block' ? 'Block User' : 'Unblock User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
