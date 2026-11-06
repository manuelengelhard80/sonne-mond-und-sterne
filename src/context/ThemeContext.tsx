import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorSchemeType = 'copper' | 'gold';

interface ThemeContextType {
  colorScheme: ColorSchemeType;
  setColorScheme: (scheme: ColorSchemeType) => void;
  isCopper: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'sonne_mond_color_scheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorSchemeType>(() => {
    if (typeof window === 'undefined') return 'copper';
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return (saved === 'gold' || saved === 'copper') ? saved : 'copper'; // Default to 'copper' so user immediately sees the requested new copper scheme!
  });

  const setColorScheme = (scheme: ColorSchemeType) => {
    setColorSchemeState(scheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THEME_KEY, scheme);
      if (scheme === 'copper') {
        document.documentElement.classList.add('theme-copper');
        document.body.classList.add('theme-copper');
        document.documentElement.classList.remove('theme-gold');
        document.body.classList.remove('theme-gold');
      } else {
        document.documentElement.classList.remove('theme-copper');
        document.body.classList.remove('theme-copper');
        document.documentElement.classList.add('theme-gold');
        document.body.classList.add('theme-gold');
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (colorScheme === 'copper') {
        document.documentElement.classList.add('theme-copper');
        document.body.classList.add('theme-copper');
        document.documentElement.classList.remove('theme-gold');
        document.body.classList.remove('theme-gold');
      } else {
        document.documentElement.classList.remove('theme-copper');
        document.body.classList.remove('theme-copper');
        document.documentElement.classList.add('theme-gold');
        document.body.classList.add('theme-gold');
      }
    }
  }, [colorScheme]);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        setColorScheme,
        isCopper: colorScheme === 'copper',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
