import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState = ({ 
  message = 'Loading...', 
  showRetry = false, 
  onRetry,
  className = '',
  size = 'md'
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <p className="text-muted-foreground text-sm">{message}</p>
      {showRetry && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
};

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export const LoadingCard = ({ 
  message = 'Loading...', 
  className = '' 
}: LoadingCardProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <LoadingState message={message} />
      </CardContent>
    </Card>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton = ({ className = '', lines = 1 }: SkeletonProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted animate-pulse rounded"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }: { className?: string }) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton lines={2} />
          <div className="space-y-2">
            <Skeleton lines={1} />
            <Skeleton lines={1} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};