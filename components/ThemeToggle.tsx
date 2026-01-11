'use client';

import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

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
      <div className="theme-toggle-container" style={{ opacity: 0 }}>
        <div className="theme-toggle-track"></div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <>
      <button
        onClick={toggleTheme}
        className={`theme-toggle-track ${isDark ? 'dark' : 'light'}`}
        aria-label="Toggle theme"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Stars (visible in dark mode) */}
        <div className="stars">
          <span className="star star-1">✦</span>
          <span className="star star-2">•</span>
          <span className="star star-3">✦</span>
          <span className="star star-4">•</span>
          <span className="star star-5">✧</span>
        </div>
        
        {/* Clouds (visible in light mode) */}
        <div className="clouds">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
        </div>
        
        {/* Toggle knob with sun/moon */}
        <div className="toggle-knob">
          {isDark ? (
            // Moon with craters
            <div className="moon">
              <div className="crater crater-1"></div>
              <div className="crater crater-2"></div>
              <div className="crater crater-3"></div>
            </div>
          ) : (
            // Sun with glow
            <div className="sun"></div>
          )}
        </div>
      </button>
      
      <style jsx>{`
        .theme-toggle-track {
          position: relative;
          width: 60px;
          height: 30px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .theme-toggle-track.dark {
          background: linear-gradient(180deg, #1a1f36 0%, #2d3454 100%);
        }
        
        .theme-toggle-track.light {
          background: linear-gradient(180deg, #87CEEB 0%, #B8E0F7 100%);
        }
        
        /* Stars */
        .stars {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .theme-toggle-track.dark .stars {
          opacity: 1;
        }
        
        .star {
          position: absolute;
          color: #fff;
          font-size: 6px;
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .star-1 { left: 8px; top: 6px; animation-delay: 0s; }
        .star-2 { left: 16px; top: 18px; font-size: 4px; animation-delay: 0.3s; }
        .star-3 { left: 24px; top: 8px; animation-delay: 0.6s; }
        .star-4 { left: 12px; top: 22px; font-size: 3px; animation-delay: 0.9s; }
        .star-5 { left: 20px; top: 14px; font-size: 5px; animation-delay: 1.2s; }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Clouds */
        .clouds {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .theme-toggle-track.light .clouds {
          opacity: 1;
        }
        
        .cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
        }
        
        .cloud-1 {
          width: 20px;
          height: 10px;
          right: 6px;
          bottom: 4px;
          border-radius: 10px;
        }
        
        .cloud-2 {
          width: 14px;
          height: 8px;
          right: 16px;
          bottom: 8px;
          border-radius: 8px;
        }
        
        .cloud-3 {
          width: 10px;
          height: 6px;
          right: 12px;
          bottom: 2px;
          border-radius: 6px;
        }
        
        /* Toggle knob */
        .toggle-knob {
          position: absolute;
          top: 3px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .theme-toggle-track.dark .toggle-knob {
          left: calc(100% - 27px);
        }
        
        .theme-toggle-track.light .toggle-knob {
          left: 3px;
        }
        
        /* Sun */
        .sun {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(180deg, #FFD93D 0%, #F9A825 100%);
          box-shadow: 
            0 0 8px rgba(255, 217, 61, 0.6),
            0 0 16px rgba(255, 217, 61, 0.3);
        }
        
        /* Moon */
        .moon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(180deg, #E8E8E8 0%, #C0C0C0 100%);
          box-shadow: 
            0 0 8px rgba(200, 200, 200, 0.4),
            0 0 16px rgba(200, 200, 200, 0.2);
          position: relative;
        }
        
        .crater {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(180deg, #B0B0B0 0%, #909090 100%);
        }
        
        .crater-1 {
          width: 8px;
          height: 8px;
          top: 4px;
          right: 4px;
        }
        
        .crater-2 {
          width: 5px;
          height: 5px;
          bottom: 6px;
          left: 5px;
        }
        
        .crater-3 {
          width: 4px;
          height: 4px;
          top: 12px;
          right: 8px;
        }
        
        .theme-toggle-track:hover {
          transform: scale(1.05);
        }
        
        .theme-toggle-track:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
}
