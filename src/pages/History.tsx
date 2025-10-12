import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Filter, X, RotateCcw, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ClientStatusHistory } from '@/types';
import { STATUS_LABELS, WorkStatus } from '@/types';
import { getPeriodLabel } from '@/utils/periodicity';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSessionStorage } from '@/hooks/use-session-storage';
import MonthRangeFilter from '@/components/MonthRangeFilter';
import { Input } from '@/components/ui/input';

interface MonthRange {
  start: { month: number; year: number };
  end: { month: number; year: number };
}

export default function History() {
  const { clients, profiles } = useData();
  const [history, setHistory] = useState<(ClientStatusHistory & { 
    client_name?: string; 
    user_name?: string;
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [monthRange, setMonthRange] = useState<MonthRange | null>(null);
  
  // History filters persisted for current session
  const [historyFilters, setHistoryFilters] = useSessionStorage('history.filters', {
    search: '',
    activeFilters: [] as string[],
    sort: { key: 'changed_at' as 'changed_at' | 'client_name' | 'user_name', dir: 'desc' as 'asc' | 'desc' },
  });

  // Ensure sort is always defined (for backward compatibility with old session storage)
  const sortState = historyFilters.sort || { key: 'changed_at' as const, dir: 'desc' as const };

  // Available filter options
  const filterColumns = [
    { type: 'assigned', label: 'Utilisateur', filterType: 'checkbox' },
    { type: 'client', label: 'Client', filterType: 'checkbox' },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleSort = (key: 'changed_at' | 'client_name' | 'user_name') => {
    setHistoryFilters({
      ...historyFilters,
      sort: {
        key,
        dir: sortState.key === key && sortState.dir === 'asc' ? 'desc' : 'asc',
      },
    });
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('client_status_history' as any)
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Enrich history with client and user names
      const enrichedHistory = ((data as any[]) || []).map((record: any) => {
        const client = clients.find(c => c.id === record.client_id);
        const user = profiles.find(p => p.id === record.user_id);
        return {
          ...record,
          client_name: client?.name || 'Client inconnu',
          user_name: user?.name || 'Utilisateur inconnu',
        } as ClientStatusHistory & { client_name?: string; user_name?: string };
      });

      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCheckboxValues = (columnType: string) => {
    const activeFilters = historyFilters.activeFilters || [];
    
    // Get active filters of the OTHER type (for cascading)
    const otherFilters = activeFilters.filter(f => !f.startsWith(`${columnType}:`));
    
    // Apply filters to get the relevant subset of history
    let relevantHistory = history;
    if (otherFilters.length > 0) {
      const filtersByType = otherFilters.reduce((acc, filter) => {
        const [type] = filter.split(':');
        if (!acc[type]) acc[type] = [];
        acc[type].push(filter);
        return acc;
      }, {} as Record<string, string[]>);
      
      relevantHistory = history.filter(h => {
        return Object.entries(filtersByType).every(([type, filters]) => {
          return filters.some(filter => {
            const parts = filter.split(':');
            const value = parts[1];
            
            if (type === 'assigned') {
              return h.user_id === value;
            }
            if (type === 'client') {
              return h.client_name === value;
            }
            
            return true;
          });
        });
      });
    }
    
    switch (columnType) {
      case 'assigned':
        const assignedUsers = [...new Set(relevantHistory.map(h => h.user_id).filter(Boolean))];
        return assignedUsers.map(userId => ({ 
          value: userId, 
          label: profiles.find(u => u.id === userId)?.name || 'Utilisateur inconnu'
        }));
      case 'client':
        const clientNames = [...new Set(relevantHistory.map(h => h.client_name).filter(Boolean))].sort();
        return clientNames.map(name => ({ 
          value: name, 
          label: name || 'Client inconnu'
        }));
      case 'oldStatus':
        const oldStatuses = [...new Set(relevantHistory.map(h => h.old_status).filter(Boolean))];
        return oldStatuses.map(status => ({
          value: status as string,
          label: STATUS_LABELS[status as WorkStatus]
        }));
      case 'newStatus':
        const newStatuses = [...new Set(relevantHistory.map(h => h.new_status).filter(Boolean))];
        return newStatuses.map(status => ({
          value: status,
          label: STATUS_LABELS[status as WorkStatus]
        }));
      default:
        return [];
    }
  };

  const toggleFilter = (filterType: string, filterValue: string) => {
    const filterKey = `${filterType}:${filterValue}`;
    const currentFilters = historyFilters.activeFilters || [];
    setHistoryFilters({
      ...historyFilters,
      activeFilters: currentFilters.includes(filterKey)
        ? currentFilters.filter(f => f !== filterKey)
        : [...currentFilters, filterKey]
    });
  };

  const removeFilter = (filterKey: string) => {
    setHistoryFilters({
      ...historyFilters,
      activeFilters: historyFilters.activeFilters.filter(f => f !== filterKey)
    });
  };

  const clearAllFilters = () => {
    setHistoryFilters({ ...historyFilters, activeFilters: [] });
  };

  const getFilterDisplayValue = (filterKey: string): string => {
    const parts = filterKey.split(':');
    const type = parts[0];
    const value = parts[1];

    if (type === 'assigned') {
      const user = profiles.find(u => u.id === value);
      return user?.name || value;
    }
    if (type === 'client') {
      return value;
    }
    if (type === 'oldStatus' || type === 'newStatus') {
      return STATUS_LABELS[value as WorkStatus];
    }
    
    return parts[1] || filterKey;
  };

  // Filter history based on active filters and month range
  const filteredHistory = useMemo(() => {
    const activeFilters = historyFilters.activeFilters || [];
    const searchTerm = (historyFilters.search || '').trim().toLowerCase();
    
    // First apply month range filter
    let filtered = history;
    if (monthRange) {
      filtered = history.filter(h => {
        const changeDate = new Date(h.changed_at);
        const changeMonth = changeDate.getMonth() + 1;
        const changeYear = changeDate.getFullYear();
        
        const historyDate = new Date(changeYear, changeMonth - 1);
        const startDate = new Date(monthRange.start.year, monthRange.start.month - 1);
        const endDate = new Date(monthRange.end.year, monthRange.end.month - 1);
        
        return historyDate >= startDate && historyDate <= endDate;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(h => {
        const searchableFields = [
          h.client_name || '',
          h.user_name || '',
          STATUS_LABELS[h.old_status as WorkStatus] || '',
          STATUS_LABELS[h.new_status as WorkStatus] || '',
          getPeriodLabel(h.period_key) || '',
          format(new Date(h.changed_at), 'PPp', { locale: fr })
        ];
        return searchableFields.some(field => field.toLowerCase().includes(searchTerm));
      });
    }
    
    // Then apply other filters
    if (activeFilters.length > 0) {
      // Group filters by type
      const filtersByType = activeFilters.reduce((acc, filter) => {
        const [type] = filter.split(':');
        if (!acc[type]) acc[type] = [];
        acc[type].push(filter);
        return acc;
      }, {} as Record<string, string[]>);
      
      filtered = filtered.filter(h => {
        return Object.entries(filtersByType).every(([type, filters]) => {
          return filters.some(filter => {
            const parts = filter.split(':');
            const value = parts[1];
            
            if (type === 'assigned') {
              return h.user_id === value;
            }
            if (type === 'client') {
              return h.client_name === value;
            }
            
            return true;
          });
        });
      });
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const { key, dir } = sortState;
      let av: string = '';
      let bv: string = '';
      
      if (key === 'changed_at') {
        av = a.changed_at;
        bv = b.changed_at;
      } else if (key === 'client_name') {
        av = a.client_name || '';
        bv = b.client_name || '';
      } else if (key === 'user_name') {
        av = a.user_name || '';
        bv = b.user_name || '';
      }
      
      const cmp = String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
    
    return sorted;
  }, [history, historyFilters.activeFilters, historyFilters.search, sortState, monthRange]);

  const getStatusBadgeVariant = (status: WorkStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'done':
        return 'default';
      case 'in-progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historique des modifications</h1>
            <p className="text-muted-foreground mt-2">
              Suivi de tous les changements de statut des clients
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher (client, utilisateur, statut, date...)"
                  value={historyFilters.search || ''}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                  className="h-9 max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <MonthRangeFilter value={monthRange} onChange={setMonthRange} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-9 ${(historyFilters.activeFilters || []).length > 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtres
                  {(historyFilters.activeFilters || []).length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {(historyFilters.activeFilters || []).length}
                    </Badge>
                  )}
                </Button>
                {(historyFilters.activeFilters || []).length > 0 && (
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
                    const hasActiveFilters = (historyFilters.activeFilters || []).some(f => f.startsWith(`${column.type}:`));
                    const activeFiltersForColumn = (historyFilters.activeFilters || []).filter(f => f.startsWith(`${column.type}:`));
                    
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
                          <div className="grid gap-1 space-y-1">
                            {getCheckboxValues(column.type).map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${column.type}-${option.value}`}
                                  checked={historyFilters.activeFilters?.includes(`${column.type}:${option.value}`)}
                                  onCheckedChange={() => toggleFilter(column.type, option.value)}
                                />
                                <Label
                                  htmlFor={`${column.type}-${option.value}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Chargement...</div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun historique disponible</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => toggleSort('changed_at')}
                      >
                        Date & Heure
                        {sortState.key === 'changed_at' ? (
                          sortState.dir === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => toggleSort('client_name')}
                      >
                        Client
                        {sortState.key === 'client_name' ? (
                          sortState.dir === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => toggleSort('user_name')}
                      >
                        Utilisateur
                        {sortState.key === 'user_name' ? (
                          sortState.dir === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Ancien Statut</TableHead>
                    <TableHead>Nouveau Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.changed_at), 'PPp', { locale: fr })}
                      </TableCell>
                      <TableCell>{record.client_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getPeriodLabel(record.period_key)}
                      </TableCell>
                      <TableCell>{record.user_name}</TableCell>
                      <TableCell>
                        {record.old_status ? (
                          <Badge variant={getStatusBadgeVariant(record.old_status as WorkStatus)}>
                            {STATUS_LABELS[record.old_status as WorkStatus]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.new_status as WorkStatus)}>
                          {STATUS_LABELS[record.new_status as WorkStatus]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

