import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
  footer?: ReactNode;
}

const toneClasses: Record<Required<MetricCardProps>["tone"], string> = {
  default:
    "from-slate-900/60 via-slate-900/10 to-slate-950/60 border-slate-800/80 text-slate-100",
  success:
    "from-emerald-500/10 via-emerald-500/5 to-slate-950/60 border-emerald-500/40 text-emerald-100",
  warning:
    "from-amber-500/10 via-amber-500/5 to-slate-950/60 border-amber-500/40 text-amber-100",
  info: "from-blue-500/10 via-blue-500/5 to-slate-950/60 border-blue-500/40 text-blue-100",
};

export const MetricCard = ({
  label,
  value,
  description,
  icon,
  tone = "default",
  footer,
}: MetricCardProps) => {
  return (
    <Card
      className={cn(
        "h-full overflow-hidden rounded-2xl border bg-gradient-to-br shadow-lg shadow-slate-900/40",
        toneClasses[tone],
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium text-slate-300">
            {label}
          </CardTitle>
          {description ? (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="rounded-xl bg-slate-900/50 p-2 text-slate-200">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {footer ? <div className="mt-4 text-xs text-slate-300">{footer}</div> : null}
      </CardContent>
    </Card>
  );
};
