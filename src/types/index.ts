export type UserRole = 'admin' | 'user';

export type WorkStatus = 'todo' | 'in-progress' | 'done' | 'waiting' | 'blocked';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface Client {
  id: string;
  name: string;
  description?: string;
  status: WorkStatus;
  assignedUserId: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<WorkStatus, string> = {
  'todo': 'À faire',
  'in-progress': 'En cours',
  'done': 'Terminé',
  'waiting': 'En attente',
  'blocked': 'Bloqué',
};

export const STATUS_COLORS: Record<WorkStatus, string> = {
  'todo': 'hsl(220, 13%, 91%)',
  'in-progress': 'hsl(38, 92%, 50%)',
  'done': 'hsl(142, 76%, 36%)',
  'waiting': 'hsl(199, 89%, 48%)',
  'blocked': 'hsl(0, 84%, 60%)',
};
