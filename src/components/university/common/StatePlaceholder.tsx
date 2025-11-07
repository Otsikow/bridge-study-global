import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatePlaceholderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const StatePlaceholder = ({
  title,
  description,
  icon,
  action,
  className,
}: StatePlaceholderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-8 py-12 text-center shadow-inner shadow-slate-900/40",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-slate-400">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
};
