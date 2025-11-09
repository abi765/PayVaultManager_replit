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
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
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
        throw new Error("Invalid credentials");
      }

      const { userId } = await response.json();
      login(userId);
      toast({
        title: "Login successful",
        description: "Welcome to PayVault",
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                data-testid="input-username"
                required
              />
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
            <p className="text-xs text-center text-muted-foreground">
              Demo credentials: admin / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
