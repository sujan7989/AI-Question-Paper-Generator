import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Save, Loader2, GraduationCap, Calendar, Building2 } from 'lucide-react';

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Biotechnology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Other",
]

export function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [subjectHandled, setSubjectHandled] = useState(profile?.subject_handled || '');
  const [department, setDepartment] = useState((profile as any)?.department || '');

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      subject_handled: subjectHandled,
      department,
    } as any);
    setIsSaving(false);
    if (!error) setIsEditing(false);
  };

  const handleCancel = () => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
    setSubjectHandled(profile?.subject_handled || '');
    setDepartment((profile as any)?.department || '');
    setIsEditing(false);
  };

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">View and update your account information.</p>
      </div>

      {/* Avatar + summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {(profile?.first_name?.[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold truncate">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Badge variant={profile?.role === 'admin' ? 'destructive' : 'secondary'}>
                  {profile?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </Badge>
                {profile?.subject_handled && (
                  <Badge variant="outline">{profile.subject_handled}</Badge>
                )}
                {(profile as any)?.department && (
                  <Badge variant="outline" className="text-blue-700 border-blue-300">{(profile as any).department}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />Personal Information
          </CardTitle>
          <CardDescription>Update your name and subject details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} disabled={!isEditing} placeholder="First name" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} disabled={!isEditing} placeholder="Last name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            {isEditing ? (
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <Input value={department || 'Not set'} disabled />
            )}
          </div>
          <div className="space-y-2">
            <Label>Subject Handled</Label>
            <Input value={subjectHandled} onChange={e => setSubjectHandled(e.target.value)} disabled={!isEditing} placeholder="e.g., Data Structures, DBMS" />
          </div>

          <div className="flex gap-2 pt-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Read-only account info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />Account Details
          </CardTitle>
          <CardDescription>These details are managed by the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{profile?.role || 'Staff'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Institution</p>
              <p className="text-sm font-medium">Kalasalingam Academy of Research and Education</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{(profile as any)?.department || department || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{joinedDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
