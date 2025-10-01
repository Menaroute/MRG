import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-sidebar flex flex-col">
        <div className="p-5">
          <img src={logo} alt="Infomineo" className="h-5" />
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
                  'w-full justify-start h-9 px-3 font-normal text-sm rounded-lg transition-all',
                  isActive 
                    ? 'bg-background text-foreground font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-border/50' 
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground border border-transparent'
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
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
            className="w-full justify-start h-9 px-3 font-normal text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
