'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizes = {
    sm: { text: 18, tagline: 10 },
    md: { text: 24, tagline: 12 },
    lg: { text: 32, tagline: 14 },
    xl: { text: 40, tagline: 16 },
  };

  const s = sizes[size];

  return (
    <div className="logo-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <span 
        className="logo-text-main"
        style={{
          fontFamily: "'Monoton', cursive",
          fontSize: `${s.text}px`,
          fontWeight: 400,
          letterSpacing: '3px',
          color: '#ffffff',
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
            marginTop: '4px',
            textTransform: 'uppercase',
          }}
        >
          Precision Intelligence
        </span>
      )}
    </div>
  );
}

// For favicon - just returns null since we don't have an icon anymore
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: "'Monoton', cursive",
        fontSize: `${size * 0.6}px`,
        fontWeight: 400,
        letterSpacing: '1px',
        color: '#ffffff',
        textTransform: 'uppercase',
      }}
    >
      A
    </span>
  );
}
