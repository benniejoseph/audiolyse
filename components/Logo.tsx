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
          letterSpacing: '-0.02em', // Tighter tracking for modern look
          color: 'var(--text)',
          lineHeight: 1,
        }}
      >
        Audiolyse
      </span>
      {showTagline && (
        <span 
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: `${s.tagline}px`,
            fontWeight: 500,
            color: 'var(--accent)', // Emerald green tagline
            marginTop: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
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
        fontSize: `${size * 0.6}px`,
        fontWeight: 700,
        color: 'var(--text)',
      }}
    >
      A
    </span>
  );
}
