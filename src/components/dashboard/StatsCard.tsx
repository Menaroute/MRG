import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  change?: number;
  color?: string;
}

export default function StatsCard({ title, value, icon: Icon, change, color = 'muted-foreground' }: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <Card className="hover:shadow-sm transition-all border-border/40">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Icon className={`h-5 w-5 text-${color}`} />
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
