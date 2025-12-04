import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/LoginForm"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export function AuthPage() {
  const { user, loading } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('AuthPage - User state:', { user: user?.email, loading });
  }, [user, loading]);

  // Show loading if auth is still checking
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-black font-bold text-lg">Loading...</p>
            <p className="text-sm text-gray-600 mt-2">Checking authentication status...</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Force Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is already authenticated, redirect to home
  if (user) {
    console.log('User already authenticated, redirecting to home');
    window.location.href = '/';
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="w-[400px] bg-white rounded-lg shadow-2xl border-2 border-gray-300">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-200">
              <TabsTrigger value="login" className="text-black font-bold text-base">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-black font-bold text-base">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-black font-bold text-2xl">Login</CardTitle>
                  <CardDescription className="text-gray-800 font-semibold text-base">
                    Welcome back! Please login to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="text-black font-bold text-2xl">Sign Up</CardTitle>
                  <CardDescription className="text-gray-800 font-semibold text-base">
                    Create a new account to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignUpForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}