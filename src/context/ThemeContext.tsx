import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../services/storage';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  tabBarBg: string;
  chipBg: string;
  chipActiveBg: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#cbd5e1',
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  success: '#16a34a',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  warning: '#d97706',
  warningBg: '#fef3c7',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  chipBg: '#f1f5f9',
  chipActiveBg: '#0f172a',
};

export const darkTheme: ThemeColors = {
  background: '#090d16',
  card: '#131b2e',
  cardBorder: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  primary: '#3b82f6',
  primaryLight: '#1e293b',
  success: '#22c55e',
  successBg: '#052e16',
  danger: '#ef4444',
  dangerBg: '#450a0a',
  warning: '#f59e0b',
  warningBg: '#451a03',
  inputBg: '#1e293b',
  inputBorder: '#334155',
  headerBg: '#0f172a',
  tabBarBg: '#0f172a',
  chipBg: '#1e293b',
  chipActiveBg: '#3b82f6',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const setScheme = (mode: 'light' | 'dark') => {
    setIsDark(mode === 'dark');
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
