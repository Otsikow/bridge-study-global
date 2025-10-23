import { PostgrestError } from '@supabase/supabase-js';
import { AppError, parseError } from './errorHandling';

// Enhanced Supabase error handling with specific error messages
export const handleSupabaseError = (error: PostgrestError, context: string): never => {
  const appError = new AppError(
    getSupabaseErrorMessage(error, context),
    getSupabaseErrorType(error),
    isRetryableError(error),
    getSuggestedAction(error),
    error
  );
  
  console.error(`Supabase error in ${context}:`, error);
  throw appError;
};

const getSupabaseErrorMessage = (error: PostgrestError, context: string): string => {
  const { code, message, details } = error;

  switch (code) {
    case 'PGRST116':
      return `${context}: The requested resource was not found.`;
    
    case '23505': // Unique constraint violation
      return `${context}: This record already exists. Please check for duplicates.`;
    
    case '23503': // Foreign key constraint violation
      return `${context}: The referenced record does not exist or has been deleted.`;
    
    case '23514': // Check constraint violation
      return `${context}: The data provided does not meet the required criteria.`;
    
    case '42501': // Insufficient privilege
      return `${context}: You do not have permission to perform this action.`;
    
    case '42P01': // Undefined table
      return `${context}: Database table not found. Please contact support.`;
    
    case '42703': // Undefined column
      return `${context}: Database column not found. Please contact support.`;
    
    case '08006': // Connection failure
    case '08001': // SQL client unable to establish connection
      return `${context}: Unable to connect to the database. Please try again.`;
    
    case '57014': // Query canceled
      return `${context}: The request was canceled. Please try again.`;
    
    case '08P01': // Protocol violation
      return `${context}: Database protocol error. Please contact support.`;
    
    default:
      return `${context}: ${details || message || 'A database error occurred.'}`;
  }
};

const getSupabaseErrorType = (error: PostgrestError): AppError['type'] => {
  const { code } = error;

  switch (code) {
    case 'PGRST116':
      return 'not_found';
    
    case '23505':
    case '23503':
    case '23514':
      return 'validation';
    
    case '42501':
      return 'permission';
    
    case '42P01':
    case '42703':
    case '08P01':
      return 'server';
    
    case '08006':
    case '08001':
    case '57014':
      return 'network';
    
    default:
      return 'server';
  }
};

const isRetryableError = (error: PostgrestError): boolean => {
  const { code } = error;
  
  // Retryable errors
  const retryableCodes = [
    '08006', // Connection failure
    '08001', // SQL client unable to establish connection
    '57014', // Query canceled
  ];
  
  return retryableCodes.includes(code);
};

const getSuggestedAction = (error: PostgrestError): string => {
  const { code } = error;

  switch (code) {
    case 'PGRST116':
      return 'Check if the resource exists or has been deleted.';
    
    case '23505':
      return 'Check for duplicate entries and try again.';
    
    case '23503':
      return 'Verify that all referenced records exist.';
    
    case '23514':
      return 'Check your input data against the requirements.';
    
    case '42501':
      return 'Contact your administrator for access permissions.';
    
    case '42P01':
    case '42703':
    case '08P01':
      return 'Contact technical support immediately.';
    
    case '08006':
    case '08001':
      return 'Check your internet connection and try again.';
    
    case '57014':
      return 'The request was canceled. Try again with a simpler query.';
    
    default:
      return 'Try again or contact support if the problem persists.';
  }
};

// Utility function for common Supabase operations with error handling
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: string
): Promise<T> => {
  try {
    const { data, error } = await operation();
    
    if (error) {
      handleSupabaseError(error, context);
    }
    
    if (data === null) {
      throw new AppError(
        `${context}: No data returned`,
        'not_found',
        false,
        'Check if the resource exists',
        null
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle non-Supabase errors
    throw new AppError(
      `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'unknown',
      true,
      'Try again',
      error
    );
  }
};

// Utility for handling Supabase queries with better error messages
export const safeQuery = async <T>(
  query: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: string,
  allowNull: boolean = false
): Promise<T | null> => {
  try {
    const { data, error } = await query();
    
    if (error) {
      handleSupabaseError(error, context);
    }
    
    if (!allowNull && data === null) {
      throw new AppError(
        `${context}: No data found`,
        'not_found',
        false,
        'Check if the resource exists',
        null
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'unknown',
      true,
      'Try again',
      error
    );
  }
};