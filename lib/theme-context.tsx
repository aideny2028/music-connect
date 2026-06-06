'use client';

/**
 * lib/theme-context.tsx — Dark/light mode context.
 *
 * Provides a React context for the current colour theme ('dark' or 'light').
 * Persists the preference in localStorage under 'mc-theme' and applies
 * data-theme="dark|light" to the <html> element so CSS variable overrides
 * in globals.css take effect. Defaults to dark mode on first visit.
 */

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Restore saved preference on first mount, falling back to OS preference
  useEffect(() => {
    const saved = localStorage.getItem('mc-theme') as Theme | null;
    let resolved: Theme;
    if (saved === 'light' || saved === 'dark') {
      resolved = saved;
    } else {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('mc-theme', newTheme);
    // data-theme on <html> is what the CSS selectors target
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
