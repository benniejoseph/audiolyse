'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean; // Kept for backward compatibility but unused in image mode
  collapsed?: boolean;
}

export function Logo({ size = 'md', collapsed = false }: LogoProps) {
  // Map size prop to width values for the Full Logo
  const sizeMap = {
    sm: 100,
    md: 140,
    lg: 180,
    xl: 220
  };
  
  const width = sizeMap[size] || 140;

  return (
    <div className="logo-container">
      {collapsed ? (
        <div className="logo-icon-wrapper">
          <Image
            src="/logoicon.png"
            alt="Audiolyse"
            width={40}
            height={40}
            className="logo-image icon-mode"
            priority
          />
        </div>
      ) : (
        <div className="logo-full-wrapper">
          <Image
            src="/Full_Logo.png"
            alt="Audiolyse"
            width={width}
            height={50} // Aspect ratio is handled by style width/height auto
            className="logo-image full-mode"
            style={{ width: `${width}px`, height: 'auto', objectFit: 'contain' }}
            priority
          />
        </div>
      )}

      <style jsx global>{`
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-image {
          transition: filter 0.3s ease;
        }

        /* Theme Handling: "black for light and white for dark theme" */
        /* Assuming source images are WHITE text/icons (standard for dark mode apps) */
        
        [data-theme="light"] .logo-image {
          filter: invert(1) brightness(0); /* Turns white to black */
        }
        
        /* If the images are colored, this forces them to black in light mode. */
        /* In dark mode, they display as original (assumed white/light). */
      `}</style>
    </div>
  );
}

// Keeping LogoIcon for fallback or other usages
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
