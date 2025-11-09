import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Salary from "@/pages/Salary";
import NotFound from "@/pages/not-found";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectionIndicator from "@/components/ConnectionIndicator";

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/salary" component={Salary} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [location] = useLocation();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
