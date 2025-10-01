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
  User as UserIconProfile,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';
import icon from '@/assets/icon.svg';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    signOut();
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
        <div className={cn(
          "p-5 flex items-center",
          sidebarCollapsed ? "justify-center" : "justify-start"
        )}>
          {sidebarCollapsed ? (
            <img src={icon} alt="MRG" className="h-8 w-8" />
          ) : (
            <img src={logo} alt="MRG" className="h-8" />
          )}
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
                  'w-full h-9 px-3 font-normal text-sm rounded-lg transition-all hover:bg-transparent',
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
          <Button
            variant="ghost"
            className={cn(
              'w-full h-9 px-3 font-normal text-sm rounded-lg transition-all text-destructive hover:text-destructive hover:bg-transparent',
              sidebarCollapsed ? 'justify-center' : 'justify-start'
            )}
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className={cn("h-4 w-4", !sidebarCollapsed && "mr-3")} />
            {!sidebarCollapsed && 'Déconnexion'}
          </Button>
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

          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 hover:bg-transparent"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium leading-none">{user?.name || user?.email}</span>
                      <span className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'User'}</span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIconProfile className="mr-2 h-4 w-4" />
                  Mon Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
