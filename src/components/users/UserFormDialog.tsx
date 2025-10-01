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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export default function UserFormDialog({ open, onClose, user }: UserFormDialogProps) {
  const { addUser, updateUser } = useData();
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>();

  const role = watch('role');

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
  }, [user, reset]);

  const onSubmit = (data: FormData) => {
    if (user) {
      const updates: Partial<User> = {
        name: data.name,
        email: data.email,
        role: data.role,
      };
      if (data.password) {
        updates.password = data.password;
      }
      updateUser(user.id, updates);
      toast.success('Utilisateur modifié avec succès');
    } else {
      addUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      toast.success('Utilisateur ajouté avec succès');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {user ? 'Mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password', { required: !user })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={(value) => setValue('role', value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {user ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
