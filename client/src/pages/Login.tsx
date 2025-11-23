import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoImage from "@assets/generated_images/PayVault_app_icon_logo_4053ec67.png";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid credentials");
      }

      const { userId, username: loggedInUsername, role } = await response.json();

      login(userId, loggedInUsername, role);

      const roleLabels: Record<string, string> = {
        admin: "Administrator",
        manager: "Manager",
        viewer: "Viewer",
      };

      // Extract first name from username (format: firstname.lastname) and capitalize it
      const firstName = loggedInUsername.split('.')[0];
      const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      toast({
        title: `👋 Welcome back, ${capitalizedFirstName}!`,
        description: `You are logged in as ${roleLabels[role] || role}. Have a productive session!`,
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <img src={logoImage} alt="PayVault" className="h-16 w-16 rounded-md" />
            <div className="text-center">
              <CardTitle className="text-2xl">PayVault</CardTitle>
              <CardDescription>Employee Salary Management System</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  // Only allow lowercase letters and dots
                  const value = e.target.value.toLowerCase().replace(/[^a-z.]/g, '');
                  setUsername(value);
                }}
                placeholder="john.doe"
                data-testid="input-username"
                required
              />
              <p className="text-xs text-muted-foreground">Lowercase letters and dots only</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                data-testid="input-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
