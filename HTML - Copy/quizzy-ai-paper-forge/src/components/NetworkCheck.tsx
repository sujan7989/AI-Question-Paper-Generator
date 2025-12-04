import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function NetworkCheck() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase connectivity
    const checkSupabase = async () => {
      try {
        const response = await fetch('https://tctwiubpfaeskbuqpjfw.supabase.co/rest/v1/', {
          method: 'HEAD',
          mode: 'no-cors',
        });
        setSupabaseStatus('online');
      } catch (error) {
        console.error('Supabase connectivity check failed:', error);
        setSupabaseStatus('offline');
      }
    };

    checkSupabase();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-64">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Network Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Browser:</span>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span>Supabase:</span>
            <div className="flex items-center gap-1">
              {supabaseStatus === 'checking' && (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
              )}
              {supabaseStatus === 'online' && (
                <Wifi className="w-3 h-3 text-green-500" />
              )}
              {supabaseStatus === 'offline' && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
              <span className={
                supabaseStatus === 'online' ? 'text-green-600' : 
                supabaseStatus === 'offline' ? 'text-red-600' : 'text-yellow-600'
              }>
                {supabaseStatus === 'checking' ? 'Checking' : 
                 supabaseStatus === 'online' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
            className="w-full text-xs"
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 