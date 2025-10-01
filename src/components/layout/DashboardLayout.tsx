import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  ClipboardList,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Get current page info for breadcrumb
  const getCurrentPageInfo = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem || navItems[0];
  };

  const currentPage = getCurrentPageInfo();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "border-r bg-sidebar flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        <div className="p-5 flex items-center justify-center">
          {!sidebarCollapsed && <img src={logo} alt="Infomineo" className="h-5" />}
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  'w-full h-9 px-3 font-normal text-sm rounded-lg transition-all',
                  sidebarCollapsed ? 'justify-center' : 'justify-start',
                  isActive 
                    ? 'bg-background text-foreground font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-border/50' 
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                )}
                onClick={() => navigate(item.path)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          {sidebarCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-full h-9"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-none truncate">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAdmin ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Déconnexion
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background flex items-center px-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => navigate('/dashboard')}
                  className="cursor-pointer"
                >
                  Accueil
                </BreadcrumbLink>
              </BreadcrumbItem>
              {location.pathname !== '/dashboard' && (
                <>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentPage.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
