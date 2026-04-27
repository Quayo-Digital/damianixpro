import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enhanced error logging using logger utility
    logger.error('Error caught by ErrorBoundary', error, {
      errorMessage: error?.message || 'No error message',
      errorStack: error?.stack || 'No error stack',
      componentStack: errorInfo.componentStack,
      errorName: error?.name || 'No error name',
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback was provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise use our default error UI
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border bg-background p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
          <p className="mb-4 max-w-md text-center text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-4">
            <Button onClick={this.resetError}>Try again</Button>
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              Go to homepage
            </Button>
          </div>
        </div>
      );
    }

    // If no error, render the children
    return this.props.children;
  }
}

export default ErrorBoundary;
