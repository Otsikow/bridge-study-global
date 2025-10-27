/**
 * Error handling utilities for better error messages and logging
 */

export interface AppError {
  message: string;
  code?: string;
  details?: string;
  originalError?: unknown;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // String error
  if (typeof error === 'string') return error;

  // Error object
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  // Supabase/PostgreSQL error
  if (typeof error === 'object' && error !== null) {
    const err = error as any;

    // Supabase error with message
    if (err.message) {
      // Check for common Supabase error patterns
      if (err.message.includes('JWT')) {
        return 'Authentication session expired. Please sign in again.';
      }
      if (err.message.includes('not found')) {
        return 'The requested resource was not found.';
      }
      if (err.message.includes('permission denied') || err.message.includes('insufficient_privilege')) {
        return 'You do not have permission to perform this action.';
      }
      if (err.message.includes('duplicate key')) {
        return 'This record already exists.';
      }
      if (err.message.includes('violates foreign key constraint')) {
        return 'Cannot complete action due to related records.';
      }
      if (err.message.includes('violates not-null constraint')) {
        return 'Required information is missing.';
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        return 'Network error. Please check your internet connection.';
      }
      return err.message;
    }

    // PostgreSQL error with hint or detail
    if (err.hint) return err.hint;
    if (err.details) return err.details;
    if (err.detail) return err.detail;

    // Error with error property
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
    }

    // HTTP status-based errors
    if (err.status) {
      switch (err.status) {
        case 400:
          return 'Bad request. Please check your input.';
        case 401:
          return 'Unauthorized. Please sign in again.';
        case 403:
          return 'Access forbidden. You do not have permission.';
        case 404:
          return 'Resource not found.';
        case 409:
          return 'Conflict. This resource already exists.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable.';
        default:
          return `Request failed with status ${err.status}`;
      }
    }

    // Network errors
    if (err.name === 'NetworkError' || err.name === 'TypeError') {
      return 'Network error. Please check your internet connection.';
    }
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Creates a detailed AppError object from any error type
 */
export function createAppError(error: unknown, context?: string): AppError {
  const message = getErrorMessage(error);
  const err = error as any;

  return {
    message: context ? `${context}: ${message}` : message,
    code: err?.code || err?.status?.toString(),
    details: err?.details || err?.detail || err?.hint,
    originalError: error,
  };
}

/**
 * Logs error with context for debugging
 */
export function logError(error: unknown, context?: string) {
  const appError = createAppError(error, context);
  
  console.error('[Error]', {
    context,
    message: appError.message,
    code: appError.code,
    details: appError.details,
    originalError: appError.originalError,
    timestamp: new Date().toISOString(),
  });

  // In production, this could send to an error tracking service
  // Example: Sentry.captureException(error, { contexts: { app: { context } } });
}

/**
 * Type guard for checking if an error is a specific type
 */
export function isSupabaseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'code' in error || 'details' in error)
  );
}

/**
 * Checks if error is related to authentication
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes('JWT') ||
    message.includes('auth') ||
    message.includes('Unauthorized') ||
    message.includes('session expired')
  );
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const err = error as any;
  return (
    message.includes('Network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    err?.name === 'NetworkError' ||
    err?.name === 'TypeError'
  );
}

/**
 * Formats error for display in toast notifications
 */
export function formatErrorForToast(error: unknown, defaultMessage?: string) {
  const message = getErrorMessage(error);
  const isDev = import.meta.env.DEV;

  return {
    title: 'Error',
    description: message || defaultMessage || 'An unexpected error occurred',
    variant: 'destructive' as const,
    // In development, show more details
    ...(isDev && {
      duration: 10000, // Longer duration in dev for debugging
    }),
  };
}
