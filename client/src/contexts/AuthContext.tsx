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

    if (userId) {
      fetch("/api/auth/me", {
        headers: { "x-user-id": userId },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Authentication failed");
          }
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setUser({
              id: data.user.id,
              username: data.user.username,
              role: data.user.role,
            });
          } else {
            throw new Error("Invalid user data");
          }
        })
        .catch(() => {
          localStorage.removeItem("userId");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (userId: string, username: string, role: string) => {
    localStorage.setItem("userId", userId);
    setUser({
      id: userId,
      username,
      role,
    });
    // Use setTimeout to ensure state update has propagated before redirect
    setTimeout(() => {
      setLocation("/");
    }, 100);
  };

  const logout = () => {
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
