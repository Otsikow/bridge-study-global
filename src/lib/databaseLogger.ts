import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { logPrivilegeEscalationAttempt } from './securityLogger';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type OperationType = 'select' | 'insert' | 'update' | 'delete' | 'rpc';

interface DatabaseLogEntry {
  level: LogLevel;
  operation: OperationType;
  table?: string;
  function?: string;
  query?: string;
  params?: Record<string, any>;
  duration?: number;
  error?: PostgrestError | Error;
  userId?: string;
  timestamp: string;
  context?: string;
}

class DatabaseLogger {
  private logs: DatabaseLogEntry[] = [];
  private maxLogs = 1000;
  private enableConsoleLog = true;
  private enablePersistence = false; // Set to true to persist logs to database

  constructor() {
    // Enable console logging in development
    this.enableConsoleLog = import.meta.env.DEV;
  }

  private formatLog(entry: DatabaseLogEntry): string {
    const { level, operation, table, function: fn, duration, error, context } = entry;
    const target = table || fn || 'unknown';
    const durationStr = duration ? ` (${duration}ms)` : '';
    const contextStr = context ? ` [${context}]` : '';
    const errorStr = error ? ` - ERROR: ${error.message}` : '';
    
    return `[DB ${level.toUpperCase()}]${contextStr} ${operation.toUpperCase()} ${target}${durationStr}${errorStr}`;
  }

    private addLog(entry: DatabaseLogEntry) {
      this.logs.push(entry);

      // Limit log size
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      if (entry.level === 'error') {
        this.evaluateSecuritySignals(entry);
      }

      // Console logging
      if (this.enableConsoleLog) {
        const logFn = entry.level === 'error'
          ? console.error
          : entry.level === 'warn'
            ? console.warn
            : entry.level === 'debug'
              ? console.debug
              : console.log;

        logFn(this.formatLog(entry), {
          params: entry.params,
          error: entry.error,
        });
      }
    }

    private evaluateSecuritySignals(entry: DatabaseLogEntry) {
      const errorMessage = entry.error?.message || (typeof entry.params?.message === 'string' ? entry.params.message : '') || '';
      const normalizedMessage = errorMessage.toLowerCase();
      const errorCode = (entry.error as PostgrestError | undefined)?.code || (typeof entry.params?.code === 'string' ? entry.params.code : undefined);

      const indicatesPrivilegeIssue =
        normalizedMessage.includes('permission denied') ||
        normalizedMessage.includes('insufficient_privilege') ||
        errorCode === '42501';

      if (!indicatesPrivilegeIssue) {
        return;
      }

      void logPrivilegeEscalationAttempt({
        description: entry.context
          ? `Unauthorized ${entry.operation.toUpperCase()} attempt on ${entry.table || entry.function || 'unknown'}`
          : undefined,
        metadata: {
          operation: entry.operation,
          table: entry.table,
          function: entry.function,
          context: entry.context,
          params: entry.params,
          error: entry.error
            ? {
                message: entry.error.message,
                name: entry.error.name,
                ...(entry.error instanceof Error && entry.error.stack ? { stack: entry.error.stack } : {}),
                ...(typeof (entry.error as PostgrestError).code === 'string'
                  ? { code: (entry.error as PostgrestError).code }
                  : {}),
                ...(typeof (entry.error as PostgrestError).details === 'string'
                  ? { details: (entry.error as PostgrestError).details }
                  : {}),
              }
            : null,
        },
      });
    }

    // Optional: Persist to database (only in production with errors)
    if (this.enablePersistence && entry.level === 'error') {
      this.persistLog(entry).catch(err => {
        console.error('Failed to persist log:', err);
      });
    }
  }

  private async persistLog(entry: DatabaseLogEntry) {
    try {
      // Don't log to database in development to avoid clutter
      if (import.meta.env.DEV) return;

      // Get tenant_id from user session if available
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Don't persist if no user session

      // Store critical errors in audit_logs
      const { error: insertError } = await supabase.from('audit_logs').insert({
        tenant_id: '00000000-0000-0000-0000-000000000001', // Default tenant
        user_id: user.id,
        action: `${entry.operation}_${entry.level}`,
        entity: entry.table || entry.function || 'database',
        changes: {
          operation: entry.operation,
          params: entry.params,
          error: entry.error ? {
            message: entry.error.message,
            code: 'code' in entry.error ? entry.error.code : undefined,
            details: 'details' in entry.error ? entry.error.details : undefined,
          } : null,
          duration: entry.duration,
          context: entry.context,
          query: entry.query,
        },
      });

      if (insertError) {
        console.warn('Failed to persist log to audit_logs:', insertError);
      }
    } catch (error) {
      // Silently fail to avoid infinite loops
      console.warn('Failed to persist database log:', error);
    }
  }

  async logOperation<T>(
    config: {
      operation: OperationType;
      table?: string;
      function?: string;
      context?: string;
      params?: Record<string, any>;
      level?: LogLevel;
    },
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const { operation, table, function: fn, context, params, level = 'info' } = config;

    try {
      const result = await executor();
      const duration = Math.round(performance.now() - startTime);

      this.addLog({
        level,
        operation,
        table,
        function: fn,
        params,
        duration,
        timestamp: new Date().toISOString(),
        context,
      });

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      this.addLog({
        level: 'error',
        operation,
        table,
        function: fn,
        params,
        duration,
        error: error as PostgrestError | Error,
        timestamp: new Date().toISOString(),
        context,
      });

      throw error;
    }
  }

  logSelect(table: string, params?: Record<string, any>, context?: string) {
    return <T>(executor: () => Promise<T>) =>
      this.logOperation({ operation: 'select', table, params, context }, executor);
  }

  logInsert(table: string, params?: Record<string, any>, context?: string) {
    return <T>(executor: () => Promise<T>) =>
      this.logOperation({ operation: 'insert', table, params, context }, executor);
  }

  logUpdate(table: string, params?: Record<string, any>, context?: string) {
    return <T>(executor: () => Promise<T>) =>
      this.logOperation({ operation: 'update', table, params, context }, executor);
  }

  logDelete(table: string, params?: Record<string, any>, context?: string) {
    return <T>(executor: () => Promise<T>) =>
      this.logOperation({ operation: 'delete', table, params, context }, executor);
  }

  logRpc(functionName: string, params?: Record<string, any>, context?: string) {
    return <T>(executor: () => Promise<T>) =>
      this.logOperation({ operation: 'rpc', function: functionName, params, context }, executor);
  }

  // Manual logging methods
  info(message: string, meta?: Record<string, any>) {
    this.addLog({
      level: 'info',
      operation: 'select',
      context: message,
      params: meta,
      timestamp: new Date().toISOString(),
    });
  }

  warn(message: string, meta?: Record<string, any>) {
    this.addLog({
      level: 'warn',
      operation: 'select',
      context: message,
      params: meta,
      timestamp: new Date().toISOString(),
    });
  }

  error(message: string, error?: Error | PostgrestError, meta?: Record<string, any>) {
    this.addLog({
      level: 'error',
      operation: 'select',
      context: message,
      error,
      params: meta,
      timestamp: new Date().toISOString(),
    });
  }

  debug(message: string, meta?: Record<string, any>) {
    if (import.meta.env.DEV) {
      this.addLog({
        level: 'debug',
        operation: 'select',
        context: message,
        params: meta,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get logs for debugging
  getLogs(filters?: { level?: LogLevel; operation?: OperationType; limit?: number }) {
    let filtered = this.logs;

    if (filters?.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters?.operation) {
      filtered = filtered.filter(log => log.operation === filters.operation);
    }

    const limit = filters?.limit || 100;
    return filtered.slice(-limit);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for analysis
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  // Get summary statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byOperation: {} as Record<OperationType, number>,
      errors: this.logs.filter(l => l.level === 'error').length,
      avgDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
      
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
    });

    stats.avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    return stats;
  }
}

// Singleton instance
export const dbLogger = new DatabaseLogger();

// Convenience function for quick logging
export const logDbOperation = dbLogger.logOperation.bind(dbLogger);
