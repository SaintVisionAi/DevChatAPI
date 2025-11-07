import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    // Redirect to Replit OAuth flow
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">CK</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Cookin' Knowledge</CardTitle>
          <CardDescription>Your Gotta Guy™ for Everything</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full"
            size="lg"
            data-testid="button-login-replit"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Replit
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Sign in with your Replit account to access Cookin' Knowledge
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
