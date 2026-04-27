import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  recoverable?: boolean;
  retryable?: boolean;
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

export const DefaultErrorFallback = ({ error, retry }: ErrorFallbackProps) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if the problem
            persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button onClick={retry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {isDevelopment && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Network Error Component
export const NetworkError = ({ onRetry }: { onRetry?: () => void }) => (
  <Alert className="border-orange-200 bg-orange-50">
    <WifiOff className="h-4 w-4 text-orange-600" />
    <AlertTitle className="text-orange-900">Connection Problem</AlertTitle>
    <AlertDescription className="text-orange-800">
      Unable to connect to the server. Please check your internet connection and try again.
      {onRetry && (
        <Button variant="link" onClick={onRetry} className="ml-2 h-auto p-0 text-orange-700">
          Retry
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

// Validation Error Component
interface ValidationErrorProps {
  errors: Record<string, string[]>;
  className?: string;
}

export const ValidationError = ({ errors, className }: ValidationErrorProps) => {
  const errorEntries = Object.entries(errors).filter(([_, messages]) => messages.length > 0);

  if (errorEntries.length === 0) return null;

  return (
    <Alert className={cn('border-red-200 bg-red-50', className)}>
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-900">Please fix the following errors:</AlertTitle>
      <AlertDescription className="text-red-800">
        <ul className="mt-2 space-y-1">
          {errorEntries.map(([field, messages]) => (
            <li key={field} className="text-sm">
              <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>{' '}
              {messages.join(', ')}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

// Form Field Error Component
interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError = ({ error, className }: FieldErrorProps) => {
  if (!error) return null;

  return <p className={cn('mt-1 text-sm text-red-600', className)}>{error}</p>;
};

// API Error Handler Hook
export const useErrorHandler = () => {
  const [error, setError] = React.useState<AppError | null>(null);

  const handleError = React.useCallback((err: unknown) => {
    let appError: AppError;

    if (err instanceof Error) {
      // Network errors
      if (err.message.includes('fetch')) {
        appError = {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server',
          details: 'Please check your internet connection and try again.',
          recoverable: true,
          retryable: true,
        };
      }
      // Validation errors
      else if (err.message.includes('validation')) {
        appError = {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.message,
          recoverable: true,
          retryable: false,
        };
      }
      // Authentication errors
      else if (err.message.includes('auth') || err.message.includes('unauthorized')) {
        appError = {
          code: 'AUTH_ERROR',
          message: 'Authentication required',
          details: 'Please sign in to continue.',
          recoverable: true,
          retryable: false,
        };
      }
      // Generic error
      else {
        appError = {
          code: 'GENERIC_ERROR',
          message: err.message || 'An unexpected error occurred',
          details: 'Please try again or contact support if the problem persists.',
          recoverable: true,
          retryable: true,
        };
      }
    } else {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        details: String(err),
        recoverable: true,
        retryable: true,
      };
    }

    setError(appError);

    // Log error for monitoring
    console.error('Application error:', appError);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

// Error Alert Component
interface ErrorAlertProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert = ({ error, onRetry, onDismiss, className }: ErrorAlertProps) => {
  return (
    <Alert className={cn('border-red-200 bg-red-50', className)}>
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-900">{error.message}</AlertTitle>
      <AlertDescription className="text-red-800">
        {error.details}
        <div className="mt-3 flex space-x-2">
          {error.retryable && onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// 404 Not Found Component
export const NotFound = ({
  title = 'Page Not Found',
  description = "The page you're looking for doesn't exist or has been moved.",
  showHomeButton = true,
}: {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}) => (
  <div className="flex min-h-[60vh] items-center justify-center p-4">
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <span className="text-4xl font-bold text-muted-foreground">404</span>
      </div>
      <h1 className="mb-2 text-2xl font-bold">{title}</h1>
      <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
      <div className="flex justify-center space-x-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        {showHomeButton && (
          <Button onClick={() => (window.location.href = '/')}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  </div>
);

// Unauthorized Access Component
export const Unauthorized = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        <CardTitle>Access Denied</CardTitle>
        <CardDescription>You don't have permission to access this page.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <Button onClick={() => (window.location.href = '/auth/signin')} className="w-full">
            Sign In
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Server Error Component
export const ServerError = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex min-h-[60vh] items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Bug className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle>Server Error</CardTitle>
        <CardDescription>Something went wrong on our end. We're working to fix it.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Connection Status Hook
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Connection Status Indicator
export const ConnectionStatus = () => {
  const isOnline = useConnectionStatus();

  if (isOnline) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-red-600 py-2 text-center text-sm text-white">
      <WifiOff className="mr-2 inline h-4 w-4" />
      You're offline. Some features may not work properly.
    </div>
  );
};

// Retry Hook
export const useRetry = (maxAttempts = 3, delay = 1000) => {
  const [attempts, setAttempts] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = React.useCallback(
    async (fn: () => Promise<any>) => {
      if (attempts >= maxAttempts) {
        throw new Error(`Max retry attempts (${maxAttempts}) exceeded`);
      }

      setIsRetrying(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempts)));
        const result = await fn();
        setAttempts(0); // Reset on success
        return result;
      } catch (error) {
        setAttempts((prev) => prev + 1);
        throw error;
      } finally {
        setIsRetrying(false);
      }
    },
    [attempts, maxAttempts, delay]
  );

  const reset = React.useCallback(() => {
    setAttempts(0);
    setIsRetrying(false);
  }, []);

  return { retry, attempts, isRetrying, canRetry: attempts < maxAttempts, reset };
};
