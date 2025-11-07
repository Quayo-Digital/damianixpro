import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

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
    // Enhanced error logging for debugging
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error message:', error?.message || 'No error message');
    console.error('Error stack:', error?.stack || 'No error stack');
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error name:', error?.name || 'No error name');
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 rounded-lg border bg-background">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-4">
            <Button onClick={this.resetError}>Try again</Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
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
