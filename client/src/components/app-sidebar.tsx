import { Home, Users, DollarSign, Sliders, Settings, LogOut, User, Building2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@assets/generated_images/PayVault_app_icon_logo_4053ec67.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["admin", "manager", "viewer"],
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    roles: ["admin", "manager", "viewer"],
  },
  {
    title: "Organization",
    url: "/organization",
    icon: Building2,
    roles: ["admin", "manager", "viewer"],
  },
  {
    title: "Salary Management",
    url: "/salary",
    icon: DollarSign,
    roles: ["admin", "manager", "viewer"],
  },
  {
    title: "Adjustments",
    url: "/adjustments",
    icon: Sliders,
    roles: ["admin", "manager"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "Users",
    url: "/users",
    icon: User,
    roles: ["admin"],
  },
];

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  viewer: "Viewer",
};

function getMenuItemsForRole(role: string) {
  return menuItems.filter((item) => item.roles.includes(role));
}

interface AppSidebarProps {
  currentPath?: string;
}

export function AppSidebar({ currentPath = "/" }: AppSidebarProps) {
  const { user, logout } = useAuth();
  
  const visibleMenuItems = user ? getMenuItemsForRole(user.role) : [];

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
              {visibleMenuItems.map((item) => (
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
        {user ? (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user.username}
              </p>
              <Badge variant="secondary" className="text-xs mt-1" data-testid="badge-user-role">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              data-testid="button-logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
