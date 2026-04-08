import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { OTPVerification } from "./OTPVerification"
import { useNavigate } from "react-router-dom"

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Biotechnology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Other",
]

export function SignUpForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [department, setDepartment] = useState("")
  const [subjectHandled, setSubjectHandled] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const { toast } = useToast()

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return null
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' }
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '50%' }
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'bg-green-500', width: '100%' }
    return { label: 'Fair', color: 'bg-yellow-400', width: '75%' }
  }
  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters long.", variant: "destructive" })
      return
    }
    if (!department) {
      toast({ title: "Department required", description: "Please select your department.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    const { error, requiresOTP, email: userEmail } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      role: 'staff', // all self-registrations are staff — admin is assigned by existing admin
      subject_handled: subjectHandled || department,
    })
    setIsLoading(false)
    if (!error && requiresOTP && userEmail) {
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
        <Label htmlFor="department" className="text-black font-bold text-base">Department</Label>
        <select
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
          className="w-full h-10 rounded-md border-2 border-gray-300 bg-white px-3 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select your department</option>
          {DEPARTMENTS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-black font-bold text-base">Subject Handled <span className="font-normal text-gray-500 text-sm">(optional)</span></Label>
        <Input
          id="subject"
          value={subjectHandled}
          onChange={(e) => setSubjectHandled(e.target.value)}
          className="text-black placeholder:text-gray-500 border-2 border-gray-300 bg-white"
          placeholder="e.g., Data Structures, DBMS"
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
        {strength && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
            </div>
            <p className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-black font-bold text-base">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={`text-black placeholder:text-gray-500 border-2 bg-white ${confirmPassword && confirmPassword !== password ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="Confirm password"
        />
        {confirmPassword && confirmPassword !== password && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}
      </div>
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
        All new accounts are registered as <span className="font-bold">Staff Member</span>. Contact your administrator to get admin access.
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
} 