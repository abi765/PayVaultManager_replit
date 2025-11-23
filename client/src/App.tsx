import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Salary from "@/pages/Salary";
import SalaryAdjustments from "@/pages/SalaryAdjustments";
import Organization from "@/pages/Organization";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import ActivityLogs from "@/pages/ActivityLogs";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectionIndicator from "@/components/ConnectionIndicator";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function ProtectedRoute({ component: Component, ...rest }: { component: any; path?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/employees">{() => <ProtectedRoute component={Employees} />}</Route>
      <Route path="/salary">{() => <ProtectedRoute component={Salary} />}</Route>
      <Route path="/adjustments">{() => <ProtectedRoute component={SalaryAdjustments} />}</Route>
      <Route path="/organization">{() => <ProtectedRoute component={Organization} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={Users} />}</Route>
      <Route path="/activity-logs">{() => <ProtectedRoute component={ActivityLogs} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user || location === "/login") {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

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
          <main className="flex-1 overflow-auto p-4 md:p-6">
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
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
