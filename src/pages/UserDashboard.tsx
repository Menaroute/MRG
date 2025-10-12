import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import { STATUS_LABELS, WorkStatus } from '@/types';
import { isClientVisibleInCurrentPeriod } from '@/utils/periodicity';
import { usePeriodReset } from '@/hooks/use-period-reset';

export default function UserDashboard() {
  const { user } = useAuth();
  const { clients } = useData();
  
  // Check and reset periods for assigned clients
  usePeriodReset(clients.filter(c => c.assigned_user_id === user?.id), user?.id);

  // Filter clients to show only current period data
  const filteredClients = useMemo(() => {
    // Only show clients assigned to user and visible in current period
    return user 
      ? clients.filter(c => 
          c.assigned_user_id === user.id && 
          isClientVisibleInCurrentPeriod(c, false) // Users only see clients in their period
        ) 
      : [];
  }, [clients, user]);

  const totalClients = filteredClients.length;
  const todoClients = filteredClients.filter((c) => c.status === 'todo').length;
  const doneClients = filteredClients.filter((c) => c.status === 'done').length;
  const inProgressClients = filteredClients.filter((c) => c.status === 'in-progress').length;

  const statusData = Object.entries(
    filteredClients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<WorkStatus, number>)
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status as WorkStatus],
    value: count,
  }));

  const COLORS = ['hsl(220, 13%, 75%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)'];

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon tableau de bord</h1>
            <p className="text-muted-foreground mt-2">Vue d'ensemble de mes clients assignés</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Période actuelle</p>
            <p className="text-lg font-semibold capitalize">{currentMonth}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Mes Clients" value={totalClients} icon={Briefcase} change={2.5} />
          <StatsCard title="À faire" value={todoClients} icon={ListTodo} change={0} />
          <StatsCard title="En cours" value={inProgressClients} icon={Clock} change={-0.2} />
          <StatsCard title="Terminés" value={doneClients} icon={CheckCircle2} change={0.6} />
        </div>

        {statusData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Distribution de mes statuts</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
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
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-3 rounded-lg bg-muted/50 mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun client assigné</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Vous n'avez actuellement aucun client assigné. Contactez votre administrateur.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
