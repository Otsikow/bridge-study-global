import {
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState, EmptyStateProps } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  className?: string;
  resetKeys?: unknown[];
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorFallbackProps
  extends Pick<EmptyStateProps, "title" | "description" | "action" | "className" | "variant" | "helperText"> {
  icon?: ReactNode;
  error?: Error | null;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ErrorFallback = ({
  title = "We hit a snag",
  description = "Something went wrong while loading your data. Please try again.",
  icon,
  onRetry,
  error,
  showDetails = import.meta.env.DEV,
  action,
  className,
  variant = "default",
  helperText,
}: ErrorFallbackProps) => (
  <EmptyState
    title={title}
    description={description}
    icon={icon ?? <AlertTriangle className="h-6 w-6 text-destructive" />}
    variant={variant}
    className={cn("max-w-lg", className)}
    action={
      action ??
      (onRetry ? (
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      ) : null)
    }
    helperText={helperText}
  >
    {showDetails && error ? (
      <details className="mt-4 max-h-40 w-full overflow-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-left text-xs text-muted-foreground">
        <summary className="cursor-pointer text-slate-400">
          Technical details
        </summary>
        <pre className="mt-2 whitespace-pre-wrap">
          {error.message}
          {"\n"}
          {error.stack}
        </pre>
      </details>
    ) : null}
  </EmptyState>
);

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKeys && prevProps.resetKeys) {
      const changed =
        this.props.resetKeys.length !== prevProps.resetKeys.length ||
        this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);

      if (changed && this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  private resetErrorBoundary() {
    this.setState({ hasError: false, error: null });
  }

  private handleRetry = () => {
    this.resetErrorBoundary();
    this.props.onRetry?.();
  };

  render() {
    const { hasError, error } = this.state;
    const {
      children,
      title,
      description,
      icon,
      className,
      onRetry,
      showDetails,
    } = this.props;

    if (hasError) {
      return (
        <div className={cn("flex min-h-[280px] items-center justify-center p-6", className)}>
          <ErrorFallback
            title={title}
            description={description}
            icon={icon}
            onRetry={onRetry ? this.handleRetry : undefined}
            error={error}
            showDetails={showDetails}
            variant="subtle"
          />
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.displayName = "ErrorBoundary";
ErrorBoundary.Fallback = ErrorFallback;

export default ErrorBoundary;
