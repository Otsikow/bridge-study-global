import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    console.error('Error logged to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private getErrorMessage = (error: Error): string => {
    // Provide more specific error messages based on error type
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This usually happens when the app has been updated.';
    }
    
    if (error.message.includes('Permission denied') || error.message.includes('403')) {
      return 'You do not have permission to access this resource.';
    }
    
    if (error.message.includes('Not found') || error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.message.includes('Supabase') || error.message.includes('database')) {
      return 'Database connection failed. Please try again in a moment.';
    }
    
    // Default to showing the actual error message if it's user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  private getErrorTitle = (error: Error): string => {
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return 'Connection Error';
    }
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Loading Error';
    }
    
    if (error.message.includes('Permission denied') || error.message.includes('403')) {
      return 'Access Denied';
    }
    
    if (error.message.includes('Not found') || error.message.includes('404')) {
      return 'Not Found';
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'Session Expired';
    }
    
    return 'Something went wrong';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const errorMessage = error ? this.getErrorMessage(error) : 'An unexpected error occurred';
      const errorTitle = error ? this.getErrorTitle(error) : 'Error';
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">{errorTitle}</CardTitle>
              <CardDescription className="text-base">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Technical Details
                      </summary>
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>
              
              {!canRetry && (
                <div className="text-center text-sm text-muted-foreground">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    throw error; // This will be caught by the nearest ErrorBoundary
  };
};

export default ErrorBoundary;