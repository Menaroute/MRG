import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/types';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';

type WorkStatus = 'todo' | 'in-progress' | 'done' | 'waiting' | 'blocked';

export default function MyWork() {
  const { user } = useAuth();
  const { clients, updateClient } = useData();

  const myClients = user ? clients.filter(c => c.assigned_user_id === user.id) : [];

  const handleStatusChange = async (clientId: string, newStatus: WorkStatus) => {
    await updateClient(clientId, { status: newStatus });
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

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Mon travail</h2>
            <p className="text-muted-foreground mt-1">Gérer les statuts de mes clients</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Période actuelle</p>
            <p className="text-lg font-semibold capitalize">{currentMonth}</p>
          </div>
        </div>

        {myClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {client.name}
                  </CardTitle>
                  {client.description && (
                    <CardDescription className="line-clamp-2">
                      {client.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Statut actuel</p>
                    <Badge variant={getStatusColor(client.status) as any} className="text-sm">
                      {STATUS_LABELS[client.status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Changer le statut</p>
                    <Select
                      value={client.status}
                      onValueChange={(value) => handleStatusChange(client.id, value as WorkStatus)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Mis à jour: {new Date(client.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun client assigné</h3>
              <p className="text-muted-foreground">
                Vous n'avez actuellement aucun client assigné. Contactez votre administrateur.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
