export type UserRole = 'admin' | 'user';

export type WorkStatus = 'todo' | 'in-progress' | 'done';

export type PeriodicityType = 'monthly' | 'quarterly' | 'bi-annually' | 'annually';

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
  assigned_user_id: string;
  periodicity: PeriodicityType;
  periodicity_months: number[];
  created_at: string;
  updated_at: string;
}

export interface ClientStatusHistory {
  id: string;
  client_id: string;
  user_id: string;
  old_status: WorkStatus | null;
  new_status: WorkStatus;
  changed_at: string;
  period_key: string;
}

export interface ClientPeriodData {
  id: string;
  client_id: string;
  period_key: string;
  status: WorkStatus;
  last_updated: string;
}

export const STATUS_LABELS: Record<WorkStatus, string> = {
  'todo': 'À faire',
  'in-progress': 'En cours',
  'done': 'Terminé',
};

export const STATUS_COLORS: Record<WorkStatus, string> = {
  'todo': 'hsl(220, 13%, 91%)',
  'in-progress': 'hsl(38, 92%, 50%)',
  'done': 'hsl(142, 76%, 36%)',
};

export const PERIODICITY_LABELS: Record<PeriodicityType, string> = {
  'monthly': 'Mensuel',
  'quarterly': 'Trimestriel',
  'bi-annually': 'Semestriel',
  'annually': 'Annuel',
};

export const MONTH_LABELS: Record<number, string> = {
  1: 'Janvier',
  2: 'Février',
  3: 'Mars',
  4: 'Avril',
  5: 'Mai',
  6: 'Juin',
  7: 'Juillet',
  8: 'Août',
  9: 'Septembre',
  10: 'Octobre',
  11: 'Novembre',
  12: 'Décembre',
};
