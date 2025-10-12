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
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronDown, RotateCcw, Upload, Download, FileDown } from 'lucide-react';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Client, STATUS_LABELS, PERIODICITY_LABELS } from '@/types';
import MonthRangeFilter from '@/components/MonthRangeFilter';
import { isClientRelevantForMonthRange } from '@/utils/periodicity';
import { supabase } from '@/integrations/supabase/client';

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
  const { clients, profiles, deleteClient, addClient, refreshData } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Mapping from French CSV headers to English database fields
  const csvFieldMapping: Record<string, string> = {
    'nom': 'name',
    'description': 'description',
    'statut': 'status',
    'email_utilisateur': 'assigned_user_email',
    'periodicite': 'periodicity',
    'mois_periodicite': 'periodicity_months',
  };

  // Mapping for status values (French to English)
  const statusMapping: Record<string, string> = {
    'a_faire': 'todo',
    'en_cours': 'in-progress',
    'termine': 'done',
  };

  // Mapping for periodicity values (French to English)
  const periodicityMapping: Record<string, string> = {
    'mensuel': 'monthly',
    'trimestriel': 'quarterly',
    'semestriel': 'bi-annually',
    'annuel': 'annually',
  };

  const downloadSampleCSV = () => {
    const csvContent = `nom,description,statut,email_utilisateur,periodicite,mois_periodicite
Client Exemple 1,Description du client 1,a_faire,user@example.com,mensuel,"1,2,3,4,5,6,7,8,9,10,11,12"
Client Exemple 2,Description du client 2,en_cours,user@example.com,trimestriel,"1,4,7,10"
Client Exemple 3,Description du client 3,termine,user@example.com,semestriel,"1,7"
Client Exemple 4,Description du client 4,a_faire,user@example.com,annuel,1`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_clients.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setCsvFile(file);
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      toast.error('Le fichier CSV est vide ou invalide');
      setCsvFile(null);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const preview = lines.slice(1, 6).map(line => {
      const values = parseCSVLine(line);
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index]?.trim() || '';
        return obj;
      }, {} as any);
    });

    setCsvPreview(preview);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleImportCSV = async () => {
    if (!csvFile) return;

    // Close dialog immediately
    setImportDialogOpen(false);
    const file = csvFile;
    setCsvFile(null);
    setCsvPreview([]);
    
    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const totalRows = lines.length - 1;
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Show initial progress toast
      const toastId = toast.loading(`Importation: 0 sur ${totalRows} clients...`);

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const rawRow = headers.reduce((obj, header, index) => {
            obj[header] = values[index]?.trim().replace(/^"|"$/g, '') || '';
            return obj;
          }, {} as any);

          // Map French headers to English fields
          const row: any = {};
          headers.forEach((header, index) => {
            const englishField = csvFieldMapping[header] || header;
            row[englishField] = rawRow[header];
          });

          // Validate required fields
          if (!row.name) {
            errors.push(`Ligne ${i + 1}: Le nom est requis`);
            errorCount++;
            toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
            continue;
          }

          // Find user by email
          const user = profiles.find(p => p.email === row.assigned_user_email);
          if (!user) {
            errors.push(`Ligne ${i + 1}: Utilisateur non trouvé (${row.assigned_user_email})`);
            errorCount++;
            toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
            continue;
          }

          // Map and validate status
          let status = row.status.toLowerCase();
          if (statusMapping[status]) {
            status = statusMapping[status];
          }
          const validStatuses = ['todo', 'in-progress', 'done'];
          if (!validStatuses.includes(status)) {
            errors.push(`Ligne ${i + 1}: Statut invalide (${row.status})`);
            errorCount++;
            toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
            continue;
          }

          // Map and validate periodicity
          let periodicity = row.periodicity.toLowerCase();
          if (periodicityMapping[periodicity]) {
            periodicity = periodicityMapping[periodicity];
          }
          const validPeriodicities = ['monthly', 'quarterly', 'bi-annually', 'annually'];
          if (!validPeriodicities.includes(periodicity)) {
            errors.push(`Ligne ${i + 1}: Périodicité invalide (${row.periodicity})`);
            errorCount++;
            toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
            continue;
          }

          // Parse periodicity_months
          const periodicityMonths = row.periodicity_months
            .split(',')
            .map((m: string) => parseInt(m.trim()))
            .filter((m: number) => !isNaN(m) && m >= 1 && m <= 12);

          if (periodicityMonths.length === 0) {
            errors.push(`Ligne ${i + 1}: Mois de périodicité invalides`);
            errorCount++;
            toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
            continue;
          }

          // Insert client directly to database (batch mode)
          const { error: insertError } = await supabase
            .from('clients')
            .insert([{
              name: row.name,
              description: row.description || '',
              status: status,
              assigned_user_id: user.id,
              periodicity: periodicity,
              periodicity_months: periodicityMonths.sort((a: number, b: number) => a - b),
            }]);

          if (insertError) {
            throw insertError;
          }

          successCount++;
          toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
        } catch (error: any) {
          errors.push(`Ligne ${i + 1}: ${error.message}`);
          errorCount++;
          toast.loading(`Importation: ${i} sur ${totalRows} clients...`, { id: toastId });
        }
      }

      // Refresh data once at the end
      if (successCount > 0) {
        await refreshData();
      }

      // Dismiss loading toast and show final results
      toast.dismiss(toastId);
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`${successCount} client(s) importé(s) avec succès`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`${successCount} client(s) importé(s) avec succès`);
        toast.error(`${errorCount} erreur(s) détectée(s). Consultez la console pour plus de détails.`);
        console.error('Erreurs d\'importation:', errors);
      } else if (errorCount > 0) {
        toast.error(`${errorCount} erreur(s) détectée(s). Aucun client importé. Consultez la console pour plus de détails.`);
        console.error('Erreurs d\'importation:', errors);
      }
    } catch (error: any) {
      toast.error('Erreur lors de l\'importation: ' + error.message);
      setImporting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Description', 'Statut', 'Assigné à', 'Périodicité', 'Mois de périodicité'];
    const rows = filteredSortedClients.map(client => [
      client.name,
      client.description || '',
      STATUS_LABELS[client.status],
      getUserName(client.assigned_user_id),
      PERIODICITY_LABELS[client.periodicity],
      client.periodicity_months?.join(', ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${filteredSortedClients.length} client(s) exporté(s) en CSV`);
  };

  const exportToPDF = () => {
    // Create a simple HTML table for PDF export
    const tableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Export Clients - ${new Date().toLocaleDateString('fr-FR')}</title>
        <style>
          @media print {
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
          .info { color: #666; font-size: 14px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Export des Clients</h1>
        <div class="info">
          <p>Exporté le: ${new Date().toLocaleString('fr-FR')}</p>
          <p>Total: ${filteredSortedClients.length} client(s)</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Assigné à</th>
              <th>Périodicité</th>
              <th>Mois</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSortedClients.map(client => `
              <tr>
                <td>${client.name}</td>
                <td>${client.description || '-'}</td>
                <td>${STATUS_LABELS[client.status]}</td>
                <td>${getUserName(client.assigned_user_id)}</td>
                <td>${PERIODICITY_LABELS[client.periodicity]}</td>
                <td>${client.periodicity_months?.join(', ') || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([tableHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      toast.success(`Dialogue d'impression ouvert - Sélectionnez "Enregistrer au format PDF"`);
    } else {
      toast.error('Impossible d\'ouvrir la fenêtre. Veuillez autoriser les popups.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Clients</h2>
            <p className="text-muted-foreground mt-1">Gérer les clients et leurs statuts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="h-9">
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          <Button onClick={() => setDialogOpen(true)} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un client
          </Button>
          </div>
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

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Importer des clients depuis CSV</DialogTitle>
              <DialogDescription>
                Importez plusieurs clients à la fois en utilisant un fichier CSV
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {!csvFile ? (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                      ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                    `}
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-base font-medium mb-2">
                      Glissez-déposez votre fichier CSV ici
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ou cliquez pour sélectionner un fichier
                    </p>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Besoin d'un modèle ?{' '}
                    <button 
                      onClick={downloadSampleCSV}
                      className="text-primary underline hover:text-primary/80 font-medium"
                    >
                      Télécharger le fichier CSV exemple
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">{csvFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null);
                        setCsvPreview([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="space-y-2">
                      <Label>Aperçu des données (5 premières lignes)</Label>
                      <div className="border rounded-lg overflow-auto max-h-60">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Nom</TableHead>
                              <TableHead className="text-xs">Description</TableHead>
                              <TableHead className="text-xs">Statut</TableHead>
                              <TableHead className="text-xs">Email Utilisateur</TableHead>
                              <TableHead className="text-xs">Périodicité</TableHead>
                              <TableHead className="text-xs">Mois</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvPreview.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">{row.nom || '-'}</TableCell>
                                <TableCell className="text-xs">{row.description || '-'}</TableCell>
                                <TableCell className="text-xs">{row.statut || '-'}</TableCell>
                                <TableCell className="text-xs">{row.email_utilisateur || '-'}</TableCell>
                                <TableCell className="text-xs">{row.periodicite || '-'}</TableCell>
                                <TableCell className="text-xs">{row.mois_periodicite || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setImportDialogOpen(false);
                      setCsvFile(null);
                      setCsvPreview([]);
                    }}>
                      Annuler
                    </Button>
                    <Button onClick={handleImportCSV}>
                      Importer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
