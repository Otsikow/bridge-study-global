import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseError, AppError, ErrorDetails } from '@/lib/errorHandling';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

interface ErrorState {
  hasError: boolean;
  error: ErrorDetails | null;
  retryCount: number;
  isRetrying: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { showToast = true, logError = true, context } = options;
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const handleError = useCallback((error: unknown, customContext?: string) => {
    const errorDetails = parseError(error);
    const errorContext = customContext || context || 'Operation';
    
    if (logError) {
      console.error(`Error in ${errorContext}:`, error);
    }

    setErrorState(prev => ({
      hasError: true,
      error: errorDetails,
      retryCount: prev.retryCount,
      isRetrying: false,
    }));

    if (showToast) {
      toast({
        title: errorDetails.title,
        description: errorDetails.message,
        variant: 'destructive',
        action: errorDetails.retryable ? (
          <button
            onClick={() => retry()}
            className="inline-flex items-center gap-1 text-xs font-medium text-destructive-foreground hover:text-destructive-foreground/80"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        ) : undefined,
      });
    }

    return errorDetails;
  }, [showToast, logError, context, toast]);

  const retry = useCallback(async (retryFn?: () => Promise<void>) => {
    if (!errorState.error?.retryable) return;

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
    }));

    try {
      if (retryFn) {
        await retryFn();
      }
      
      setErrorState({
        hasError: false,
        error: null,
        retryCount: 0,
        isRetrying: false,
      });
    } catch (error) {
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isRetrying: false,
      }));
      handleError(error, 'Retry failed');
    }
  }, [errorState.error?.retryable, handleError]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  }, []);

  const reset = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  }, []);

  return {
    errorState,
    handleError,
    retry,
    clearError,
    reset,
    hasError: errorState.hasError,
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    canRetry: errorState.error?.retryable && errorState.retryCount < 3,
  };
};

// Hook for handling async operations with error handling
export const useAsyncOperation = <T>(
  operation: () => Promise<T>,
  options: UseErrorHandlerOptions = {}
) => {
  const errorHandler = useErrorHandler(options);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    errorHandler.clearError();

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (error) {
      errorHandler.handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operation, errorHandler]);

  const retry = useCallback(async () => {
    return errorHandler.retry(execute);
  }, [errorHandler, execute]);

  return {
    ...errorHandler,
    execute,
    retry,
    isLoading,
    data,
  };
};

// Hook for handling form submissions with error handling
export const useFormErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const errorHandler = useErrorHandler(options);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsSubmitting(true);
    errorHandler.clearError();

    try {
      const result = await submitFn();
      return result;
    } catch (error) {
      errorHandler.handleError(error, 'Form submission failed');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleSubmit,
    isSubmitting,
  };
};

// Component for displaying error states
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onClear,
  className = "" 
}: {
  error: ErrorDetails | null;
  onRetry?: () => void;
  onClear?: () => void;
  className?: string;
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-5 w-5" />;
      case 'auth':
        return <AlertTriangle className="h-5 w-5" />;
      case 'permission':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className={`rounded-lg border border-destructive/20 bg-destructive/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-destructive">
          {getErrorIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-destructive mb-1">
            {error.title}
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            {error.message}
          </p>
          {error.action && (
            <p className="text-xs text-muted-foreground mb-3">
              Suggested action: {error.action}
            </p>
          )}
          <div className="flex gap-2">
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </button>
            )}
            {onClear && (
              <button
                onClick={onClear}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};