import { useEffect, useState } from 'react';

const THEMES = {
  dark: 'dark-theme',
  purple: 'purple-theme',
  cyan: 'cyan-theme',
  forest: 'forest-theme',
};

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    Object.values(THEMES).forEach(t => root.classList.remove(t));
    
    // Add current theme class
    if (theme !== 'dark') {
      root.classList.add(THEMES[theme]);
    }
    
    // Save preference
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return { theme, setTheme, THEMES };
}