import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { path: '/users', icon: Users, label: 'Utilisateurs' },
        { path: '/clients', icon: Briefcase, label: 'Clients' },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { path: '/my-work', icon: ClipboardList, label: 'Mon travail' },
      ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border/20">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <img src={logo} alt="Infomineo" className="h-5" />
              </div>
              <span className="text-base font-medium text-foreground">Infomineo</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                          className={cn(
                            'h-9 px-3 rounded-md text-sm font-normal',
                            isActive
                              ? 'bg-accent/50 text-foreground'
                              : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-none truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAdmin ? 'Admin' : 'User'}
                </p>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="h-9 px-3 rounded-md text-sm font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
