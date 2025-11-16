import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userId: string, username: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    console.log(`[AUTH] Initializing - userId in localStorage: ${userId ? 'exists' : 'none'}`);

    if (userId) {
      console.log(`[AUTH] Validating userId: ${userId}`);
      fetch("/api/auth/me", {
        headers: { "x-user-id": userId },
      })
        .then((res) => {
          console.log(`[AUTH] Validation response status: ${res.status}`);
          if (!res.ok) {
            throw new Error("Authentication failed");
          }
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            console.log(`[AUTH] User validated: ${data.user.username} (${data.user.role})`);
            setUser({
              id: data.user.id,
              username: data.user.username,
              role: data.user.role,
            });
          } else {
            throw new Error("Invalid user data");
          }
        })
        .catch((error) => {
          console.log(`[AUTH] Validation failed, clearing session:`, error.message);
          localStorage.removeItem("userId");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (userId: string, username: string, role: string) => {
    console.log(`[AUTH] Login called - userId: ${userId}, username: ${username}, role: ${role}`);
    localStorage.setItem("userId", userId);
    setUser({
      id: userId,
      username,
      role,
    });
    console.log(`[AUTH] User state set, redirecting to /`);
    // Use setTimeout to ensure state update has propagated before redirect
    setTimeout(() => {
      setLocation("/");
    }, 100);
  };

  const logout = () => {
    console.log(`[AUTH] Logout called - clearing session`);
    localStorage.removeItem("userId");
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
