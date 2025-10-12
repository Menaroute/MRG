import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { WorkStatus, STATUS_LABELS, PeriodicityType, PERIODICITY_LABELS, MONTH_LABELS, Client } from '@/types';
import { getDefaultMonths, getRequiredMonthCount, validateMonthSelection } from '@/utils/periodicity';

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
}

interface FormData {
  name: string;
  description: string;
  status: WorkStatus;
  assigned_user_id: string;
  periodicity: PeriodicityType;
}

export default function ClientFormDialog({ open, onClose, client }: ClientFormDialogProps) {
  const { addClient, updateClient, profiles } = useData();
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const status = watch('status');
  const assigned_user_id = watch('assigned_user_id');
  const periodicity = watch('periodicity');

  const regularUsers = profiles.filter((u) => u.role === 'user' || u.role === 'admin');

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name,
          description: client.description || '',
          status: client.status,
          assigned_user_id: client.assigned_user_id,
          periodicity: client.periodicity || 'monthly',
        });
        setSelectedMonths(client.periodicity_months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      } else {
        reset({
          name: '',
          description: '',
          status: 'todo',
          assigned_user_id: profiles[0]?.id || '',
          periodicity: 'monthly',
        });
        setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      }
    }
  }, [open, client, reset, profiles]);

  // Update selected months when periodicity changes
  useEffect(() => {
    if (periodicity) {
      const defaultMonths = getDefaultMonths(periodicity);
      setSelectedMonths(defaultMonths);
    }
  }, [periodicity]);

  const toggleMonth = (month: number) => {
    setSelectedMonths((prev) => {
      if (periodicity === 'monthly') {
        // Monthly should always have all months
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      }
      
      const requiredCount = getRequiredMonthCount(periodicity);
      
      if (prev.includes(month)) {
        return prev.filter((m) => m !== month);
      } else {
        const newMonths = [...prev, month];
        // Limit to required count
        if (newMonths.length > requiredCount) {
          return newMonths.slice(-requiredCount);
        }
        return newMonths;
      }
    });
  };

  const onSubmit = async (data: FormData) => {
    // Validate month selection
    if (!validateMonthSelection(data.periodicity, selectedMonths)) {
      alert(`Veuillez sélectionner ${getRequiredMonthCount(data.periodicity)} mois pour ${PERIODICITY_LABELS[data.periodicity]}`);
      return;
    }

    const clientData = {
      name: data.name,
      description: data.description,
      status: data.status,
      assigned_user_id: data.assigned_user_id,
      periodicity: data.periodicity,
      periodicity_months: selectedMonths.sort((a, b) => a - b),
    };

    if (client) {
      await updateClient(client.id, clientData);
    } else {
      await addClient(clientData);
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
            <Select value={assigned_user_id} onValueChange={(value) => setValue('assigned_user_id', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {regularUsers.length > 0 ? (
                  regularUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Aucun utilisateur disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="periodicity">Périodicité</Label>
            <Select value={periodicity} onValueChange={(value) => setValue('periodicity', value as PeriodicityType)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner une périodicité" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODICITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {periodicity && periodicity !== 'monthly' && (
            <div className="space-y-1.5">
              <Label>
                Mois concernés ({selectedMonths.length}/{getRequiredMonthCount(periodicity)})
              </Label>
              <div className="grid grid-cols-3 gap-2 p-3 border rounded-md max-h-48 overflow-y-auto">
                {Object.entries(MONTH_LABELS).map(([month, label]) => {
                  const monthNum = parseInt(month);
                  const isSelected = selectedMonths.includes(monthNum);
                  return (
                    <div key={month} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${month}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleMonth(monthNum)}
                      />
                      <Label
                        htmlFor={`month-${month}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {label}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {periodicity === 'quarterly' && 'Sélectionnez 4 mois (un par trimestre recommandé)'}
                {periodicity === 'bi-annually' && 'Sélectionnez 2 mois (un par semestre recommandé)'}
                {periodicity === 'annually' && 'Sélectionnez 1 mois'}
              </p>
            </div>
          )}
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
