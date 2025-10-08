import { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle2, Clock, AlertCircle, Filter, ChevronDown, X, RotateCcw } from 'lucide-react';
import { STATUS_LABELS, WorkStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSessionStorage } from '@/hooks/use-session-storage';
import MonthRangeFilter from '@/components/MonthRangeFilter';
import { supabase } from '@/integrations/supabase/client';

interface MonthRange {
  start: { month: number; year: number };
  end: { month: number; year: number };
}

export default function AdminDashboard() {
  const { clients, profiles } = useData();
  const [showFilters, setShowFilters] = useState(false);
  const [monthRange, setMonthRange] = useState<MonthRange | null>(null);
  
  // Dashboard filters persisted for current session
  const [dashboardFilters, setDashboardFilters] = useSessionStorage('admin.dashboard.filters', {
    activeFilters: [] as string[],
  });

  // Available filter options
  const filterColumns = [
    { type: 'assigned', label: 'Assigné à', filterType: 'checkbox' },
    { type: 'client', label: 'Client', filterType: 'checkbox' },
  ];

  const getCheckboxValues = (columnType: string) => {
    switch (columnType) {
      case 'assigned':
        const assignedUsers = [...new Set(clients.map(c => c.assigned_user_id).filter(Boolean))];
        return [
          ...assignedUsers.map(userId => ({ 
            value: userId, 
            label: profiles.find(u => u.id === userId)?.name || 'Utilisateur inconnu'
          })),
          { value: 'unassigned', label: 'Non assigné' },
        ];
      case 'client':
        const clientNames = [...new Set(clients.map(c => c.name).filter(Boolean))].sort();
        return clientNames.map(name => ({ 
          value: name, 
          label: name
        }));
      default:
        return [];
    }
  };

  const toggleFilter = (filterType: string, filterValue: string) => {
    const filterKey = `${filterType}:${filterValue}`;
    const currentFilters = dashboardFilters.activeFilters || [];
    setDashboardFilters({
      ...dashboardFilters,
      activeFilters: currentFilters.includes(filterKey)
        ? currentFilters.filter(f => f !== filterKey)
        : [...currentFilters, filterKey]
    });
  };

  const removeFilter = (filterKey: string) => {
    setDashboardFilters({
      ...dashboardFilters,
      activeFilters: dashboardFilters.activeFilters.filter(f => f !== filterKey)
    });
  };

  const clearAllFilters = () => {
    setDashboardFilters({
      ...dashboardFilters,
      activeFilters: []
    });
  };

  const getFilterDisplayValue = (filterKey: string) => {
    const parts = filterKey.split(':');
    const type = parts[0];
    
    if (type === 'assigned') {
      const value = parts[1];
      if (value === 'unassigned') return 'Non assigné';
      return profiles.find(u => u.id === value)?.name || 'Utilisateur inconnu';
    }
    
    if (type === 'client') {
      return parts[1];
    }
    
    return parts[1] || filterKey;
  };

  // Filter clients based on active filters and month range
  const filteredClients = useMemo(() => {
    const activeFilters = dashboardFilters.activeFilters || [];
    
    // First apply month range filter
    let filtered = clients;
    if (monthRange) {
      filtered = clients.filter(c => {
        // Check if client has activity within the selected date range
        const updatedDate = new Date(c.updated_at);
        const updatedMonth = updatedDate.getMonth() + 1; // 1-12
        const updatedYear = updatedDate.getFullYear();
        
        // Create date objects for comparison
        const clientDate = new Date(updatedYear, updatedMonth - 1);
        const startDate = new Date(monthRange.start.year, monthRange.start.month - 1);
        const endDate = new Date(monthRange.end.year, monthRange.end.month - 1);
        
        // Check if client's update date falls within the range
        return clientDate >= startDate && clientDate <= endDate;
      });
    }
    
    // Then apply other filters
    if (activeFilters.length === 0) {
      return filtered;
    }
    
    // Group filters by type
    const filtersByType = activeFilters.reduce((acc, filter) => {
      const [type] = filter.split(':');
      if (!acc[type]) acc[type] = [];
      acc[type].push(filter);
      return acc;
    }, {} as Record<string, string[]>);
    
    return filtered.filter(c => {
      // For each filter type, at least one filter must match (OR within type)
      // All filter types must have a match (AND across types)
      return Object.entries(filtersByType).every(([type, filters]) => {
        return filters.some(filter => {
        const parts = filter.split(':');
          const value = parts[1];
          
          if (type === 'assigned') {
          if (value === 'unassigned') {
            return !c.assigned_user_id;
          }
          return c.assigned_user_id === value;
        }
          
          if (type === 'client') {
            return c.name === value;
          }
        
        return true;
        });
      });
    });
  }, [clients, dashboardFilters.activeFilters, monthRange]);

  const totalClients = filteredClients.length;
  const doneClients = filteredClients.filter((c) => c.status === 'done').length;
  const inProgressClients = filteredClients.filter((c) => c.status === 'in-progress').length;
  const blockedClients = filteredClients.filter((c) => c.status === 'blocked').length;

  // Status distribution data (based on filtered clients)
  const statusData = Object.entries(
    filteredClients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<WorkStatus, number>)
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status as WorkStatus],
    value: count,
  }));

  // User workload data (based on filtered clients)
  const userWorkload = profiles
    .filter((u) => u.role === 'user')
    .map((user) => {
      const userClients = filteredClients.filter((c) => c.assigned_user_id === user.id);
      return {
        name: user.name,
        total: userClients.length,
        done: userClients.filter((c) => c.status === 'done').length,
        inProgress: userClients.filter((c) => c.status === 'in-progress').length,
      };
    });

  const COLORS = ['hsl(220, 13%, 75%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground mt-2">Vue d'ensemble de tous les projets</p>
          </div>
          <div className="flex items-center gap-2">
            <MonthRangeFilter value={monthRange} onChange={setMonthRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 ${(dashboardFilters.activeFilters || []).length > 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtres
            {(dashboardFilters.activeFilters || []).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {(dashboardFilters.activeFilters || []).length}
              </Badge>
            )}
          </Button>
            {(dashboardFilters.activeFilters || []).length > 0 && (
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
                const hasActiveFilters = (dashboardFilters.activeFilters || []).some(f => f.startsWith(`${column.type}:`));
                const activeFiltersForColumn = (dashboardFilters.activeFilters || []).filter(f => f.startsWith(`${column.type}:`));
                
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
                      <div className="space-y-1">
                        <div className="grid gap-1 space-y-1">
                          {getCheckboxValues(column.type).map((value) => {
                            const filterKey = `${column.type}:${value.value}`;
                            const isActive = (dashboardFilters.activeFilters || []).includes(filterKey);
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
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Clients" value={totalClients} icon={Briefcase} change={2.5} />
          <StatsCard title="Terminés" value={doneClients} icon={CheckCircle2} change={0.6} />
          <StatsCard title="En cours" value={inProgressClients} icon={Clock} change={-0.2} />
          <StatsCard title="Bloqués" value={blockedClients} icon={AlertCircle} change={0.1} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Distribution des statuts</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Charge de travail par utilisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={userWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="done" name="Terminés" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inProgress" name="En cours" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
