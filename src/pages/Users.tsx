import { useMemo, useState } from 'react';
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
import { Trash2, Shield, User as UserIcon, Plus, Edit, KeyRound, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronDown, RotateCcw } from 'lucide-react';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

  // table controls persisted for current session
  const [tableState, setTableState] = useSessionStorage('users.table.state', {
    search: '',
    activeFilters: [] as string[],
    sort: { key: 'name' as 'name' | 'email' | 'role', dir: 'asc' as 'asc' | 'desc' },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [textFilterStates, setTextFilterStates] = useState<Record<string, { operator: string; value: string }>>({});

  const toggleSort = (key: 'name' | 'email' | 'role') => {
    setTableState({
      ...tableState,
      sort: {
        key,
        dir: tableState.sort.key === key && tableState.sort.dir === 'asc' ? 'desc' : 'asc',
      },
    });
  };

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

  // Available filter column types
  const filterColumns = [
    { type: 'name', label: 'Nom', filterType: 'text' },
    { type: 'email', label: 'Email', filterType: 'text' },
    { type: 'role', label: 'Rôle', filterType: 'checkbox' },
  ];

  // Text operators for text fields
  const textOperators = [
    { value: 'contains', label: 'Contient' },
    { value: 'equals', label: 'Égal à' },
    { value: 'startsWith', label: 'Commence par' },
    { value: 'endsWith', label: 'Finit par' },
  ];

  // Get available values for checkbox fields
  const getCheckboxValues = (columnType: string) => {
    switch (columnType) {
      case 'role':
        const roles = [...new Set(profiles.map(p => p.role || 'user'))];
        return roles.map(role => ({ 
          value: role, 
          label: role === 'admin' ? 'Admin' : 'Utilisateur' 
        }));
      default:
        return [];
    }
  };

  const filteredSortedProfiles = useMemo(() => {
    const term = tableState.search.trim().toLowerCase();
    const activeFilters = tableState.activeFilters || [];
    
    let filtered = profiles;
    
    // Apply search filter
    if (term) {
      filtered = filtered.filter(p =>
        [p.name, p.email].some(v => (v || '').toLowerCase().includes(term))
      );
    }
    
    // Apply active filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(p => {
        return activeFilters.every(filter => {
          const parts = filter.split(':');
          const type = parts[0];
          
          if (type === 'role') {
            const value = parts[1];
            return (p.role || 'user') === value;
          }
          
          if (type === 'name' || type === 'email') {
            const operator = parts[1];
            const value = parts[2];
            const fieldValue = (p as any)[type] || '';
            const searchValue = value.toLowerCase();
            
            switch (operator) {
              case 'contains':
                return fieldValue.toLowerCase().includes(searchValue);
              case 'equals':
                return fieldValue.toLowerCase() === searchValue;
              case 'startsWith':
                return fieldValue.toLowerCase().startsWith(searchValue);
              case 'endsWith':
                return fieldValue.toLowerCase().endsWith(searchValue);
              default:
                return true;
            }
          }
          
          return true;
        });
      });
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const { key, dir } = tableState.sort;
      const av = (key === 'role' ? (a.role || 'user') : (a as any)[key]) || '';
      const bv = (key === 'role' ? (b.role || 'user') : (b as any)[key]) || '';
      const cmp = String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
    
    return sorted;
  }, [profiles, tableState]);

  const toggleFilter = (filterType: string, filterValue: string, operator?: string) => {
    const filterKey = operator ? `${filterType}:${operator}:${filterValue}` : `${filterType}:${filterValue}`;
    const currentFilters = tableState.activeFilters || [];
    setTableState({
      ...tableState,
      activeFilters: currentFilters.includes(filterKey)
        ? currentFilters.filter(f => f !== filterKey)
        : [...currentFilters, filterKey]
    });
  };

  const applyTextFilter = (columnType: string) => {
    const filterState = textFilterStates[columnType];
    if (filterState && filterState.operator && filterState.value.trim()) {
      toggleFilter(columnType, filterState.value.trim(), filterState.operator);
      // Clear the text input after applying
      setTextFilterStates(prev => ({
        ...prev,
        [columnType]: { ...prev[columnType], value: '' }
      }));
    }
  };

  const updateTextFilterState = (columnType: string, field: 'operator' | 'value', newValue: string) => {
    setTextFilterStates(prev => ({
      ...prev,
      [columnType]: { ...prev[columnType], [field]: newValue }
    }));
  };

  const clearAllFilters = () => {
    setTableState({
      ...tableState,
      activeFilters: []
    });
  };

  const removeFilter = (filterKey: string) => {
    setTableState({
      ...tableState,
      activeFilters: tableState.activeFilters.filter(f => f !== filterKey)
    });
  };

  const getFilterDisplayValue = (filterKey: string) => {
    const parts = filterKey.split(':');
    const type = parts[0];
    
    if (type === 'role') {
      // For role, the value is directly after the type
      const value = parts[1];
      return value === 'admin' ? 'Admin' : 'Utilisateur';
    }
    
    if (type === 'name' || type === 'email') {
      // For text fields, we have type:operator:value
      const operator = parts[1];
      const value = parts[2];
      const operatorLabel = textOperators.find(op => op.value === operator)?.label || operator;
      return `${operatorLabel}: ${value}`;
    }
    
    return parts[1] || filterKey;
  };

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
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher par nom ou email"
                  value={tableState.search}
                  onChange={(e) => setTableState({ ...tableState, search: e.target.value })}
                  className="h-9 max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowFilters(!showFilters)}
                   className={`h-9 ${(tableState.activeFilters || []).length > 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
                 >
                   <Filter className="mr-2 h-4 w-4" />
                   Filtres
                   {(tableState.activeFilters || []).length > 0 && (
                     <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                       {(tableState.activeFilters || []).length}
                     </Badge>
                   )}
                 </Button>
                {(tableState.activeFilters || []).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-9 text-muted-foreground"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Effacer
                  </Button>
                )}
              </div>
            </div>
            
             {showFilters && (
               <div className="space-y-4">
                 <div className="flex flex-wrap gap-3">
                   {filterColumns.map((column) => {
                     const hasActiveFilters = (tableState.activeFilters || []).some(f => f.startsWith(`${column.type}:`));
                     const activeFiltersForColumn = (tableState.activeFilters || []).filter(f => f.startsWith(`${column.type}:`));
                     
                     return (
                       <Popover key={column.type}>
                         <PopoverTrigger asChild>
                           <button
                             type="button"
                             className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-8 px-3 ${hasActiveFilters ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'bg-gray-50 hover:bg-gray-100'}`}
                           >
                             {column.label}
                             {hasActiveFilters && (
                               <div className="ml-2 flex items-center gap-1">
                                 {activeFiltersForColumn.map((filterKey) => (
                                   <div key={filterKey} className="flex items-center gap-1 bg-white/20 text-white px-1 py-0.5 rounded text-xs">
                                     <span>{getFilterDisplayValue(filterKey)}</span>
                                     <span
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         removeFilter(filterKey);
                                       }}
                                       className="h-4 w-4 p-0 hover:opacity-70 inline-flex items-center justify-center cursor-pointer"
                                     >
                                       <X className="h-3 w-3" />
                                     </span>
                                   </div>
                                 ))}
                               </div>
                             )}
                             <ChevronDown className="ml-1 h-3 w-3" />
                           </button>
                         </PopoverTrigger>
                         <PopoverContent className="w-80 p-4" align="start">
                           {column.filterType === 'text' ? (
                             <div className="space-y-4">
                               <RadioGroup
                                 value={textFilterStates[column.type]?.operator || ''}
                                 onValueChange={(value) => updateTextFilterState(column.type, 'operator', value)}
                                 className="space-y-1"
                               >
                                 {textOperators.map((op) => (
                                   <div key={op.value} className="space-y-1">
                                     <div className="flex items-center space-x-2">
                                       <RadioGroupItem value={op.value} id={`${column.type}-${op.value}`} />
                                       <Label htmlFor={`${column.type}-${op.value}`} className="text-sm cursor-pointer">
                                         {op.label}
                                       </Label>
                                     </div>
                                     {textFilterStates[column.type]?.operator === op.value && (
                                       <div className="w-full">
                                         <Input
                                           placeholder={`Entrer ${column.label.toLowerCase()}`}
                                           className="h-8 w-full"
                                           value={textFilterStates[column.type]?.value || ''}
                                           onChange={(e) => updateTextFilterState(column.type, 'value', e.target.value)}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                               applyTextFilter(column.type);
                                             }
                                           }}
                                         />
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </RadioGroup>
                               
                               {/* Apply/Cancel buttons at the end */}
                               {textFilterStates[column.type]?.operator && (
                                 <div className="flex gap-2 pt-2 border-t">
                                   <Button
                                     size="sm"
                                     onClick={() => applyTextFilter(column.type)}
                                     className="flex-1 h-8"
                                     disabled={!textFilterStates[column.type]?.value?.trim()}
                                   >
                                     Appliquer
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => {
                                       setTextFilterStates(prev => ({
                                         ...prev,
                                         [column.type]: { operator: '', value: '' }
                                       }));
                                     }}
                                     className="flex-1 h-8"
                                   >
                                     Annuler
                                   </Button>
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="space-y-1">
                               <div className="grid gap-1 space-y-1">
                                 {getCheckboxValues(column.type).map((value) => {
                                   const filterKey = `${column.type}:${value.value}`;
                                   const isActive = (tableState.activeFilters || []).includes(filterKey);
                                   return (
                                     <div key={value.value} className="flex items-center space-x-2">
                                       <Checkbox
                                         id={`${column.type}-${value.value}`}
                                         checked={isActive}
                                         onCheckedChange={() => toggleFilter(column.type, value.value)}
                                       />
                                       <Label
                                         htmlFor={`${column.type}-${value.value}`}
                                         className="text-sm cursor-pointer flex-1"
                                       >
                                         {value.label}
                                       </Label>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           )}
                         </PopoverContent>
                       </Popover>
                     );
                   })}
                 </div>
               </div>
             )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    <div className="inline-flex items-center gap-1">
                      Nom
                      {tableState.sort.key !== 'name' ? (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : tableState.sort.dir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('email')}>
                    <div className="inline-flex items-center gap-1">
                      Email
                      {tableState.sort.key !== 'email' ? (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : tableState.sort.dir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('role')}>
                    <div className="inline-flex items-center gap-1">
                      Rôle
                      {tableState.sort.key !== 'role' ? (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : tableState.sort.dir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSortedProfiles.map((profile) => (
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
