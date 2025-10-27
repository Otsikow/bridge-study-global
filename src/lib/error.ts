export type NormalizedError = {
  title: string;
  description: string;
  code?: string;
  details?: unknown;
};

function isSupabasePostgrestError(error: any): boolean {
  return Boolean(error && (error.code || error.hint || error.details || error.message) && (error.name === 'PostgrestError' || typeof error.code === 'string'));
}

function isSupabaseAuthError(error: any): boolean {
  return Boolean(error && (error.name === 'AuthApiError' || error.__isAuthError || (typeof error.status === 'number' && error.error_description)));
}

function isFetchError(error: any): boolean {
  return Boolean(error && (error.name === 'TypeError' || /network/i.test(String(error?.message))));
}

function isStorageError(error: any): boolean {
  return Boolean(error && (error.name === 'StorageError' || /storage/i.test(String(error?.message))));
}

export function formatError(err: unknown, fallback: { title?: string; description?: string } = {}): NormalizedError {
  const defaultTitle = fallback.title || 'Error';
  const defaultDesc = fallback.description || 'Something went wrong.';

  // Explicit strings
  if (typeof err === 'string') {
    return { title: defaultTitle, description: err };
  }

  // Native Error
  if (err instanceof Error) {
    // Common network issues
    if (isFetchError(err)) {
      return {
        title: 'Network error',
        description: 'Please check your internet connection and try again.',
      };
    }

    return { title: defaultTitle, description: err.message };
  }

  // Supabase PostgREST
  if (isSupabasePostgrestError(err)) {
    const code = (err as any).code;
    const message = (err as any).message || defaultDesc;

    // Table row not found
    if (code === 'PGRST116') {
      return { title: 'Not found', description: 'Requested record was not found.', code };
    }

    // Permission denied
    if (code === 'PGRST301' || code === '42501') {
      return { title: 'Permission denied', description: 'You do not have access to this resource.', code };
    }

    return { title: 'Database error', description: message, code, details: err };
  }

  // Supabase Auth
  if (isSupabaseAuthError(err)) {
    const status = (err as any).status;
    const message = (err as any).error_description || (err as any).message || defaultDesc;

    if (status === 400 || status === 401) {
      return { title: 'Authentication error', description: message, code: String(status) };
    }

    return { title: 'Auth error', description: message, code: String(status), details: err };
  }

  // Supabase Storage
  if (isStorageError(err)) {
    return {
      title: 'Storage error',
      description: (err as any).message || defaultDesc,
    };
  }

  // Unknown object
  if (err && typeof err === 'object') {
    const maybeMessage = (err as any).message || (err as any).msg || (err as any).error || defaultDesc;
    const maybeCode = (err as any).code || (err as any).status || undefined;
    return { title: defaultTitle, description: String(maybeMessage), code: String(maybeCode || '') || undefined, details: err };
  }

  // Fallback
  return { title: defaultTitle, description: defaultDesc };
}

export function toastFromError(toast: (opts: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => void, err: unknown, fallback?: { title?: string; description?: string }) {
  const formatted = formatError(err, fallback);
  toast({ title: formatted.title, description: formatted.description, variant: 'destructive' });
}
