import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Mail, Loader2, Lock, ArrowLeft } from "lucide-react"
import { checkNetworkStatus, handleNetworkError } from "@/integrations/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"

export function LoginForm() {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const { toast } = useToast();

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Check network connectivity
      const isOnline = await checkNetworkStatus()
      if (!isOnline) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        })
        return
      }

      console.log('Attempting to sign in:', email)
      
      const { error } = await signIn(email, password)
      
      if (error) {
        console.error('Login error:', error)
        // Error is already handled in AuthContext
      } else {
        console.log('Login successful')
        // Clear form on success
        setEmail("")
        setPassword("")
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error)
      const errorMessage = handleNetworkError(error)
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast({ 
        title: "Email Required", 
        description: "Please enter your email address.", 
        variant: "destructive" 
      })
      return
    }

    if (!validateEmail(resetEmail)) {
      toast({ 
        title: "Invalid Email", 
        description: "Please enter a valid email address.", 
        variant: "destructive" 
      })
      return
    }

    // Check network connectivity
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      toast({
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true)
    try {
      console.log('Sending password reset request for:', resetEmail);
      
      const { error } = await resetPassword(resetEmail)
      
      if (!error) {
        toast({
          title: "Reset Link Sent!",
          description: "Check your email for a password reset link. If you don't see it, check your spam folder.",
          variant: "default",
        })
        setIsResetDialogOpen(false)
        setResetEmail("")
      } else {
        // Error is already handled in AuthContext, but we can add additional logging
        console.error('Password reset failed:', error);
      }
    } catch (error: any) {
      console.error('Unexpected error in password reset:', error);
      
      const errorMessage = handleNetworkError(error);
      let errorTitle = "Reset Failed";
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorTitle = "Network Error";
      } else if (error.message?.includes('timeout')) {
        errorTitle = "Timeout Error";
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorTitle = "Connection Error";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsResetLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-black font-bold text-base">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email address"
          className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-black font-bold text-base">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10 text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-black" />
            ) : (
              <Eye className="h-4 w-4 text-black" />
            )}
          </Button>
        </div>
        <div className="text-right">
          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1"
                type="button"
                onClick={() => {
                  navigate('/forgot-password')
                }}
                disabled={isLoading}
              >
                <Lock className="w-3 h-3" />
                Forgot password?
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-black dark:bg-white dark:text-black">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Reset Password
                </DialogTitle>
                <DialogDescription className="text-gray-700">
                  We'll send a secure reset link to your email address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-black font-semibold">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">What happens next?</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      We'll send a secure reset link to your email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      The link will expire in 24 hours
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      Check your spam folder if you don't receive it
                    </li>
                  </ul>
                </div>
                <Button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResetLoading}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  {isResetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send reset link
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  )
}