import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BellRing,
  CalendarClock,
  FileWarning,
  Send,
  TimerReset,
  X,
  type LucideIcon,
} from 'lucide-react';

export type ApplicationNudgeType = 'deadline' | 'documents' | 'submission' | 'stalled';
export type ApplicationNudgeSeverity = 'high' | 'medium' | 'low';

export interface ApplicationNudge {
  id: string;
  fingerprint: string;
  applicationId: string;
  type: ApplicationNudgeType;
  title: string;
  description: string;
  severity: ApplicationNudgeSeverity;
  actionLabel?: string;
  actionHref?: string;
  dueDateLabel?: string;
  daysRemaining?: number | null;
}

interface ApplicationDeadlineNudgesProps {
  nudges: ApplicationNudge[];
  onDismiss: (fingerprint: string) => void;
  className?: string;
}

const severityMeta: Record<
  ApplicationNudgeSeverity,
  { label: string; badgeClass: string; containerClass: string }
> = {
  high: {
    label: 'Urgent',
    badgeClass: 'bg-destructive/15 text-destructive border-destructive/50',
    containerClass: 'border-destructive/60 bg-destructive/5',
  },
  medium: {
    label: 'Action needed',
    badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    containerClass: 'border-amber-500/50 bg-amber-500/5',
  },
  low: {
    label: 'Reminder',
    badgeClass: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
    containerClass: 'border-blue-500/40 bg-blue-500/5',
  },
};

const typeMeta: Record<ApplicationNudgeType, { label: string; icon: LucideIcon }> = {
  deadline: { label: 'Deadline', icon: CalendarClock },
  documents: { label: 'Documents', icon: FileWarning },
  submission: { label: 'Submission', icon: Send },
  stalled: { label: 'Follow-up', icon: TimerReset },
};

export default function ApplicationDeadlineNudges({
  nudges,
  onDismiss,
  className,
}: ApplicationDeadlineNudgesProps) {
  if (nudges.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-l-4 border-primary/70 shadow-lg', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Proactive Nudges</CardTitle>
        <p className="text-sm text-muted-foreground">
          Stay ahead of deadlines with prioritized reminders tailored to each application.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {nudges.map((nudge) => {
          const severityInfo = severityMeta[nudge.severity];
          const typeInfo = typeMeta[nudge.type] ?? { label: 'Update', icon: BellRing };
          const TypeIcon = typeInfo.icon;

          const dueDateCopy =
            typeof nudge.daysRemaining === 'number'
              ? nudge.daysRemaining < 0
                ? `${Math.abs(nudge.daysRemaining)} day${Math.abs(nudge.daysRemaining) === 1 ? '' : 's'} overdue`
                : `${nudge.daysRemaining} day${nudge.daysRemaining === 1 ? '' : 's'} remaining`
              : null;

          return (
            <div
              key={nudge.fingerprint}
              className={cn(
                'flex flex-col gap-3 rounded-xl border px-4 py-4 md:flex-row md:items-start md:gap-4 md:px-5 md:py-5',
                severityInfo.containerClass
              )}
            >
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-[11px] uppercase tracking-wide', severityInfo.badgeClass)}
                  >
                    {severityInfo.label}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] flex items-center gap-1 capitalize">
                    <TypeIcon className="h-3.5 w-3.5" />
                    {typeInfo.label}
                  </Badge>
                  {nudge.dueDateLabel && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {dueDateCopy ? `${nudge.dueDateLabel} • ${dueDateCopy}` : nudge.dueDateLabel}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="hidden sm:block">
                    <TypeIcon className="h-5 w-5 text-primary/80" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold leading-tight">{nudge.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{nudge.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-2 md:flex-col md:items-end md:gap-3">
                {nudge.actionHref && (
                  <Button asChild size="sm" className="w-full md:w-auto">
                    <Link to={nudge.actionHref}>{nudge.actionLabel ?? 'Open'}</Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(nudge.fingerprint)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Dismiss
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
