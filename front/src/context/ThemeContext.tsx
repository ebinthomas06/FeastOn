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
  // Initialize state by checking localStorage immediately
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('app_theme') as ThemeMode;
    // If a valid saved theme exists (light or dark), use it (persists on reload)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // If no saved theme exists (first visit), force 'light'
    return 'light'; 
  });

  // Save preference to localStorage whenever the mode changes
  useEffect(() => {
    localStorage.setItem('app_theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
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
