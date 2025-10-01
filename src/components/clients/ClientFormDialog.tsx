import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useData } from '@/contexts/DataContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Client, WorkStatus, STATUS_LABELS } from '@/types';
import { toast } from 'sonner';

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
}

interface FormData {
  name: string;
  description: string;
  status: WorkStatus;
  assignedUserId: string;
}

export default function ClientFormDialog({ open, onClose, client }: ClientFormDialogProps) {
  const { addClient, updateClient, users } = useData();
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>();

  const status = watch('status');
  const assignedUserId = watch('assignedUserId');

  const regularUsers = users.filter((u) => u.role === 'user');

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        description: client.description || '',
        status: client.status,
        assignedUserId: client.assignedUserId,
      });
    } else {
      reset({
        name: '',
        description: '',
        status: 'todo',
        assignedUserId: regularUsers[0]?.id || '',
      });
    }
  }, [client, reset, regularUsers]);

  const onSubmit = (data: FormData) => {
    if (client) {
      updateClient(client.id, {
        name: data.name,
        description: data.description,
        status: data.status,
        assignedUserId: data.assignedUserId,
      });
      toast.success('Client modifié avec succès');
    } else {
      addClient({
        name: data.name,
        description: data.description,
        status: data.status,
        assignedUserId: data.assignedUserId,
      });
      toast.success('Client ajouté avec succès');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {client ? 'Modifier le client' : 'Ajouter un client'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" {...register('name', { required: true })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={3} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={(value) => setValue('status', value as WorkStatus)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un statut" />
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
          <div className="space-y-1.5">
            <Label htmlFor="user">Assigné à</Label>
            <Select value={assignedUserId} onValueChange={(value) => setValue('assignedUserId', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {regularUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="h-9">
              Annuler
            </Button>
            <Button type="submit" className="h-9">
              {client ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
