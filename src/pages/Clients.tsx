import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
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
import { Plus, Edit, Trash2 } from 'lucide-react';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { Client, STATUS_LABELS } from '@/types';
import { toast } from 'sonner';

export default function Clients() {
  const { clients, profiles, deleteClient } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingClient) {
      deleteClient(deletingClient.id);
      toast.success('Client supprimé avec succès');
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
  };

  const getUserName = (userId: string) => {
    return profiles.find((u) => u.id === userId)?.name || 'Non assigné';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'todo': 'secondary',
      'in-progress': 'default',
      'done': 'default',
      'waiting': 'secondary',
      'blocked': 'destructive',
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Clients</h2>
            <p className="text-muted-foreground mt-1">Gérer les clients et leurs statuts</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un client
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{client.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(client.status) as any}>
                        {STATUS_LABELS[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{getUserName(client.assigned_user_id)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client)}
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

        <ClientFormDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          client={editingClient}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Supprimer le client"
          description={`Êtes-vous sûr de vouloir supprimer ${deletingClient?.name} ? Cette action est irréversible.`}
        />
      </div>
    </DashboardLayout>
  );
}
