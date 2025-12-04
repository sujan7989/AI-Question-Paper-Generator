import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function TestResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    serverStatus: boolean;
    authPage: boolean;
    resetPage: boolean;
    emailSent: boolean;
  }>({
    serverStatus: false,
    authPage: false,
    resetPage: false,
    emailSent: false,
  });
  const { toast } = useToast();

  const runTests = async () => {
    setIsLoading(true);
    const results = { ...testResults };

    try {
      // Test 1: Check if server is running
      try {
        const response = await fetch('http://localhost:8080');
        results.serverStatus = response.ok;
      } catch (error) {
        results.serverStatus = false;
      }

      // Test 2: Check if auth page is accessible
      try {
        const response = await fetch('http://localhost:8080/auth');
        results.authPage = response.ok;
      } catch (error) {
        results.authPage = false;
      }

      // Test 3: Check if reset password page is accessible
      try {
        const response = await fetch('http://localhost:8080/reset-password');
        results.resetPage = response.ok;
      } catch (error) {
        results.resetPage = false;
      }

      setTestResults(results);

      toast({
        title: "Tests Completed",
        description: `Server: ${results.serverStatus ? '✅' : '❌'}, Auth: ${results.authPage ? '✅' : '❌'}, Reset: ${results.resetPage ? '✅' : '❌'}`,
        variant: results.serverStatus && results.authPage && results.resetPage ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: "An error occurred while running tests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestResetEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (!error) {
        setTestResults(prev => ({ ...prev, emailSent: true }));
        toast({
          title: "Test Email Sent!",
          description: "Check your email for the reset link. This confirms the functionality is working.",
          variant: "default",
        });
      } else {
        toast({
          title: "Test Failed",
          description: error.message || "Failed to send test email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      toast({
        title: "Test Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Test</h1>
          <p className="text-gray-600">Verify that the forgot password functionality is working correctly</p>
        </div>

        <div className="space-y-6">
          {/* Test Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Running</span>
                {testResults.serverStatus ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auth Page Accessible</span>
                {testResults.authPage ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Reset Page Accessible</span>
                {testResults.resetPage ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Sent</span>
                {testResults.emailSent ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-3">
            <Button
              onClick={runTests}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Reset Password Page
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="test-email" className="text-sm font-medium text-gray-700">
                Test Email Address
              </Label>
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to test"
                className="border-2 border-gray-300"
              />
            </div>

            <Button
              onClick={sendTestResetEmail}
              disabled={isLoading || !email.trim()}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test Reset Email
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How to Test:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Click "Test Reset Password Page" to check system status</li>
              <li>2. Enter your email and click "Send Test Reset Email"</li>
              <li>3. Check your email for the reset link</li>
              <li>4. Click the link to verify it opens the reset page</li>
            </ol>
          </div>

          {/* Quick Links */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('http://localhost:8080/auth', '_blank')}
              className="flex-1"
            >
              Open Auth Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('http://localhost:8080/reset-password', '_blank')}
              className="flex-1"
            >
              Open Reset Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 