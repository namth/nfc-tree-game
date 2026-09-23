/**
 * Theme Context & Provider
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeColors, darkColors, lightColors } from './colors';
import { Preferences, AppThemeMode } from '../storage/preferences';

interface ThemeContextValue {
  theme: AppThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (mode: AppThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isDark: true,
  colors: darkColors,
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppThemeMode>(() => Preferences.getTheme());

  const setTheme = (mode: AppThemeMode) => {
    setThemeState(mode);
    Preferences.setTheme(mode);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      colors,
      setTheme,
      toggleTheme
    }),
    [theme, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
