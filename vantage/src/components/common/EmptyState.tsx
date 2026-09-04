import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="bg-white/80 border border-[#d6d0e6] rounded-xl p-8 text-center max-w-lg mx-auto my-6 shadow-xs">
      <div className="w-12 h-12 rounded-xl bg-[#eae6f5] text-[#3d3358] flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-[#3d3358] hover:bg-[#2d2542] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
