'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
}

export function Logo({ size = 'md', showText = false, showTagline = false }: LogoProps) {
  const sizes = {
    sm: { icon: 48, text: 18, tagline: 8 },
    md: { icon: 120, text: 22, tagline: 10 },
    lg: { icon: 150, text: 28, tagline: 12 },
    xl: { icon: 180, text: 36, tagline: 14 },
  };

  const s = sizes[size];

  return (
    <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? '8px' : '12px' }}>
      {/* Logo Image - Brain with Microphone */}
      <div 
        className="logo-image-wrapper"
        style={{
          width: `${s.icon}px`,
          height: `${s.icon}px`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <Image
          src="/Full Logo.png"
          alt="Audiolyse Logo"
          width={s.icon}
          height={s.icon}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          priority
        />
      </div>

      {showText && (
        <div className="logo-text-container" style={{ display: 'flex', flexDirection: 'column' }}>
          <span 
            className="logo-text-main"
            style={{
              fontFamily: "'Monoton', cursive",
              fontSize: `${s.text}px`,
              fontWeight: 400,
              letterSpacing: '2px',
              background: 'linear-gradient(135deg, #00d9ff 0%, #8b5cf6 50%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
            }}
          >
            Audiolyse
          </span>
          {showTagline && (
            <span 
              className="logo-tagline"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: `${s.tagline}px`,
                fontWeight: 400,
                letterSpacing: '0.8px',
                color: '#94a3b8',
                marginTop: '2px',
                textTransform: 'uppercase',
              }}
            >
              Precision Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone icon for favicon or small uses
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
      }}
    >
      <Image
        src="/Full Logo.png"
        alt="Audiolyse Logo"
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

