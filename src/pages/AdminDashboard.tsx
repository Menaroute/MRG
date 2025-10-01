import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { STATUS_LABELS, WorkStatus } from '@/types';

export default function AdminDashboard() {
  const { clients, users } = useData();

  const totalClients = clients.length;
  const doneClients = clients.filter((c) => c.status === 'done').length;
  const inProgressClients = clients.filter((c) => c.status === 'in-progress').length;
  const blockedClients = clients.filter((c) => c.status === 'blocked').length;

  // Status distribution data
  const statusData = Object.entries(
    clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<WorkStatus, number>)
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status as WorkStatus],
    value: count,
  }));

  // User workload data
  const userWorkload = users
    .filter((u) => u.role === 'user')
    .map((user) => {
      const userClients = clients.filter((c) => c.assignedUserId === user.id);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2">Vue d'ensemble de tous les projets</p>
        </div>

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
