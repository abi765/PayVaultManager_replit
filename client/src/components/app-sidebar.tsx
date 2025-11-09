import { Home, Users, DollarSign, LogOut, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/generated_images/PayVault_app_icon_logo_4053ec67.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Salary Management",
    url: "/salary",
    icon: DollarSign,
  },
];

interface AppSidebarProps {
  currentPath?: string;
}

export function AppSidebar({ currentPath = "/" }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="PayVault" className="h-10 w-10 rounded-md" />
          <div>
            <h2 className="text-xl font-bold">PayVault</h2>
            <p className="text-xs text-muted-foreground">Salary Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <a href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log("Logout clicked")}
            data-testid="button-logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
