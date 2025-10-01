import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Shield, User as UserIcon, Plus, Edit, KeyRound } from 'lucide-react';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Users() {
  const { profiles, updateUserRole, deleteUser, refreshData } = useData();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [inviting, setInviting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; role: 'admin' | 'user' } | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    await updateUserRole(userId, role);
  };

  const handleDelete = (userId: string) => {
    if (userId === user?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingUserId) {
      await deleteUser(deletingUserId);
      setDeleteDialogOpen(false);
      setDeletingUserId(null);
    }
  };

  const handleEdit = (profile: { id: string; name: string; role: 'admin' | 'user' }) => {
    setEditingUser(profile);
    setEditName(profile.name);
    setEditRole(profile.role);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Update role if changed
      if (editRole !== editingUser.role) {
        await updateUserRole(editingUser.id, editRole);
      }

      toast.success('Utilisateur modifié avec succès');
      setEditDialogOpen(false);
      setEditingUser(null);
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const handleSendResetPassword = async () => {
    if (!editingUser) return;

    try {
      const profile = profiles.find(p => p.id === editingUser.id);
      if (!profile) throw new Error('Utilisateur non trouvé');

      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/login`
      });

      if (error) throw error;

      toast.success('Email de réinitialisation envoyé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      // Use the invite-user edge function to avoid logging the admin out
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteEmail,
          name: inviteName,
          role: inviteRole
        }
      });

      if (error) throw error;

      toast.success('Invitation envoyée avec succès. L\'utilisateur recevra un email pour définir son mot de passe.');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('user');
      await refreshData();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const deletingProfile = profiles.find(p => p.id === deletingUserId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Utilisateurs</h2>
            <p className="text-muted-foreground mt-1">Gérer les rôles et comptes utilisateurs</p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Inviter un utilisateur
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {profile.role === 'admin' ? (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="mr-1 h-3 w-3" />
                            Utilisateur
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit({ id: profile.id, name: profile.name, role: profile.role || 'user' })}
                        disabled={profile.id === user?.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
                        disabled={profile.id === user?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Supprimer l'utilisateur"
          description={`Êtes-vous sûr de vouloir supprimer ${deletingProfile?.name} ? Cette action est irréversible.`}
        />

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez le nom ou envoyez un email de réinitialisation du mot de passe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select value={editRole} onValueChange={(value) => setEditRole(value as 'admin' | 'user')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-3 w-3" />
                        Utilisateur
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-3 w-3" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSendResetPassword}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Envoyer un email de réinitialisation
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un utilisateur</DialogTitle>
              <DialogDescription>
                L'utilisateur recevra un email pour définir son mot de passe.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nom</Label>
                <Input
                  id="invite-name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jean.dupont@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'admin' | 'user')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-3 w-3" />
                        Utilisateur
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-3 w-3" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
