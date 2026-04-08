import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { GraduationCap } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)' }}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-white/20 rounded-xl p-2">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-xl font-bold text-white">QuestionCraft AI</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <Dashboard />;
};

export default Index;
