import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  name: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'waiting' | 'blocked';
  assigned_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'user';
}

interface DataContextType {
  clients: Client[];
  profiles: Profile[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch profiles with roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          name,
          user_roles (role)
        `);

      if (profilesError) throw profilesError;

      const profilesWithRoles = profilesData?.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        role: (p.user_roles as any)?.[0]?.role as 'admin' | 'user'
      })) || [];

      setProfiles(profilesWithRoles);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .insert([client]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client added successfully'
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add client'
      });
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client updated successfully'
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update client'
      });
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client deleted successfully'
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete client'
      });
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only admins can change user roles'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully'
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update user role'
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only admins can delete users'
      });
      return;
    }

    try {
      // Delete from auth.users (cascades to profiles and user_roles)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete user'
      });
      throw error;
    }
  };

  return (
    <DataContext.Provider
      value={{
        clients,
        profiles,
        loading,
        addClient,
        updateClient,
        deleteClient,
        updateUserRole,
        deleteUser,
        refreshData: fetchData
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
