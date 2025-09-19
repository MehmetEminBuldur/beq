'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  isMenuOpen: boolean;
  currentView: string;
  notifications: any[];
}

interface AppStateContextType {
  state: AppState;
  setMenuOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderWrapperProps {
  children: ReactNode;
}

export function AppStateProviderWrapper({ children }: AppStateProviderWrapperProps) {
  const [state, setState] = useState<AppState>({
    isMenuOpen: false,
    currentView: 'home',
    notifications: [],
  });

  const setMenuOpen = (open: boolean) => {
    setState(prev => ({ ...prev, isMenuOpen: open }));
  };

  const setCurrentView = (view: string) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const addNotification = (notification: any) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { ...notification, id: Date.now().toString() }],
    }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  };

  const value = {
    state,
    setMenuOpen,
    setCurrentView,
    addNotification,
    removeNotification,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProviderWrapper');
  }
  return context;
}