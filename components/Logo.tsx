'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizes = {
    sm: { text: 16, tagline: 10 },
    md: { text: 20, tagline: 11 },
    lg: { text: 26, tagline: 13 },
    xl: { text: 32, tagline: 14 },
  };

  const s = sizes[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span 
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: `${s.text}px`,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: 'var(--text)',
        }}
      >
        Audiolyse
      </span>
      {showTagline && (
        <span 
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: `${s.tagline}px`,
            fontWeight: 400,
            color: 'var(--muted)',
            marginTop: '2px',
          }}
        >
          Call Analytics
        </span>
      )}
    </div>
  );
}

// For favicon representation
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: `${size * 0.5}px`,
        fontWeight: 700,
        color: 'var(--text)',
      }}
    >
      A
    </span>
  );
}
