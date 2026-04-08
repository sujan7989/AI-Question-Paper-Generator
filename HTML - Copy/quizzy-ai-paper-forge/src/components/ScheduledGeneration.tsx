// Feature 2: Scheduled Paper Generation
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addNotification } from '@/lib/notifications';

interface ScheduledJob {
  id: string;
  subjectName: string;
  scheduledAt: string;
  status: 'pending' | 'triggered' | 'cancelled';
  createdAt: string;
}

const STORAGE_KEY = 'scheduled_generations';

function getJobs(): ScheduledJob[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveJobs(jobs: ScheduledJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function ScheduledGeneration() {
  const [jobs, setJobs] = useState<ScheduledJob[]>(getJobs());
  const [subjectName, setSubjectName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const { toast } = useToast();

  // Check for due jobs every minute
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const updated = getJobs().map(job => {
        if (job.status === 'pending' && new Date(job.scheduledAt) <= now) {
          addNotification({
            title: 'Scheduled Generation Due',
            message: `Time to generate paper for: ${job.subjectName}`,
            type: 'info',
          });
          toast({ title: '⏰ Scheduled Generation', description: `Paper generation due for: ${job.subjectName}` });
          return { ...job, status: 'triggered' as const };
        }
        return job;
      });
      saveJobs(updated);
      setJobs(updated);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const addJob = () => {
    if (!subjectName.trim() || !scheduledAt) {
      toast({ title: 'Missing fields', description: 'Enter subject name and date/time.', variant: 'destructive' });
      return;
    }
    const job: ScheduledJob = {
      id: Date.now().toString(),
      subjectName: subjectName.trim(),
      scheduledAt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [job, ...jobs];
    saveJobs(updated);
    setJobs(updated);
    setSubjectName('');
    setScheduledAt('');
    toast({ title: 'Scheduled', description: `Generation scheduled for ${new Date(scheduledAt).toLocaleString()}` });
  };

  const deleteJob = (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    saveJobs(updated);
    setJobs(updated);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    triggered: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />Scheduled Paper Generation
        </CardTitle>
        <CardDescription>Set a date/time to be reminded to generate a paper</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Subject Name</Label>
            <Input placeholder="e.g., Data Structures" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Schedule Date & Time</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={addJob} className="w-full">
              <Plus className="w-4 h-4 mr-2" />Schedule
            </Button>
          </div>
        </div>

        {jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{job.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(job.scheduledAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[job.status]}`}>
                    {job.status}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No scheduled generations yet</p>
        )}
      </CardContent>
    </Card>
  );
}
