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
        style={{ opacity: 0, width: '100%' }}
      >
        <span><Sun size={16} /></span>
        <span>Light</span>
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
        <span className="theme-icon">{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span>
        <span className="theme-label">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
      </button>
      
      <style jsx>{`
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-secondary);
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .theme-toggle-btn:hover {
          background: var(--border);
          color: var(--text);
        }
        
        .theme-icon {
          display: flex;
          align-items: center;
        }
        
        @media (max-width: 1024px) {
          .theme-label {
            display: none;
          }
          
          .theme-toggle-btn {
            width: auto;
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
}
