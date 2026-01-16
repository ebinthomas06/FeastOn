import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, type ThemeColors } from '../assets/constants/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Check system preference or local storage on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as ThemeMode;
    if (savedTheme) {
      setMode(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('app_theme', newMode);
  };

  const colors = mode === 'light' ? lightTheme : darkTheme;

  // Apply background color to the body instantly
  useEffect(() => {
    document.body.style.backgroundColor = colors.ui.background;
    document.body.style.color = colors.text.primary;
  }, [mode, colors]);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};