import { useMemo, useState } from 'react';
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
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronDown, RotateCcw } from 'lucide-react';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { Client, STATUS_LABELS, PERIODICITY_LABELS } from '@/types';
import MonthRangeFilter from '@/components/MonthRangeFilter';
import { isClientRelevantForMonthRange } from '@/utils/periodicity';

interface MonthRange {
  start: { month: number; year: number };
  end: { month: number; year: number };
}
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Clients() {
  const { clients, profiles, deleteClient } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [tableState, setTableState] = useSessionStorage('clients.table.state', {
    search: '',
    activeFilters: [] as string[],
    sort: { key: 'name' as 'name' | 'status' | 'assigned' | 'periodicity', dir: 'asc' as 'asc' | 'desc' },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [monthRange, setMonthRange] = useState<MonthRange | null>(null);
  const [textFilterStates, setTextFilterStates] = useState<Record<string, { operator: string; value: string }>>({});

  const toggleSort = (key: 'name' | 'status' | 'assigned' | 'periodicity') => {
    setTableState({
      ...tableState,
      sort: {
        key,
        dir: tableState.sort.key === key && tableState.sort.dir === 'asc' ? 'desc' : 'asc',
      },
    });
  };

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
  // Available filter column types
  const filterColumns = [
    { type: 'name', label: 'Nom', filterType: 'text' },
    { type: 'description', label: 'Description', filterType: 'text' },
    { type: 'status', label: 'Statut', filterType: 'checkbox' },
    { type: 'assigned', label: 'Assigné à', filterType: 'checkbox' },
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
      case 'status':
        const statuses = [...new Set(clients.map(c => c.status))];
        return statuses.map(status => ({ 
          value: status, 
          label: STATUS_LABELS[status as keyof typeof STATUS_LABELS] 
        }));
      case 'assigned':
        const assignedUsers = [...new Set(clients.map(c => c.assigned_user_id).filter(Boolean))];
        return [
          ...assignedUsers.map(userId => ({ 
            value: userId, 
            label: getUserName(userId) 
          })),
          { value: 'unassigned', label: 'Non assigné' },
        ];
      default:
        return [];
    }
  };

  const filteredSortedClients = useMemo(() => {
    const term = tableState.search.trim().toLowerCase();
    const activeFilters = tableState.activeFilters || [];
    
    let filtered = clients;
    
    // Apply month range filter based on periodicity
    if (monthRange) {
      filtered = clients.filter(c => {
        // Check if client is relevant for the selected month range based on its periodicity
        return isClientRelevantForMonthRange(
          c,
          monthRange.start.month,
          monthRange.start.year,
          monthRange.end.month,
          monthRange.end.year
        );
      });
    }
    
    // Apply search filter
    if (term) {
      filtered = filtered.filter(c => 
        [c.name, c.description || '', getUserName(c.assigned_user_id)].some(v => v.toLowerCase().includes(term))
      );
    }
    
    // Apply active filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(c => {
        return activeFilters.every(filter => {
          const parts = filter.split(':');
          const type = parts[0];
          
          if (type === 'status') {
            const value = parts[1];
            return c.status === value;
          }
          
          if (type === 'assigned') {
            const value = parts[1];
            if (value === 'unassigned') {
              return !c.assigned_user_id;
            }
            return c.assigned_user_id === value;
          }
          
          if (type === 'name' || type === 'description') {
            const operator = parts[1];
            const value = parts[2];
            const fieldValue = (c as any)[type] || '';
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
      let av: string = '';
      let bv: string = '';
      if (key === 'status') {
        av = STATUS_LABELS[a.status];
        bv = STATUS_LABELS[b.status];
      } else if (key === 'assigned') {
        av = getUserName(a.assigned_user_id);
        bv = getUserName(b.assigned_user_id);
      } else if (key === 'periodicity') {
        av = PERIODICITY_LABELS[a.periodicity];
        bv = PERIODICITY_LABELS[b.periodicity];
      } else {
        av = a.name;
        bv = b.name;
      }
      const cmp = String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
    
    return sorted;
  }, [clients, profiles, tableState, monthRange]);

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
    
    if (type === 'status') {
      // For status, the value is directly after the type
      const value = parts[1];
      return STATUS_LABELS[value as keyof typeof STATUS_LABELS] || value;
    }
    
    if (type === 'assigned') {
      // For assigned, the value is directly after the type
      const value = parts[1];
      if (value === 'unassigned') return 'Non assigné';
      return getUserName(value);
    }
    
    if (type === 'name' || type === 'description') {
      // For text fields, we have type:operator:value
      const operator = parts[1];
      const value = parts[2];
      const operatorLabel = textOperators.find(op => op.value === operator)?.label || operator;
      return `${operatorLabel}: ${value}`;
    }
    
    return parts[1] || filterKey;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'todo': 'secondary',
      'in-progress': 'default',
      'done': 'default',
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
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher (nom, description, assigné)"
                  value={tableState.search}
                  onChange={(e) => setTableState({ ...tableState, search: e.target.value })}
                  className="h-9 max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                 <MonthRangeFilter value={monthRange} onChange={setMonthRange} defaultPreset="all-time" />
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
                  <TableHead>Description</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <div className="inline-flex items-center gap-1">
                      Statut
                      {tableState.sort.key !== 'status' ? (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : tableState.sort.dir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('assigned')}>
                    <div className="inline-flex items-center gap-1">
                      Assigné à
                      {tableState.sort.key !== 'assigned' ? (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : tableState.sort.dir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('periodicity')}>
                    <div className="inline-flex items-center gap-1">
                      Périodicité
                      {tableState.sort.key !== 'periodicity' ? (
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
                {filteredSortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{client.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(client.status) as any}>
                        {STATUS_LABELS[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{getUserName(client.assigned_user_id)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {client.periodicity ? PERIODICITY_LABELS[client.periodicity] : 'Mensuel'}
                      </span>
                    </TableCell>
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
