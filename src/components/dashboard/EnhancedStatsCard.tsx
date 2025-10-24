import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  progress?: {
    current: number;
    target: number;
    label: string;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

export function EnhancedStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  progress,
  badge,
  className = ''
}: EnhancedStatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return Minus;
    return trend.isPositive ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    return trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="relative">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {badge && (
            <Badge 
              variant={badge.variant} 
              className="absolute -top-2 -right-2 text-xs"
            >
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        
        {trend && (
          <div className="flex items-center space-x-1 text-xs">
            <TrendIcon className={`h-3 w-3 ${getTrendColor()}`} />
            <span className={getTrendColor()}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">
              {trend.period}
            </span>
          </div>
        )}

        {progress && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{progress.label}</span>
              <span className="font-medium">
                {progress.current}/{progress.target}
              </span>
            </div>
            <Progress 
              value={(progress.current / progress.target) * 100} 
              className="h-2" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
