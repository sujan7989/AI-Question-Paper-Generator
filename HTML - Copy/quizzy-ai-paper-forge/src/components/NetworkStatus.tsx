import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { checkNetworkStatus } from '@/integrations/supabase/client';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const status = await checkNetworkStatus();
      setIsOnline(status);
    } catch (error) {
      console.error('Network status check failed:', error);
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check initial status
    checkStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      checkStatus(); // Re-check when coming back online
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className={`fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg ${className}`}>
      <div className="flex items-center space-x-2">
        {isChecking ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        ) : (
          <WifiOff className="h-4 w-4 text-yellow-600" />
        )}
        <span className="text-sm font-medium text-yellow-800">
          {isChecking ? 'Checking connection...' : 'No internet connection'}
        </span>
      </div>
      <p className="text-xs text-yellow-700 mt-1">
        Some features may not work properly. Please check your connection.
      </p>
    </div>
  );
} 