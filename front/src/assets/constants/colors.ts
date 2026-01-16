export type ThemeColors = {
  primary: { main: string; dark: string; light: string; text: string };
  success: { main: string; background: string };
  error: { main: string; background: string };
  warning: { main: string; background: string };
  text: { primary: string; secondary: string; disabled: string };
  ui: { white: string; background: string; border: string; card: string; hover: string };
};

// ☀️ Light Theme
export const lightTheme: ThemeColors = {
  primary: { main: '#4CAF50', dark: '#388E3C', light: '#C8E6C9', text: '#FFFFFF' },
  success: { main: '#198754', background: '#d1e7dd' },
  error: { main: '#dc3545', background: '#f8d7da' },
  warning: { main: '#fd7e14', background: '#fff3cd' },
  
  text: { 
    primary: '#212529', 
    secondary: '#6c757d', 
    disabled: '#adb5bd' 
  },
  
  ui: { 
    white: '#FFFFFF', 
    background: '#f8f9fa', 
    border: '#dee2e6', 
    card: '#FFFFFF',
    hover: '#e9ecef'
  },
};

// 🌙 Dark Theme
export const darkTheme: ThemeColors = {
  primary: { main: '#66BB6A', dark: '#81C784', light: '#1B5E20', text: '#000000' },
  
  // Muted background colors for dark mode to prevent eye strain
  success: { main: '#66BB6A', background: '#132e18' }, 
  error: { main: '#e57373', background: '#3e1a1a' }, 
  warning: { main: '#ffa726', background: '#3e2e10' }, 
  
  text: { 
    primary: '#e0e0e0', // Off-white text
    secondary: '#b0b3b8', // Light grey text
    disabled: '#6c757d' 
  },
  
  ui: { 
    white: '#121212', // Dark background for cards
    background: '#000000', // Pitch black for page background (or very dark grey #121212)
    border: '#2d2d2d', // Dark grey borders
    card: '#1E1E1E', // Slightly lighter than background for cards
    hover: '#2d2d2d'
  },
};