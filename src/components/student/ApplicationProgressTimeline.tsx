import { Check, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationProgressTimelineProps {
  currentStatus: string;
  className?: string;
}

const statusStages = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'screening', label: 'Under Review' },
  { key: 'conditional_offer', label: 'Conditional Offer' },
  { key: 'unconditional_offer', label: 'Accepted' },
  { key: 'visa', label: 'Visa Stage' },
  { key: 'enrolled', label: 'Completed' },
];

const getStageIndex = (status: string): number => {
  const map: Record<string, number> = {
    draft: -1,
    submitted: 0,
    screening: 1,
    conditional_offer: 2,
    unconditional_offer: 3,
    cas_loa: 3,
    visa: 4,
    enrolled: 5,
    withdrawn: -1,
    deferred: -1,
  };
  return map[status] ?? -1;
};

export function ApplicationProgressTimeline({
  currentStatus,
  className,
}: ApplicationProgressTimelineProps) {
  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between">
        {statusStages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {index < statusStages.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 w-full h-0.5 -z-10',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{ left: '50%' }}
                />
              )}

              {/* Status circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all mb-2',
                  isCompleted &&
                    'bg-primary border-primary text-primary-foreground',
                  isCurrent &&
                    'bg-background border-primary text-primary animate-pulse',
                  isPending && 'bg-background border-muted text-muted-foreground'
                )}
              >
                {isCompleted && <Check className="h-5 w-5" />}
                {isCurrent && <Clock className="h-5 w-5" />}
                {isPending && <Circle className="h-4 w-4" />}
              </div>

              {/* Label */}
              <div
                className={cn(
                  'text-xs sm:text-sm text-center font-medium max-w-[90px] leading-tight',
                  (isCompleted || isCurrent) && 'text-foreground',
                  isPending && 'text-muted-foreground'
                )}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile-friendly version */}
      <div className="md:hidden mt-6 space-y-2">
        {statusStages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={stage.key}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-all',
                isCurrent && 'bg-primary/5 border border-primary'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0',
                  isCompleted &&
                    'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-background border-primary text-primary',
                  isPending && 'bg-background border-muted text-muted-foreground'
                )}
              >
                {isCompleted && <Check className="h-4 w-4" />}
                {isCurrent && <Clock className="h-4 w-4" />}
                {isPending && <Circle className="h-3 w-3" />}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  (isCompleted || isCurrent) && 'text-foreground',
                  isPending && 'text-muted-foreground'
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
