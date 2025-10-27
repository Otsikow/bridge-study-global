import { PostgrestError } from '@supabase/supabase-js';

export interface ErrorDetails {
  title: string;
  message: string;
  type: 'network' | 'auth' | 'permission' | 'validation' | 'not_found' | 'server' | 'unknown';
  retryable: boolean;
  action?: string;
}

export class AppError extends Error {
  public readonly type: ErrorDetails['type'];
  public readonly retryable: boolean;
  public readonly action?: string;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    type: ErrorDetails['type'] = 'unknown',
    retryable: boolean = false,
    action?: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.retryable = retryable;
    this.action = action;
    this.originalError = originalError;
  }
}

export const parseError = (error: unknown): ErrorDetails => {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      title: getErrorTitle(error.type),
      message: error.message,
      type: error.type,
      retryable: error.retryable,
      action: error.action,
    };
  }

  // Handle Supabase PostgrestError
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    return parseSupabaseError(pgError);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return parseStandardError(error);
  }

  // Handle network/fetch errors
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as any).message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'network',
        retryable: true,
        action: 'Check your internet connection',
      };
    }
  }

  // Handle unknown errors
  return {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    type: 'unknown',
    retryable: true,
    action: 'Try again or contact support',
  };
};

const parseSupabaseError = (error: PostgrestError): ErrorDetails => {
  const { code, message, details } = error;

  switch (code) {
    case 'PGRST116':
      return {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        type: 'not_found',
        retryable: false,
        action: 'Check if the resource exists',
      };

    case '23505': // Unique constraint violation
      return {
        title: 'Duplicate Entry',
        message: 'This record already exists. Please check your input and try again.',
        type: 'validation',
        retryable: false,
        action: 'Check for duplicates',
      };

    case '23503': // Foreign key constraint violation
      return {
        title: 'Invalid Reference',
        message: 'The referenced record does not exist or has been deleted.',
        type: 'validation',
        retryable: false,
        action: 'Check your references',
      };

    case '23514': // Check constraint violation
      return {
        title: 'Invalid Data',
        message: 'The data provided does not meet the required criteria.',
        type: 'validation',
        retryable: false,
        action: 'Check your input',
      };

    case '42501': // Insufficient privilege
      return {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        type: 'permission',
        retryable: false,
        action: 'Contact administrator',
      };

    case '42P01': // Undefined table
    case '42703': // Undefined column
      return {
        title: 'Database Error',
        message: 'There is an issue with the database structure. Please contact support.',
        type: 'server',
        retryable: false,
        action: 'Contact support',
      };

    case '08006': // Connection failure
    case '08001': // SQL client unable to establish connection
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the database. Please try again in a moment.',
        type: 'network',
        retryable: true,
        action: 'Try again later',
      };

    default:
      return {
        title: 'Database Error',
        message: details || message || 'A database error occurred.',
        type: 'server',
        retryable: true,
        action: 'Try again',
      };
  }
};

const parseStandardError = (error: Error): ErrorDetails => {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      type: 'network',
      retryable: true,
      action: 'Check your internet connection',
    };
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      type: 'auth',
      retryable: false,
      action: 'Log in again',
    };
  }

  // Permission errors
  if (message.includes('forbidden') || message.includes('403') || message.includes('permission')) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.',
      type: 'permission',
      retryable: false,
      action: 'Contact administrator',
    };
  }

  // Not found errors
  if (message.includes('not found') || message.includes('404')) {
    return {
      title: 'Not Found',
      message: 'The requested resource was not found.',
      type: 'not_found',
      retryable: false,
      action: 'Check the URL or resource',
    };
  }

  // Chunk loading errors (common in SPA updates)
  if (message.includes('chunk') || message.includes('loading')) {
    return {
      title: 'Loading Error',
      message: 'Failed to load application resources. The app may have been updated. Please refresh the page.',
      type: 'network',
      retryable: true,
      action: 'Refresh the page',
    };
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      type: 'network',
      retryable: true,
      action: 'Try again',
    };
  }

  // Default error
  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred.',
    type: 'unknown',
    retryable: true,
    action: 'Try again',
  };
};

const getErrorTitle = (type: ErrorDetails['type']): string => {
  const titles = {
    network: 'Connection Error',
    auth: 'Authentication Error',
    permission: 'Access Denied',
    validation: 'Invalid Input',
    not_found: 'Not Found',
    server: 'Server Error',
    unknown: 'Unexpected Error',
  };
  return titles[type];
};

// Utility function to create user-friendly error messages
export const createUserFriendlyError = (error: unknown, context?: string): AppError => {
  const errorDetails = parseError(error);
  
  let message = errorDetails.message;
  if (context) {
    message = `${context}: ${message}`;
  }

  return new AppError(
    message,
    errorDetails.type,
    errorDetails.retryable,
    errorDetails.action,
    error
  );
};

// Utility function for API error handling
export const handleApiError = async (error: unknown, context: string): Promise<never> => {
  const appError = createUserFriendlyError(error, context);
  console.error(`API Error in ${context}:`, error);
  throw appError;
};

// Utility function for database operations
export const handleDbError = async (error: unknown, operation: string): Promise<never> => {
  const appError = createUserFriendlyError(error, `Failed to ${operation}`);
  console.error(`Database Error during ${operation}:`, error);
  throw appError;
};