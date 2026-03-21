import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/LoginForm"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { useAuth } from "@/contexts/AuthContext"
import { GraduationCap } from "lucide-react"

export function AuthPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center relative" style={{background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-bold text-lg">Loading...</p>
          <p className="text-white/70 text-sm mt-2">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (user) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col relative" style={{background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)'}}>
      <div className="flex items-center justify-center min-h-screen relative z-10 px-4">
        <div className="w-full max-w-md space-y-4">
          {/* Branding */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-primary rounded-xl p-2">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white drop-shadow">QuestionCraft AI</span>
            </div>
            <p className="text-white/80 text-sm drop-shadow">AI-powered question paper generation for universities</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl border border-gray-200" style={{colorScheme: 'light'}}>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-t-xl rounded-b-none">
                <TabsTrigger value="login" className="font-bold text-base rounded-tl-xl text-gray-700 data-[state=active]:text-gray-900">Login</TabsTrigger>
                <TabsTrigger value="signup" className="font-bold text-base rounded-tr-xl text-gray-700 data-[state=active]:text-gray-900">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
                    <CardDescription className="text-base text-gray-600">Login to your account to continue.</CardDescription>
                  </CardHeader>
                  <CardContent><LoginForm /></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="signup">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Create account</CardTitle>
                    <CardDescription className="text-base text-gray-600">Sign up to start generating question papers.</CardDescription>
                  </CardHeader>
                  <CardContent><SignUpForm /></CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}