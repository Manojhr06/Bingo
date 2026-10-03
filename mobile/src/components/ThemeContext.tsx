import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryLight: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  card: string;
  cellDefault: string;
  cellDefaultText: string;
  cellMarked: string;
  cellMarkedText: string;
  cellCompletedLine: string;
  success: string;
  warning: string;
  danger: string;
  isDark: boolean;
}

const darkTheme: ThemeColors = {
  background: '#0B0F19',
  surface: '#151D2F',
  surfaceElevated: '#1E293B',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  accent: '#EC4899',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#27354A',
  borderLight: '#334155',
  card: '#151D2F',
  cellDefault: '#1E293B',
  cellDefaultText: '#E2E8F0',
  cellMarked: '#4F46E5',
  cellMarkedText: '#FFFFFF',
  cellCompletedLine: '#059669',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  isDark: true,
};

const lightTheme: ThemeColors = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  accent: '#DB2777',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#CBD5E1',
  borderLight: '#E2E8F0',
  card: '#FFFFFF',
  cellDefault: '#E2E8F0',
  cellDefaultText: '#1E293B',
  cellMarked: '#4F46E5',
  cellMarkedText: '#FFFFFF',
  cellCompletedLine: '#10B981',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  isDark: false,
};

interface ThemeContextType {
  theme: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDarkMode: true,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to sleek dark mode

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const setDarkMode = (val: boolean) => setIsDarkMode(val);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
