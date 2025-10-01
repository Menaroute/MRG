import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { STATUS_LABELS, WorkStatus } from '@/types';

export default function UserDashboard() {
  const { user } = useAuth();
  const { clients } = useData();

  const myClients = user ? clients.filter(c => c.assigned_user_id === user.id) : [];
  const totalClients = myClients.length;
  const doneClients = myClients.filter((c) => c.status === 'done').length;
  const inProgressClients = myClients.filter((c) => c.status === 'in-progress').length;
  const blockedClients = myClients.filter((c) => c.status === 'blocked').length;

  const statusData = Object.entries(
    myClients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<WorkStatus, number>)
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status as WorkStatus],
    value: count,
  }));

  const COLORS = ['hsl(220, 13%, 75%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon tableau de bord</h1>
          <p className="text-muted-foreground mt-2">Vue d'ensemble de mes clients assignés</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Mes Clients" value={totalClients} icon={Briefcase} change={2.5} />
          <StatsCard title="Terminés" value={doneClients} icon={CheckCircle2} change={0.6} />
          <StatsCard title="En cours" value={inProgressClients} icon={Clock} change={-0.2} />
          <StatsCard title="Bloqués" value={blockedClients} icon={AlertCircle} change={0.1} />
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
