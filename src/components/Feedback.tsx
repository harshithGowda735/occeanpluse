import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoadingProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading data...', className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-slate-400", className)}>
      <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
      <p className="font-medium text-sm tracking-wide uppercase">{message}</p>
    </div>
  );
}

interface ErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  message = 'Something went wrong while fetching data.', 
  onRetry, 
  className 
}: ErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center bg-rose-50/50 rounded-3xl border border-dashed border-rose-200", className)}>
      <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl mb-4 shadow-sm shadow-rose-100">
        <AlertCircle size={32} />
      </div>
      <h3 className="font-bold text-slate-900 mb-2">Connection Error</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<any, any> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <ErrorState 
            message="A critical error occurred in this module." 
            onRetry={() => window.location.reload()} 
          />
        </div>
      );
    }

    return (this as any).props.children;
  }
}
