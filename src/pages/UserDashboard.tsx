import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { STATUS_LABELS, WorkStatus } from '@/types';

export default function UserDashboard() {
  const { currentUser } = useAuth();
  const { getUserClients } = useData();

  const myClients = currentUser ? getUserClients(currentUser.id) : [];
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
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Mon tableau de bord</h2>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de mes clients assignés</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Mes Clients" value={totalClients} icon={Briefcase} />
          <StatsCard title="Terminés" value={doneClients} icon={CheckCircle2} />
          <StatsCard title="En cours" value={inProgressClients} icon={Clock} />
          <StatsCard title="Bloqués" value={blockedClients} icon={AlertCircle} />
        </div>

        {statusData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Distribution de mes statuts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun client assigné</h3>
              <p className="text-muted-foreground">
                Vous n'avez actuellement aucun client assigné. Contactez votre administrateur.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
