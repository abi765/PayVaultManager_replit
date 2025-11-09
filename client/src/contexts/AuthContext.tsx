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
  login: (userId: string) => void;
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
      setUser({
        id: userId,
        username: "Admin User",
        role: "admin",
      });
    }
    setIsLoading(false);
  }, []);

  const login = (userId: string) => {
    localStorage.setItem("userId", userId);
    setUser({
      id: userId,
      username: "Admin User",
      role: "admin",
    });
    setLocation("/");
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
