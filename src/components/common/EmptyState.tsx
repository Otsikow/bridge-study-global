import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "default" | "subtle" | "plain";
type EmptyStateAlignment = "center" | "start";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  action?: ReactNode;
  helperText?: string;
  className?: string;
  variant?: EmptyStateVariant;
  align?: EmptyStateAlignment;
  fullHeight?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<EmptyStateVariant, string> = {
  default:
    "rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/40 shadow-inner shadow-slate-950/20",
  subtle:
    "rounded-2xl border border-slate-800/40 bg-slate-900/30 shadow-inner shadow-slate-950/10",
  plain: "border-none bg-transparent shadow-none",
};

export const EmptyState = ({
  title,
  description,
  icon,
  imageSrc,
  imageAlt,
  action,
  helperText,
  className,
  variant = "default",
  align = "center",
  fullHeight = false,
  children,
}: EmptyStateProps) => {
  const alignment =
    align === "start"
      ? "items-start text-left"
      : "items-center text-center";

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-4 px-8 py-12",
        alignment,
        variantClasses[variant],
        fullHeight && "min-h-[260px]",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-slate-200",
            align === "start" && "h-10 w-10",
          )}
        >
          {icon}
        </div>
      ) : null}

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt ?? title}
          className={cn(
            "mx-auto h-32 w-auto object-contain md:h-40",
            align === "start" && "mx-0",
          )}
        />
      ) : null}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {description ? (
          <p className="text-sm text-slate-400">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-2">{action}</div> : null}

      {children ? <div className="space-y-3 text-sm text-slate-400">{children}</div> : null}

      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
};

export default EmptyState;
