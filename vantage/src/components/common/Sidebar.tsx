import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavTab } from '../../types';

interface NavItemConfig {
  id: NavTab;
  label: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
}

const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    renderIcon: (isActive) => (
      <div className={`w-4 h-4 border-2 rounded-xs transition-colors shrink-0 ${isActive ? 'border-white' : 'border-purple-300'}`} />
    ),
  },
  {
    id: 'forecast',
    label: 'Cash Forecast',
    renderIcon: (isActive) => (
      <div className={`w-4 h-4 border-2 rounded-full transition-colors shrink-0 ${isActive ? 'border-white' : 'border-purple-300'}`} />
    ),
  },
  {
    id: 'inventory',
    label: 'Inventory',
    renderIcon: (isActive) => (
      <div className={`w-4 h-4 border-2 transform rotate-45 transition-colors shrink-0 ${isActive ? 'border-white' : 'border-purple-300'}`} />
    ),
  },
  {
    id: 'suggestions',
    label: 'Suggestions',
    renderIcon: (isActive) => (
      <div className={`w-4 h-4 rounded-full transition-colors shrink-0 ${isActive ? 'bg-white' : 'bg-purple-400'}`} />
    ),
  },
  {
    id: 'update_data',
    label: 'Update Data',
    renderIcon: (isActive) => (
      <div className={`w-4 h-[2px] rounded-full transition-colors shrink-0 ${isActive ? 'bg-white' : 'bg-purple-300'}`} />
    ),
  },
  {
    id: 'chatbot',
    label: 'Chatbot',
    renderIcon: (isActive) => (
      <div className={`w-4 h-4 border-b-2 border-r-2 rounded-bl-sm transition-colors shrink-0 ${isActive ? 'border-white' : 'border-purple-300'}`} />
    ),
  },
];

const SETTINGS_NAV_ITEM: NavItemConfig = {
  id: 'settings',
  label: 'Settings',
  renderIcon: (isActive) => (
    <div className={`w-4 h-4 border-2 rounded-full transition-colors shrink-0 ${isActive ? 'border-white' : 'border-purple-300'}`} />
  ),
};

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, business_name, business_id } = useApp();

  return (
    <>
      {/* Desktop Sidebar - Geometric Balance Design */}
      <aside className="hidden md:flex flex-col w-64 bg-[#3d3358] text-white shrink-0 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="p-8 border-b border-white/10">
          <h1
            className="text-3xl tracking-tighter italic leading-none font-serif select-none"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            VANTAGE
          </h1>
          <p className="text-[10px] text-purple-200 opacity-60 uppercase tracking-widest mt-1.5 font-medium">
            Financial Immune System
          </p>

          {/* Active Session Snippet */}
          {business_name && (
            <div className="mt-4 px-3 py-2 bg-white/10 rounded-lg border border-white/10 flex items-center justify-between text-xs">
              <div className="truncate">
                <span className="text-[9px] uppercase text-purple-200/70 block font-semibold tracking-wider">Active MSME</span>
                <span className="font-semibold text-white truncate block">{business_name}</span>
              </div>
              <span className="text-[10px] font-mono bg-white/20 text-purple-100 px-1.5 py-0.5 rounded ml-2 shrink-0">
                #{business_id}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white shadow-xs'
                    : 'text-purple-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.renderIcon(isActive)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings (Visually Separated at Bottom) */}
        <div className="p-4 mt-auto border-t border-white/10">
          <button
            onClick={() => setActiveTab(SETTINGS_NAV_ITEM.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === SETTINGS_NAV_ITEM.id
                ? 'bg-white/10 text-white shadow-xs'
                : 'text-purple-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            {SETTINGS_NAV_ITEM.renderIcon(activeTab === SETTINGS_NAV_ITEM.id)}
            <span className="italic">{SETTINGS_NAV_ITEM.label}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#3d3358] border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur">
        {[...PRIMARY_NAV_ITEMS, SETTINGS_NAV_ITEM].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer min-w-[48px] ${
                isActive ? 'text-white font-bold bg-white/15' : 'text-purple-200/70 hover:text-white'
              }`}
            >
              <div className="mb-0.5">{item.renderIcon(isActive)}</div>
              <span className="text-[10px] whitespace-nowrap">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
