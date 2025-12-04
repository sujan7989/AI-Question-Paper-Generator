import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AuthDebug() {
  const { user, session, profile, loading } = useAuth();

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleRefreshSession = async () => {
    try {
      const { data, error } = await window.supabase?.auth.getSession();
      console.log('Session refresh result:', { data, error });
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Loading:</span>
            <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
              {loading ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">User:</span>
            <span className={user ? 'text-green-600' : 'text-red-600'}>
              {user ? user.email : 'None'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Session:</span>
            <span className={session ? 'text-green-600' : 'text-red-600'}>
              {session ? 'Active' : 'None'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Profile:</span>
            <span className={profile ? 'text-green-600' : 'text-red-600'}>
              {profile ? profile.first_name : 'None'}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button onClick={handleRefreshSession} variant="outline" size="sm" className="w-full">
            Refresh Session
          </Button>
          <Button onClick={handleClearStorage} variant="destructive" size="sm" className="w-full">
            Clear Storage & Reload
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
} 