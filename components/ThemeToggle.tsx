'use client';

import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  let theme: 'dark' | 'light' = 'dark';
  let toggleTheme: () => void = () => {};

  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (e) {
    // ThemeProvider not available yet (SSR)
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="theme-toggle-btn"
        aria-label="Toggle theme"
        style={{ opacity: 0 }}
      >
        <Sun size={18} />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      
      <style jsx>{`
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          background: var(--bg-tertiary);
          border: 1px solid var(--sidebar-border);
          border-radius: 8px;
          color: var(--sidebar-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .theme-toggle-btn:hover {
          background: var(--accent-light);
          color: var(--accent);
          border-color: var(--accent);
        }
      `}</style>
    </>
  );
}
