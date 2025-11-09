import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Salary from "@/pages/Salary";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectionIndicator from "@/components/ConnectionIndicator";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/employees">
        {() => <ProtectedRoute component={Employees} />}
      </Route>
      <Route path="/salary">
        {() => <ProtectedRoute component={Salary} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (location === "/login") {
    return <Router />;
  }

  if (!user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar currentPath={location} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <ConnectionIndicator />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
