import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavigatorStepStatus = "pending" | "active" | "complete";

export interface NavigatorStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  status: NavigatorStepStatus;
  aiHint: string;
  actionLabel: string;
  actionHref: string;
  icon: LucideIcon;
  lastUpdated?: string | null;
}

interface NextStepNavigatorProps {
  steps: NavigatorStep[];
  updatedAt?: string | null;
}

const statusCopy: Record<NavigatorStepStatus, { label: string; className: string }> = {
  pending: {
    label: "Waiting",
    className: "bg-muted text-muted-foreground",
  },
  active: {
    label: "In progress",
    className: "bg-primary/10 text-primary",
  },
  complete: {
    label: "Complete",
    className: "bg-success/10 text-success",
  },
};

export function NextStepNavigator({ steps, updatedAt }: NextStepNavigatorProps) {
  if (!steps.length) return null;

  const liveLabel = updatedAt
    ? `Live • Updated ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}`
    : "Live";

  return (
    <Card className="border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/60" />
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Next Step Navigator
            </CardTitle>
            <CardDescription>
              Real-time checklist intelligence that nudges you toward the next admission milestone.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">
            {liveLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {steps.map((step) => {
            const StatusIcon = step.icon;
            const state = statusCopy[step.status];

            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-xl border bg-background/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all",
                  step.completed ? "border-success/40" : "hover:border-primary/40"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div
                    className={cn(
                      "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border",
                      step.completed
                        ? "border-success/30 bg-success/10 text-success"
                        : step.status === "active"
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold leading-tight">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Badge variant="secondary" className={state.className}>
                        {step.completed ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> {state.label}
                          </span>
                        ) : step.status === "active" ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" /> {state.label}
                          </span>
                        ) : (
                          state.label
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-primary/80">{step.aiHint}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button asChild variant={step.completed ? "outline" : "default"} size="sm">
                        <Link to={step.actionHref}>{step.actionLabel}</Link>
                      </Button>
                      {step.lastUpdated && (
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(step.lastUpdated), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
