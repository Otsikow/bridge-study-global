import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export interface LoadingSpinnerProps {
  message?: string;
  icon?: ReactNode;
  size?: SpinnerSize;
  className?: string;
  fullHeight?: boolean;
  subtle?: boolean;
}

export const LoadingSpinner = ({
  message,
  icon,
  size = "md",
  className,
  fullHeight = false,
  subtle = false,
}: LoadingSpinnerProps) => {
  const SpinnerIcon = icon ?? Loader2;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        subtle ? "text-muted-foreground" : "text-primary",
        fullHeight && "min-h-[260px]",
        className,
      )}
    >
      <SpinnerIcon
        className={cn(
          "animate-spin",
          subtle ? "text-muted-foreground/80" : "text-primary",
          sizeClasses[size],
        )}
        aria-hidden="true"
      />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
};

export default LoadingSpinner;
