import React, { useState, useEffect } from 'react';
import { Brain, FileText, Sparkles, CheckCircle, Loader2, Zap, Stars, BookOpen, PenTool, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GeneratingAnimationProps {
  isGenerating: boolean;
  currentStep?: string;
}

export function GeneratingAnimation({ isGenerating, currentStep = "Generating questions..." }: GeneratingAnimationProps) {
  const [dots, setDots] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { text: "🔍 Analyzing syllabus content...", icon: BookOpen, color: "text-blue-500" },
    { text: "⚖️ Processing unit weightages...", icon: Target, color: "text-green-500" },
    { text: "🧠 AI crafting intelligent questions...", icon: Brain, color: "text-purple-500" },
    { text: "✨ Applying difficulty levels...", icon: Zap, color: "text-yellow-500" },
    { text: "📝 Formatting paper structure...", icon: PenTool, color: "text-indigo-500" },
    { text: "🎯 Finalizing question paper...", icon: CheckCircle, color: "text-emerald-500" }
  ];

  useEffect(() => {
    if (!isGenerating) return;

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length);
    }, 1500);

    return () => {
      // Restore scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      setProgress(0);
      setStepIndex(0);
      setDots('');
    }
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(88,28,135,0.97) 50%, rgba(15,23,42,0.97) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl animate-scale-in relative">
        <CardContent className="p-6 sm:p-10 text-center space-y-5 sm:space-y-8">
          {/* Enhanced AI Brain Icon with Multiple Animations */}
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 animate-pulse scale-150"></div>
            
            {/* Middle rotating ring */}
            <div className="absolute inset-2 border-2 border-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-spin-slow opacity-40"></div>
            
            {/* Main icon container */}
            <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 via-purple-500 to-pink-500 rounded-full p-4 sm:p-6 w-20 h-20 sm:w-28 sm:h-28 mx-auto flex items-center justify-center shadow-2xl animate-float">
              <Brain className="w-10 h-10 sm:w-14 sm:h-14 text-white animate-pulse" />
            </div>
            
            {/* Floating sparkles */}
            <div className="absolute -top-3 -right-3 animate-bounce">
              <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
              <Stars className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
            <div className="absolute top-1 -left-4 animate-bounce" style={{ animationDelay: '1s' }}>
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
          </div>

          {/* Enhanced Title */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              🤖 AI Question Paper Generation
            </h3>
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className={`${steps[stepIndex].color} animate-bounce`}>
                {React.createElement(steps[stepIndex].icon, { className: "w-5 h-5" })}
              </div>
              <p className="text-white font-medium">
                {steps[stepIndex].text}{dots}
              </p>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-4">
            <div className="relative">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative animate-shimmer"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-white/80 font-medium">
                  {Math.round(progress)}% Complete
                </p>
                <div className="flex space-x-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Animated Process Icons */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <FileText className="w-6 h-6 text-blue-400 animate-bounce" />
              <span className="text-xs text-white/80 font-medium">Content</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <Brain className="w-6 h-6 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="text-xs text-white/80 font-medium">AI Brain</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <CheckCircle className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDelay: '1s' }} />
              <span className="text-xs text-white/80 font-medium">Output</span>
            </div>
          </div>

          {/* Pulsing Footer */}
          <div className="flex justify-center items-center space-x-2 pt-4">
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-6 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full animate-wave"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-white/60 text-sm font-medium ml-3">Crafting your perfect paper...</span>
          </div>
        </CardContent>
      </Card>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-slide {
          animation: slide 2s infinite;
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
} 