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
    return <div>Loading...</div>;
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
