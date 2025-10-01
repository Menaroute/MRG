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
          <StatsCard title="Total Clients" value={totalClients} icon={Briefcase} />
          <StatsCard title="Terminés" value={doneClients} icon={CheckCircle2} />
          <StatsCard title="En cours" value={inProgressClients} icon={Clock} />
          <StatsCard title="Bloqués" value={blockedClients} icon={AlertCircle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des statuts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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
                <BarChart data={userWorkload}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="done" name="Terminés" fill="hsl(142, 76%, 36%)" />
                  <Bar dataKey="inProgress" name="En cours" fill="hsl(38, 92%, 50%)" />
                  <Bar dataKey="total" name="Total" fill="hsl(262, 83%, 58%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
