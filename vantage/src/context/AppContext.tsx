import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavTab, NotificationState } from '../types';
import { apiClient, DEFAULT_API_URL } from '../api/client';

interface AppContextType {
  business_id: number | null;
  business_name: string | null;
  activeTab: NavTab;
  selectedSkuForForecast: number | null;
  selectedSuggestionCategory: string | null;
  apiBaseUrl: string;
  useMockFallback: boolean;
  notification: NotificationState | null;
  setBusiness: (id: number, name: string) => void;
  clearBusiness: () => void;
  setActiveTab: (tab: NavTab) => void;
  navigateToSkuForecast: (skuId: number) => void;
  navigateToSuggestionsCategory: (category: string) => void;
  setApiBaseUrl: (url: string) => void;
  setUseMockFallback: (fallback: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [business_id, setBusinessId] = useState<number | null>(null);
  const [business_name, setBusinessName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedSkuForForecast, setSelectedSkuForForecast] = useState<number | null>(null);
  const [selectedSuggestionCategory, setSelectedSuggestionCategory] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_URL);
  const [useMockFallback, setUseMockFallbackState] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const setBusiness = (id: number, name: string) => {
    setBusinessId(id);
    setBusinessName(name);
    setActiveTab('dashboard');
  };

  const clearBusiness = () => {
    setBusinessId(null);
    setBusinessName(null);
    setSelectedSkuForForecast(null);
    setSelectedSuggestionCategory(null);
  };

  const navigateToSkuForecast = (skuId: number) => {
    setSelectedSkuForForecast(skuId);
    setActiveTab('forecast');
  };

  const navigateToSuggestionsCategory = (category: string) => {
    setSelectedSuggestionCategory(category);
    setActiveTab('suggestions');
  };

  const setApiBaseUrl = (url: string) => {
    setApiBaseUrlState(url);
    apiClient.setBaseUrl(url);
  };

  const setUseMockFallback = (fallback: boolean) => {
    setUseMockFallbackState(fallback);
    apiClient.setUseMockFallback(fallback);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotification({ id, type, message });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <AppContext.Provider
      value={{
        business_id,
        business_name,
        activeTab,
        selectedSkuForForecast,
        selectedSuggestionCategory,
        apiBaseUrl,
        useMockFallback,
        notification,
        setBusiness,
        clearBusiness,
        setActiveTab,
        navigateToSkuForecast,
        navigateToSuggestionsCategory,
        setApiBaseUrl,
        setUseMockFallback,
        showNotification,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
