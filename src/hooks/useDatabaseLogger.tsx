import { useCallback, useEffect } from 'react';
import { dbLogger, LogLevel, OperationType } from '@/lib/databaseLogger';

interface UseDbLoggerOptions {
  context?: string;
  enableAutoLog?: boolean;
}

export const useDatabaseLogger = (options: UseDbLoggerOptions = {}) => {
  const { context, enableAutoLog = true } = options;

  useEffect(() => {
    if (enableAutoLog) {
      dbLogger.debug(`Component mounted: ${context || 'unknown'}`);
    }

    return () => {
      if (enableAutoLog) {
        dbLogger.debug(`Component unmounted: ${context || 'unknown'}`);
      }
    };
  }, [context, enableAutoLog]);

  const logSelect = useCallback(
    (table: string, params?: Record<string, any>) => {
      return dbLogger.logSelect(table, params, context);
    },
    [context]
  );

  const logInsert = useCallback(
    (table: string, params?: Record<string, any>) => {
      return dbLogger.logInsert(table, params, context);
    },
    [context]
  );

  const logUpdate = useCallback(
    (table: string, params?: Record<string, any>) => {
      return dbLogger.logUpdate(table, params, context);
    },
    [context]
  );

  const logDelete = useCallback(
    (table: string, params?: Record<string, any>) => {
      return dbLogger.logDelete(table, params, context);
    },
    [context]
  );

  const logRpc = useCallback(
    (functionName: string, params?: Record<string, any>) => {
      return dbLogger.logRpc(functionName, params, context);
    },
    [context]
  );

  const info = useCallback(
    (message: string, meta?: Record<string, any>) => {
      dbLogger.info(context ? `[${context}] ${message}` : message, meta);
    },
    [context]
  );

  const warn = useCallback(
    (message: string, meta?: Record<string, any>) => {
      dbLogger.warn(context ? `[${context}] ${message}` : message, meta);
    },
    [context]
  );

  const error = useCallback(
    (message: string, error?: Error, meta?: Record<string, any>) => {
      dbLogger.error(context ? `[${context}] ${message}` : message, error, meta);
    },
    [context]
  );

  const debug = useCallback(
    (message: string, meta?: Record<string, any>) => {
      dbLogger.debug(context ? `[${context}] ${message}` : message, meta);
    },
    [context]
  );

  return {
    logSelect,
    logInsert,
    logUpdate,
    logDelete,
    logRpc,
    info,
    warn,
    error,
    debug,
    getLogs: dbLogger.getLogs.bind(dbLogger),
    getStats: dbLogger.getStats.bind(dbLogger),
    clearLogs: dbLogger.clearLogs.bind(dbLogger),
    exportLogs: dbLogger.exportLogs.bind(dbLogger),
  };
};
