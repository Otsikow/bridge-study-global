import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service if configured
    // Example: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription className="mt-2">
                    We encountered an error while rendering this page.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
                  <p className="font-semibold text-destructive">Error Details:</p>
                  <p className="text-sm font-mono break-all">{error.message}</p>
                  {isDevelopment && error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                        Stack trace (dev only)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 bg-background/50 p-2 rounded">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  {isDevelopment && errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                        Component stack (dev only)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 bg-background/50 p-2 rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This could be due to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>A network connectivity issue</li>
                  <li>Missing or invalid data from the server</li>
                  <li>A temporary server error</li>
                  <li>An incompatibility with your browser</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {!isDevelopment && (
                <p className="text-xs text-muted-foreground pt-2">
                  If this problem persists, please contact support with the error details above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
