import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, checkNetworkStatus, handleNetworkError, getResetPasswordUrl } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'staff';
  subject_handled?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; role: 'admin' | 'staff'; subject_handled?: string }) => Promise<{ error: any; requiresOTP?: boolean; email?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error: any }>;
  resendOTP: (email: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateUserPassword: (email: string, newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Faster fallback mechanism to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.log('Auth fallback: forcing loading to false after 4 seconds');
      setLoading(false);
    }, 4000); // Reduced from 6 to 4 seconds

    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Optimized auth initialization with better error handling
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Set a shorter timeout to prevent hanging
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Auth initialization timeout - forcing loading to false');
            setLoading(false);
          }
        }, 3000); // Reduced from 4 to 3 seconds
        
        // Get initial session with shorter timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 1500) // Reduced from 2000 to 1500
        );
        
        let initialSession = null;
        try {
          const { data: { session }, error: sessionError } = await Promise.race([
            sessionPromise,
            sessionTimeoutPromise
          ]) as any;
          
          if (sessionError) {
            console.error('Error getting initial session:', sessionError);
          } else {
            initialSession = session;
          }
        } catch (error) {
          console.log('Session fetch timeout - continuing without session');
          // Continue without session - user will need to sign in
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Fetch profile if user exists (with timeout)
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    const fetchUserProfile = async (userId: string) => {
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(); // Changed from .single() to .maybeSingle() to handle missing profiles
        
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 3000) // Reduced from 5000 to 3000
        );
        
        let profileData = null;
        try {
          const { data, error } = await Promise.race([
            profilePromise,
            profileTimeoutPromise
          ]) as any;
          
          if (data && !error && mounted) {
            profileData = data;
            setProfile(data as Profile);
          } else if (error) {
            console.error('Error fetching profile:', error);
          }
        } catch (error) {
          console.log('Profile fetch timeout - continuing without profile');
          // Continue without profile - user can still use the app
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    // Set up auth state listener with immediate response
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch profile with timeout
            try {
              await fetchUserProfile(session.user.id);
            } catch (error) {
              console.error('Error fetching profile on auth change:', error);
            }
          } else {
            setProfile(null);
          }
          
          // Set loading to false immediately after auth state change
          setLoading(false);
        }
      }
    );

    // Start initialization immediately
    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Memoized auth functions
  const signUp = useCallback(async (email: string, password: string, userData: { first_name: string; last_name: string; role: 'admin' | 'staff'; subject_handled?: string }) => {
    try {
      // Check network connectivity
      const isOnline = await checkNetworkStatus();
      if (!isOnline) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
        return { error: new Error("No internet connection") };
      }

      console.log('🔐 Signing up with OTP verification...');
      
      // Sign up user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined,
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      console.log('✅ Account created! OTP sent to email.');
      
      toast({
        title: "Account Created! 🎉",
        description: "Please check your email for the 6-digit OTP code to verify your account.",
        variant: "default",
      });

      return { error: null, requiresOTP: true, email: email };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  }, [toast]);

  // Verify OTP code
  const verifyOTP = useCallback(async (email: string, otp: string) => {
    try {
      console.log('🔐 Verifying OTP for:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast({
          title: "Verification Failed",
          description: error.message || "Invalid OTP code. Please try again.",
          variant: "destructive",
        });
        return { error };
      }

      console.log('✅ OTP verified successfully!');
      toast({
        title: "Account Verified! 🎉",
        description: "Your account has been verified successfully. You can now use the app.",
        variant: "default",
      });

      return { error: null };
    } catch (error) {
      console.error('Unexpected error during OTP verification:', error);
      toast({
        title: "Verification failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  }, [toast]);

  // Resend OTP code
  const resendOTP = useCallback(async (email: string) => {
    try {
      console.log('📧 Resending OTP to:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        console.error('OTP resend error:', error);
        
        // Check if it's a rate limit error
        if (error.message?.includes('after') && error.message?.includes('seconds')) {
          const match = error.message.match(/(\d+)\s+seconds/);
          const seconds = match ? match[1] : '60';
          toast({
            title: "Please Wait ⏳",
            description: `You can request a new OTP code after ${seconds} seconds.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Resend Failed",
            description: error.message || "Couldn't resend OTP. Please try again.",
            variant: "destructive",
          });
        }
        return { error };
      }

      console.log('✅ OTP resent successfully!');
      toast({
        title: "OTP Resent! 📧",
        description: "A new OTP code has been sent to your email.",
        variant: "default",
      });

      return { error: null };
    } catch (error) {
      console.error('Unexpected error during OTP resend:', error);
      toast({
        title: "Resend failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Check network connectivity
      const isOnline = await checkNetworkStatus();
      if (!isOnline) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
        return { error: new Error("No internet connection") };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.session) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        // Fetch user profile
        if (data.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          
          if (profileData && !profileError) {
            setProfile(profileData as Profile);
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      const errorMessage = handleNetworkError(error);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Check network connectivity first
      const isOnline = await checkNetworkStatus();
      if (!isOnline) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
        return { error: new Error("No internet connection") };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return { error: new Error("Invalid email format") };
      }
      
      // Use a hardcoded redirect URL to ensure it works
      const redirectUrl = 'http://localhost:8080/updatepassword';
      
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (result.error) {
        console.error('Password reset error:', result.error);
        const errorMessage = handleNetworkError(result.error);
        const errorTitle = result.error.message?.includes('User not found') 
          ? "Account Not Found"
          : result.error.message?.includes('Too many requests') 
          ? "Rate Limited"
          : result.error.message?.includes('Failed to fetch') 
          ? "Network Error"
          : result.error.message?.includes('timeout') 
          ? "Timeout Error"
          : result.error.message?.includes('TypeError') 
          ? "Connection Error"
          : "Reset Failed";
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        return { error: result.error };
      } else {
        toast({
          title: "Reset Link Sent",
          description: "Check your email for the password reset link. It may take a few minutes to arrive.",
        });
        return { error: null };
      }
    } catch (error: any) {
      console.error('Unexpected error during password reset:', error);
      const errorMessage = handleNetworkError(error);
      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      console.log('Attempting to sign out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error && error.message !== 'Auth session missing!') {
        console.error('Sign out error:', error);
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Clear all state immediately
        setUser(null);
        setSession(null);
        setProfile(null);
        
        // Clear any stored data
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
        
        // Force redirect to auth page
        window.location.href = '/auth';
      }
    } catch (error: any) {
      console.error('Unexpected error during sign out:', error);
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      
      // Force logout even if there's an error
      setUser(null);
      setSession(null);
      setProfile(null);
      window.location.href = '/auth';
    }
  }, [toast]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Refresh profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData as Profile);
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    }

    return { error };
  }, [user, toast]);

  const updateUserPassword = useCallback(async (email: string, newPassword: string) => {
    try {
      // Check network connectivity first
      const isOnline = await checkNetworkStatus();
      if (!isOnline) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
        return { error: new Error("No internet connection") };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return { error: new Error("Invalid email format") };
      }
      
      // First, try to sign in to verify the user exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'temp-password-for-verification'
      });

      if (signInError && signInError.message.includes('Invalid login credentials')) {
        // User exists, now send reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'http://localhost:8080/reset-password',
        });

        if (error) {
          console.error('Password reset error:', error);
          const errorMessage = handleNetworkError(error);
          const errorTitle = error.message?.includes('User not found') 
            ? "Account Not Found"
            : error.message?.includes('Too many requests') 
            ? "Rate Limited"
            : error.message?.includes('Failed to fetch') 
            ? "Network Error"
            : error.message?.includes('timeout') 
            ? "Timeout Error"
            : error.message?.includes('TypeError') 
            ? "Connection Error"
            : "Reset Failed";
          
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          });
          return { error };
        } else {
          toast({
            title: "Reset Link Sent",
            description: "Check your email for the password reset link. It may take a few minutes to arrive.",
          });
          return { error: null };
        }
      } else {
        // User doesn't exist
        toast({
          title: "Account Not Found",
          description: "No account found with this email address.",
          variant: "destructive",
        });
        return { error: new Error("Account not found") };
      }
    } catch (error: any) {
      console.error('Unexpected error during password update:', error);
      const errorMessage = handleNetworkError(error);
      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error };
    }
  }, [toast]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    verifyOTP,
    resendOTP,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updateUserPassword,
  }), [user, session, profile, loading, signUp, verifyOTP, resendOTP, signIn, signOut, updateProfile, resetPassword, updateUserPassword]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}