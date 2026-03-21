import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Mail, Loader2, Lock } from "lucide-react"
import { checkNetworkStatus, handleNetworkError } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

      const { error } = await signIn(email, password)
      
      if (error) {
        // Error is already handled in AuthContext
      } else {
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
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1"
              type="button"
              onClick={() => navigate('/forgot-password')}
              disabled={isLoading}
            >
              <Lock className="w-3 h-3" />
              Forgot password?
            </Button>
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