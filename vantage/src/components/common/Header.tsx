import React from 'react';
import { useApp } from '../../context/AppContext';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false,
}) => {
  const { business_name, business_id } = useApp();

  return (
    <header className="h-16 flex items-center justify-between px-6 sm:px-8 bg-white/50 backdrop-blur shadow-xs border-b border-purple-200 sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-4 truncate">
        {business_name ? (
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-purple-900/40 uppercase tracking-widest hidden sm:inline shrink-0">
              Active Session:
            </span>
            <span className="text-xs font-bold text-[#3d3358] truncate">
              {business_name} {business_id ? `(ID: ${business_id})` : ''}
            </span>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-bold text-[#3d3358] tracking-tight">{title}</h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {subtitle && (
          <span className="text-[11px] text-slate-500 font-medium hidden lg:inline">
            {subtitle}
          </span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data from server"
            className="p-2 text-slate-500 hover:text-[#3d3358] hover:bg-white/80 rounded-lg transition-colors cursor-pointer border border-purple-200/60 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3d3358]' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
