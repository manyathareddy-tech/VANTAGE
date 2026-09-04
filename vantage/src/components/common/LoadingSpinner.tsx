import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading financial telemetry...',
  size = 'md',
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-[#3d3358]`} />
      </div>
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return content;
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-xs border border-[#d6d0e6] animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="h-8 bg-slate-200 rounded w-2/3"></div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
};
