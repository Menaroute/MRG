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
    <Card className="hover:border-border transition-all">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
              {isPositive ? '+' : ''}{change}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
