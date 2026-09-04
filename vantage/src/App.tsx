import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { NotificationToast } from './components/common/NotificationToast';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CashForecastScreen } from './screens/CashForecastScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { UpdateDataScreen } from './screens/UpdateDataScreen';
import { ChatbotScreen } from './screens/ChatbotScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainLayout: React.FC = () => {
  const { business_id, activeTab } = useApp();

  // SCREEN 1: ONBOARDING (shown only when no business_id is set)
  if (!business_id) {
    return (
      <main className="min-h-screen">
        <OnboardingScreen />
        <NotificationToast />
      </main>
    );
  }

  // Active Screen Selector
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'forecast':
        return <CashForecastScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'suggestions':
        return <SuggestionsScreen />;
      case 'update_data':
        return <UpdateDataScreen />;
      case 'chatbot':
        return <ChatbotScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#e8e5f0] text-slate-800 antialiased font-sans">
      {/* Left Sidebar on desktop, collapses to bottom tab bar on mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {renderScreen()}
      </main>

      {/* App-wide notification toasts */}
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
