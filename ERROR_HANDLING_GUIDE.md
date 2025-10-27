# Error Handling Guide

This guide explains the comprehensive error handling system implemented in the application to provide users with clear, actionable error messages instead of generic "failed to load" messages.

## Overview

The error handling system consists of several layers:

1. **Error Boundary** - Catches React component crashes
2. **Error Utilities** - Parse and categorize different types of errors
3. **Custom Hooks** - Provide error handling for components
4. **Supabase Integration** - Specific handling for database errors
5. **Loading States** - Better user feedback during operations

## Components

### 1. ErrorBoundary (`src/components/ErrorBoundary.tsx`)

A React Error Boundary that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features:**
- Catches component crashes and displays user-friendly error messages
- Provides retry functionality for recoverable errors
- Shows technical details in development mode
- Logs errors to console and external services in production
- Supports custom fallback components

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Error Handling Utilities (`src/lib/errorHandling.ts`)

Core utilities for parsing and categorizing errors.

**Key Functions:**
- `parseError()` - Converts any error into a structured ErrorDetails object
- `createUserFriendlyError()` - Creates user-friendly error messages
- `handleApiError()` - Standardized API error handling
- `handleDbError()` - Database operation error handling

**Error Types:**
- `network` - Connection issues
- `auth` - Authentication problems
- `permission` - Access denied
- `validation` - Input validation errors
- `not_found` - Resource not found
- `server` - Server-side errors
- `unknown` - Unhandled errors

### 3. Error Handling Hooks (`src/hooks/useErrorHandler.tsx`)

Custom hooks that provide error handling capabilities to components.

**Available Hooks:**
- `useErrorHandler()` - Basic error handling with retry functionality
- `useAsyncOperation()` - Handles async operations with loading states
- `useFormErrorHandler()` - Specialized for form submissions

**Usage:**
```tsx
const errorHandler = useErrorHandler({ context: 'User Profile' });

// Handle errors
try {
  await someOperation();
} catch (error) {
  errorHandler.handleError(error, 'Failed to save profile');
}

// Display error UI
{errorHandler.hasError && (
  <ErrorDisplay 
    error={errorHandler.error} 
    onRetry={() => errorHandler.retry(operation)}
  />
)}
```

### 4. Supabase Error Handling (`src/lib/supabaseErrorHandling.ts`)

Specialized error handling for Supabase database operations.

**Features:**
- Maps Supabase error codes to user-friendly messages
- Provides specific actions for different error types
- Handles connection issues, constraint violations, and permission errors
- Includes retry logic for transient errors

**Usage:**
```tsx
import { safeQuery } from '@/lib/supabaseErrorHandling';

const data = await safeQuery(
  () => supabase.from('users').select('*'),
  'Fetching user data'
);
```

### 5. Loading States (`src/components/LoadingState.tsx`)

Components for better loading feedback.

**Components:**
- `LoadingState` - Basic loading indicator with optional retry
- `LoadingCard` - Loading state in a card layout
- `Skeleton` - Skeleton loading for content
- `SkeletonCard` - Skeleton loading for cards

## Error Message Examples

### Before (Generic)
- "Failed to load applications"
- "Failed to load profile data"
- "Failed to load dashboard data"

### After (Specific)
- "Applications: Unable to connect to the server. Please check your internet connection."
- "Profile: The requested resource was not found. Check if the resource exists."
- "Dashboard: Your session has expired. Please log in again."

## Implementation Examples

### Basic Component Error Handling

```tsx
import { useErrorHandler, ErrorDisplay } from '@/hooks/useErrorHandler';

export function MyComponent() {
  const errorHandler = useErrorHandler({ context: 'My Component' });
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      errorHandler.clearError();
      const result = await api.getData();
      setData(result);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load data');
    }
  };

  if (errorHandler.hasError) {
    return (
      <ErrorDisplay 
        error={errorHandler.error} 
        onRetry={() => errorHandler.retry(fetchData)}
      />
    );
  }

  return <div>{/* Your component content */}</div>;
}
```

### Form Error Handling

```tsx
import { useFormErrorHandler } from '@/hooks/useErrorHandler';

export function MyForm() {
  const formErrorHandler = useFormErrorHandler({ context: 'Form Submission' });

  const handleSubmit = async (formData) => {
    const result = await formErrorHandler.handleSubmit(async () => {
      return await api.submitForm(formData);
    });
    
    if (result) {
      // Success
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {formErrorHandler.hasError && (
        <ErrorDisplay error={formErrorHandler.error} />
      )}
    </form>
  );
}
```

### Async Operation with Loading

```tsx
import { useAsyncOperation } from '@/hooks/useErrorHandler';

export function DataComponent() {
  const { execute, isLoading, data, error, retry } = useAsyncOperation(
    () => api.fetchData(),
    { context: 'Data Loading' }
  );

  useEffect(() => {
    execute();
  }, []);

  if (isLoading) return <LoadingState message="Loading data..." />;
  if (error) return <ErrorDisplay error={error} onRetry={retry} />;

  return <div>{/* Render data */}</div>;
}
```

## Error Categories and User Actions

| Error Type | User Message | Suggested Action |
|------------|--------------|------------------|
| Network | "Unable to connect to the server" | "Check your internet connection" |
| Auth | "Your session has expired" | "Log in again" |
| Permission | "You do not have permission" | "Contact administrator" |
| Validation | "The data provided is invalid" | "Check your input" |
| Not Found | "The requested resource was not found" | "Check if the resource exists" |
| Server | "A server error occurred" | "Try again or contact support" |

## Best Practices

1. **Always provide context** - Include what operation failed
2. **Use specific error messages** - Avoid generic "failed to load" messages
3. **Provide actionable guidance** - Tell users what they can do
4. **Implement retry logic** - For transient errors
5. **Log errors appropriately** - For debugging without exposing details to users
6. **Test error scenarios** - Ensure error handling works in real conditions

## Testing Error Scenarios

To test the error handling system:

1. **Network errors** - Disconnect internet or use network throttling
2. **Authentication errors** - Expire sessions or use invalid tokens
3. **Permission errors** - Use accounts with restricted access
4. **Validation errors** - Submit invalid data
5. **Server errors** - Simulate database failures

## Monitoring and Logging

In production, errors are logged to the console and can be sent to external services like Sentry, LogRocket, or Bugsnag for monitoring and debugging.

The error boundary automatically logs errors with:
- Error message and stack trace
- Component stack trace
- Timestamp
- User context (if available)

This comprehensive error handling system ensures users always receive clear, actionable feedback when something goes wrong, significantly improving the user experience.