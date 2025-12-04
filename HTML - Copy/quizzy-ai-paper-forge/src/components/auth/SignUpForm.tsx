import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { OTPVerification } from "./OTPVerification"
import { useNavigate } from "react-router-dom"

export function SignUpForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<"admin" | "staff">("staff")
  const [subjectHandled, setSubjectHandled] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    const { error, requiresOTP, email: userEmail } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      role,
      subject_handled: subjectHandled,
    })
    
    setIsLoading(false)
    
    if (!error && requiresOTP && userEmail) {
      // Show OTP verification screen
      setSignupEmail(userEmail)
      setShowOTP(true)
    }
  }

  const handleOTPSuccess = () => {
    toast({
      title: "Welcome! 🎉",
      description: "Your account has been verified. Redirecting...",
    })
    setTimeout(() => {
      navigate('/')
    }, 1500)
  }

  const handleBackToSignup = () => {
    setShowOTP(false)
    setSignupEmail("")
  }

  // Show OTP verification if needed
  if (showOTP) {
    return (
      <OTPVerification
        email={signupEmail}
        onSuccess={handleOTPSuccess}
        onBack={handleBackToSignup}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name" className="text-black font-bold text-base">First Name</Label>
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name" className="text-black font-bold text-base">Last Name</Label>
          <Input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
            placeholder="Enter last name"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-black font-bold text-base">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
          placeholder="Enter your email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-black font-bold text-base">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
          placeholder="Enter password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-black font-bold text-base">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
          placeholder="Confirm password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role" className="text-black font-bold text-base">Role</Label>
        <Select value={role} onValueChange={(value: "admin" | "staff") => setRole(value)}>
          <SelectTrigger className="text-black border-2 border-gray-300 bg-white">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff Member</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-black font-bold text-base">Subject Handled</Label>
        <Input
          id="subject"
          value={subjectHandled}
          onChange={(e) => setSubjectHandled(e.target.value)}
          className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
          placeholder="e.g., Mathematics, Science"
        />
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
} 