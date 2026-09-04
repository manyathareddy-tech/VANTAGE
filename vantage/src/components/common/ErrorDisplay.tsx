import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Failed to load telemetry data',
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-900 shadow-xs my-4 max-w-2xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-rose-100 rounded-lg text-rose-600 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-rose-900">{title}</h4>
          <p className="text-sm text-rose-700 mt-1 leading-relaxed break-words">{message}</p>
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
