import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { debugQuestionGenerationFlow, checkDatabaseStructure } from '@/lib/debug-flow';
import { Bug, Database, FileText, CheckCircle, XCircle } from 'lucide-react';

/**
 * Debug Panel Component for troubleshooting PDF question generation
 * Add this to your app to easily debug issues
 */
export function DebugPanel() {
  const { user } = useAuth();
  const [isDebugging, setIsDebugging] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const runDebugFlow = async () => {
    if (!user?.id) {
      setResults(['❌ Please log in first']);
      setStatus('error');
      return;
    }

    setIsDebugging(true);
    setResults(['🔍 Starting debug analysis...']);
    setStatus('idle');

    // Capture console logs
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    console.error = (...args) => {
      logs.push('❌ ' + args.join(' '));
      originalError(...args);
    };
    console.warn = (...args) => {
      logs.push('⚠️ ' + args.join(' '));
      originalWarn(...args);
    };

    try {
      await debugQuestionGenerationFlow(user.id);
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      setResults(logs);
      
      // Determine status
      if (logs.some(log => log.includes('No units have extracted PDF content'))) {
        setStatus('error');
      } else if (logs.some(log => log.includes('All units have PDF content'))) {
        setStatus('success');
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      setResults([...logs, '❌ Debug error: ' + (error as Error).message]);
      setStatus('error');
    } finally {
      setIsDebugging(false);
    }
  };

  const runDatabaseCheck = async () => {
    setIsDebugging(true);
    setResults(['🔍 Checking database structure...']);

    const logs: string[] = [];
    const originalLog = console.log;

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await checkDatabaseStructure();
      console.log = originalLog;
      setResults(logs);
      setStatus(logs.some(l => l.includes('❌')) ? 'error' : 'success');
    } catch (error) {
      console.log = originalLog;
      setResults([...logs, '❌ Database check error: ' + (error as Error).message]);
      setStatus('error');
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Panel - PDF Question Generation
        </CardTitle>
        <CardDescription>
          Use this panel to troubleshoot issues with PDF-based question generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runDebugFlow}
            disabled={isDebugging || !user}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Check PDF Content
          </Button>
          
          <Button
            onClick={runDatabaseCheck}
            disabled={isDebugging}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Check Database
          </Button>

          <Button
            onClick={() => {
              setResults([]);
              setStatus('idle');
            }}
            variant="ghost"
            disabled={results.length === 0}
          >
            Clear Results
          </Button>
        </div>

        {!user && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to use the debug panel
            </AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ All checks passed! Your system is ready to generate questions from PDF content.
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ Issues detected. See the results below and follow the recommendations.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="border rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Debug Results:</h4>
            <div className="font-mono text-xs space-y-1">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`${
                    result.includes('❌')
                      ? 'text-red-600'
                      : result.includes('✅')
                      ? 'text-green-600'
                      : result.includes('⚠️')
                      ? 'text-orange-600'
                      : result.includes('🔍')
                      ? 'text-blue-600'
                      : 'text-slate-700'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4 mt-4 text-sm text-muted-foreground">
          <h4 className="font-semibold mb-2">Quick Fixes:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>No PDF content found?</strong> Go to Subject Setup and create a NEW subject with PDF uploads
            </li>
            <li>
              <strong>Generate button disabled?</strong> Check that unit weightages total 100%
            </li>
            <li>
              <strong>Questions not from PDF?</strong> Verify PDF files contain readable text, not just images
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
