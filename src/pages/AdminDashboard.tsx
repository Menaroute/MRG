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
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Tableau de bord</h2>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de tous les projets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Clients" value={totalClients} icon={Briefcase} change={2.5} color="muted-foreground" />
          <StatsCard title="Terminés" value={doneClients} icon={CheckCircle2} change={0.6} color="success" />
          <StatsCard title="En cours" value={inProgressClients} icon={Clock} change={-0.2} color="warning" />
          <StatsCard title="Bloqués" value={blockedClients} icon={AlertCircle} change={0.1} color="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des statuts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid hsl(214, 32%, 91%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charge de travail par utilisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userWorkload} style={{ fontFamily: 'Inter, sans-serif' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 13 }}
                    axisLine={{ stroke: 'hsl(214, 32%, 91%)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid hsl(214, 32%, 91%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    cursor={{ fill: 'hsl(214, 32%, 96%)' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '13px', fontFamily: 'Inter, sans-serif' }}
                    iconType="circle"
                  />
                  <Bar dataKey="done" name="Terminés" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inProgress" name="En cours" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="Total" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
