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
import { Trash2, Shield, User as UserIcon } from 'lucide-react';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { toast } from 'sonner';

export default function Users() {
  const { profiles, updateUserRole, deleteUser } = useData();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const deletingProfile = profiles.find(p => p.id === deletingUserId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Utilisateurs</h2>
            <p className="text-muted-foreground mt-1">Gérer les rôles et comptes utilisateurs</p>
          </div>
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
                      <Select
                        value={profile.role || 'user'}
                        onValueChange={(value) => handleRoleChange(profile.id, value as 'admin' | 'user')}
                        disabled={profile.id === user?.id}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue>
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
                          </SelectValue>
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
                    </TableCell>
                    <TableCell className="text-right space-x-2">
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
      </div>
    </DashboardLayout>
  );
}
