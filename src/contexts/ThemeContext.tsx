import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  resetColors: () => void;
}

const defaultColors: ThemeColors = {
  primary: '45 100% 70%',
  secondary: '45 80% 55%',
  accent: '45 95% 65%',
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColorsState] = useState<ThemeColors>(() => {
    const saved = localStorage.getItem('theme-colors');
    return saved ? JSON.parse(saved) : defaultColors;
  });

  useEffect(() => {
    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--secondary', colors.secondary);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--ring', colors.primary);
    document.documentElement.style.setProperty('--sidebar-primary', colors.primary);
    document.documentElement.style.setProperty('--sidebar-accent-foreground', colors.primary);
    document.documentElement.style.setProperty('--sidebar-ring', colors.primary);
    
    // Update gradient colors
    document.documentElement.style.setProperty('--gradient-gold', `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.secondary}) 100%)`);
    document.documentElement.style.setProperty('--gradient-accent', `linear-gradient(to right, hsl(${colors.primary}), hsl(${colors.accent}))`);
    document.documentElement.style.setProperty('--shadow-glow', `0 0 40px hsl(${colors.primary} / 0.25)`);
    
    // Save to localStorage
    localStorage.setItem('theme-colors', JSON.stringify(colors));
  }, [colors]);

  const setColors = (newColors: ThemeColors) => {
    setColorsState(newColors);
  };

  const resetColors = () => {
    setColorsState(defaultColors);
    localStorage.removeItem('theme-colors');
  };

  return (
    <ThemeContext.Provider value={{ colors, setColors, resetColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
