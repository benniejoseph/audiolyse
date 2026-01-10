'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  collapsed?: boolean;
}

export function Logo({ size = 'md', collapsed = false }: LogoProps) {
  // Map size prop to dimensions
  const sizes = {
    sm: { icon: 24, text: 16 },
    md: { icon: 32, text: 20 },
    lg: { icon: 40, text: 24 },
    xl: { icon: 48, text: 32 },
  };
  
  const s = sizes[size];

  return (
    <div className="logo-container">
      {/* Icon is always shown, but size/layout might differ */}
      <div className="logo-icon-wrapper">
        <Image
          src="/logoicon.png"
          alt="Audiolyse"
          width={s.icon}
          height={s.icon}
          className="logo-image"
          style={{ width: `${s.icon}px`, height: 'auto', objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Text is only shown when NOT collapsed */}
      {!collapsed && (
        <span 
          className="logo-text"
          style={{
            fontSize: `${s.text}px`,
          }}
        >
          AUDIOLYSE
        </span>
      )}

      <style jsx global>{`
        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-image {
          transition: filter 0.3s ease;
        }

        .logo-text {
          font-family: 'Axiforma', 'Poppins', sans-serif;
          font-weight: 700;
          letter-spacing: 0.05em; /* Tracking for modern look */
          color: var(--text);
          line-height: 1;
        }

        /* Theme Handling */
        /* Assuming logoicon.png is WHITE. 
           In Light Mode (data-theme="light"), we invert it to black.
           Text color is handled by var(--text) which switches automatically.
        */
        
        [data-theme="light"] .logo-image {
          filter: invert(1) brightness(0);
        }
      `}</style>
    </div>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
       <Image
         src="/logoicon.png"
         alt="A"
         fill
         style={{ objectFit: 'contain' }}
         className="logo-image"
       />
    </div>
  );
}
