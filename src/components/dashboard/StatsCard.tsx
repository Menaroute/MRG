import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: string;
}

export default function StatsCard({ title, value, icon: Icon, color = 'primary' }: StatsCardProps) {
  const colorClass = color === 'primary' ? 'text-primary' : `text-${color}`;
  const bgClass = color === 'primary' ? 'bg-primary/10' : `bg-${color}/10`;
  
  return (
    <Card className="hover:shadow-md transition-all hover:border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-semibold mt-2 tracking-tight">{value}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${bgClass}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
