import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// Skeleton Components for Loading States
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
};

// Card Skeleton for Property Cards, Dashboard Cards, etc.
export const CardSkeleton = () => (
  <div className="space-y-4 rounded-lg border bg-card p-6">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
    <Skeleton className="h-[200px] w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-8 w-[100px]" />
      <Skeleton className="h-8 w-[80px]" />
    </div>
  </div>
);

// Table Skeleton for Data Tables
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {/* Table Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// List Skeleton for Lists and Menus
export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);

// Form Skeleton for Forms
export const FormSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[90px]" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-[110px]" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-[80px]" />
      <Skeleton className="h-10 w-[100px]" />
    </div>
  </div>
);

// Dashboard Skeleton for Dashboard Pages
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-[300px]" />
      <Skeleton className="h-4 w-[500px]" />
    </div>

    {/* Stats Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="mt-1 h-3 w-[120px]" />
          </div>
        </div>
      ))}
    </div>

    {/* Main Content */}
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <CardSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-[180px]" />
        <ListSkeleton items={6} />
      </div>
    </div>
  </div>
);

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />;
};

// Loading Button Component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const LoadingButton = ({
  loading = false,
  children,
  loadingText = 'Loading...',
  disabled,
  className,
  ...props
}: LoadingButtonProps) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'h-10 px-4 py-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {loading ? loadingText : children}
    </button>
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}

export const LoadingOverlay = ({
  loading,
  children,
  message = 'Loading...',
}: LoadingOverlayProps) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Loading State Hook
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const withLoading = React.useCallback(async (asyncFn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setLoading, setError, withLoading };
};

// Progress Indicator Component
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressIndicator = ({ steps, currentStep, className }: ProgressIndicatorProps) => {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
              index < currentStep
                ? 'bg-primary text-primary-foreground'
                : index === currentStep
                  ? 'animate-pulse bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
          </div>
          <span
            className={cn(
              'ml-2 text-sm',
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn('mx-4 h-0.5 w-12', index < currentStep ? 'bg-primary' : 'bg-muted')}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Status Message Component
interface StatusMessageProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const StatusMessage = ({ type, title, message, className }: StatusMessageProps) => {
  const config = {
    info: {
      icon: Info,
      className: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    success: {
      icon: CheckCircle2,
      className: 'bg-green-50 text-green-900 border-green-200',
    },
    warning: {
      icon: AlertCircle,
      className: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    },
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 text-red-900 border-red-200',
    },
  };

  const { icon: Icon, className: typeClassName } = config[type];

  return (
    <div className={cn('rounded-lg border p-4', typeClassName, className)}>
      <div className="flex">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="ml-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <p className={cn('text-sm', title ? 'mt-1' : '')}>{message}</p>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon: Icon = Info,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn('py-12 text-center', className)}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
