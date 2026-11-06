import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorSchemeType = 'copper';

interface ThemeContextType {
  colorScheme: ColorSchemeType;
  setColorScheme: (scheme: ColorSchemeType) => void;
  isCopper: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'sonne_mond_color_scheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme] = useState<ColorSchemeType>('copper');

  const setColorScheme = (_scheme: ColorSchemeType) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THEME_KEY, 'copper');
      document.documentElement.classList.add('theme-copper');
      document.body.classList.add('theme-copper');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THEME_KEY, 'copper');
      document.documentElement.classList.add('theme-copper');
      document.body.classList.add('theme-copper');
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme: 'copper',
        setColorScheme,
        isCopper: true,
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
