import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export function AuthStatus() {
  const { user, session, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Auth:</span>
            <Badge variant={user ? "default" : "secondary"} className="text-xs">
              {loading ? 'Loading' : user ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>
          {user && (
            <div className="text-xs text-gray-600">
              {user.email}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">Session:</span>
            <Badge variant={session ? "default" : "destructive"} className="text-xs">
              {session ? 'Active' : 'None'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 