import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar currentPath="/" />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Main content area</p>
        </main>
      </div>
    </SidebarProvider>
  );
}
