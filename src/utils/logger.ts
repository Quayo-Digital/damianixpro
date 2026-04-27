/**
 * Centralized logging utility for DamianixPro platform
 *
 * Provides structured logging with different log levels and production-safe behavior.
 * In production, only warnings and errors are logged to console.
 * All logs can be sent to external logging services.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
      this.addToHistory('debug', message, context);
    }
  }

  /**
   * Log an info message (only in development)
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
      this.addToHistory('info', message, context);
    }
  }

  /**
   * Log a warning message (always logged)
   */
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context || '');
    this.addToHistory('warn', message, context);
    this.sendToLoggingService('warn', message, context);
  }

  /**
   * Log an error message (always logged)
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    const errorContext = errorObj
      ? {
          ...context,
          error: {
            name: errorObj.name,
            message: errorObj.message,
            stack: errorObj.stack,
          },
        }
      : context;

    console.error(`[ERROR] ${message}`, errorContext || error || '');
    this.addToHistory('error', message, errorContext, errorObj);
    this.sendToLoggingService('error', message, errorContext, errorObj);
  }

  /**
   * Log a group of related messages
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Log a table (only in development)
   */
  table(data: unknown): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Get log history (for debugging)
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter((entry) => entry.level === level);
    }
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Add entry to history
   */
  private addToHistory(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    this.logHistory.push(entry);

    // Keep history size manageable
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Send logs to external logging service (Sentry, LogRocket, etc.)
   */
  private sendToLoggingService(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    // Only send errors and warnings in production
    if (!this.isProduction || (level !== 'error' && level !== 'warn')) {
      return;
    }

    // Integration with Sentry (if configured)
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn && typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        if (error) {
          (window as any).Sentry.captureException(error, {
            level,
            extra: context,
            tags: { source: 'logger' },
          });
        } else {
          (window as any).Sentry.captureMessage(message, {
            level,
            extra: context,
            tags: { source: 'logger' },
          });
        }
      } catch (err) {
        // Fail silently if Sentry is not available
      }
    }

    // Integration with LogRocket (if configured)
    const logRocketId = import.meta.env.VITE_LOGROCKET_APP_ID;
    if (logRocketId && typeof window !== 'undefined' && (window as any).LogRocket) {
      try {
        if (error) {
          (window as any).LogRocket.captureException(error, {
            tags: { level, ...context },
          });
        } else {
          (window as any).LogRocket.captureMessage(message, {
            level,
            extra: context,
          });
        }
      } catch (err) {
        // Fail silently if LogRocket is not available
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
    logger.error(message, error, context),
  group: (label: string, callback: () => void) => logger.group(label, callback),
  table: (data: unknown) => logger.table(data),
};

// Default export
export default logger;
