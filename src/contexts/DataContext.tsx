import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, User } from '@/types';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  users: User[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserClients: (userId: string) => Client[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CLIENTS_KEY = 'tracking_app_clients';
const USERS_KEY = 'tracking_app_users';

// Initial sample data
const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Client Alpha',
    description: 'Projet de développement web',
    status: 'in-progress',
    assignedUserId: '2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Client Beta',
    description: 'Application mobile',
    status: 'todo',
    assignedUserId: '2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Load data from localStorage
    const savedClients = localStorage.getItem(CLIENTS_KEY);
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    } else {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(INITIAL_CLIENTS));
      setClients(INITIAL_CLIENTS);
    }

    const savedUsers = localStorage.getItem(USERS_KEY);
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(newClients));
  };

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  };

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveClients([...clients, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const newClients = clients.map((client) =>
      client.id === id
        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
        : client
    );
    saveClients(newClients);
  };

  const deleteClient = (id: string) => {
    saveClients(clients.filter((client) => client.id !== id));
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    saveUsers([...users, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const newUsers = users.map((user) =>
      user.id === id ? { ...user, ...updates } : user
    );
    saveUsers(newUsers);
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) {
      return; // Can't delete yourself
    }
    saveUsers(users.filter((user) => user.id !== id));
    // Also remove all clients assigned to this user
    saveClients(clients.filter((client) => client.assignedUserId !== id));
  };

  const getUserClients = (userId: string) => {
    return clients.filter((client) => client.assignedUserId === userId);
  };

  return (
    <DataContext.Provider
      value={{
        clients,
        users,
        addClient,
        updateClient,
        deleteClient,
        addUser,
        updateUser,
        deleteUser,
        getUserClients,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
