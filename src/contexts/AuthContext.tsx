import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'tracking_app_auth';

// Initial admin user
const INITIAL_USERS: User[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'Administrateur',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: '2',
    email: 'user@company.com',
    name: 'Utilisateur Test',
    role: 'user',
    password: 'user123',
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize users in localStorage if not present
    const usersData = localStorage.getItem('tracking_app_users');
    if (!usersData) {
      localStorage.setItem('tracking_app_users', JSON.stringify(INITIAL_USERS));
    }

    // Check for existing session
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      const { userId } = JSON.parse(savedAuth);
      const users = JSON.parse(localStorage.getItem('tracking_app_users') || '[]');
      const user = users.find((u: User) => u.id === userId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('tracking_app_users') || '[]');
    const user = users.find((u: User) => u.email === email && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: user.id }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAdmin }}>
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
