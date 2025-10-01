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
      <aside className="w-60 border-r border-border/40 bg-sidebar flex flex-col shadow-sm">
        <div className="p-5 border-b border-border/40">
          <img src={logo} alt="Infomineo" className="h-8 mb-4" />
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-none">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAdmin ? 'Administrateur' : 'Utilisateur'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  'w-full justify-start h-9 px-3 font-normal',
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                    : 'hover:bg-sidebar-accent/50'
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-2.5 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut className="mr-2.5 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
