import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import { AuthPage } from "./components/auth/AuthPage";
import NotFound from "./pages/NotFound";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import FloatingBackground from "./components/FloatingBackground";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { ResetPassword } from "./components/ResetPassword";
import { GraduationCap } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const [isUserChecked, setIsUserChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsUserChecked(true);
    }
  }, [loading, user]);

  if (!isUserChecked) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)' }}>
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

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

const App = () => {
  const { user } = useAuth();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <FloatingBackground />
        <div className="relative z-10">
          <BrowserRouter basename="/" >
            <Routes>
              <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Commented out until UpdatePassword component is imported */}
              {/* <Route path="/updatepassword" element={<UpdatePassword />} /> */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
