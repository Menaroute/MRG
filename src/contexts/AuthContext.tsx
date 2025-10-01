import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole extends User {
  role?: 'admin' | 'user';
  name?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls to avoid deadlock
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', session.user.id)
                .single();
              
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();

              if (mounted) {
                setUser({
                  ...session.user,
                  name: profile?.name,
                  role: roleData?.role as 'admin' | 'user'
                });
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            } finally {
              if (mounted) {
                setLoading(false);
              }
            }
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user) {
        setTimeout(async () => {
          if (!mounted) return;
          
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .single();
            
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();

            if (mounted) {
              setUser({
                ...session.user,
                name: profile?.name,
                role: roleData?.role as 'admin' | 'user'
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
