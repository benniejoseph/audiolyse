'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
}

export function Logo({ size = 'md', showText = true, showTagline = false }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 18, tagline: 8 },
    md: { icon: 36, text: 22, tagline: 10 },
    lg: { icon: 44, text: 28, tagline: 12 },
    xl: { icon: 56, text: 36, tagline: 14 },
  };

  const s = sizes[size];

  return (
    <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? '8px' : '12px' }}>
      {/* SVG Logo Icon - Brain with Microphone */}
      <svg 
        width={s.icon} 
        height={s.icon} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="logo-icon-svg"
      >
        {/* Outer brain curves - Teal */}
        <path 
          d="M16 32C16 24 20 16 32 16C44 16 48 24 48 32" 
          stroke="#1a5a6e" 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none"
        />
        <path 
          d="M12 36C10 28 14 18 32 14C50 18 54 28 52 36" 
          stroke="#1a5a6e" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        
        {/* Inner brain waves - Teal */}
        <path 
          d="M20 30C20 26 24 22 32 22C40 22 44 26 44 30" 
          stroke="#2a7a92" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Audio wave curves - Gold */}
        <path 
          d="M8 40C8 32 16 24 32 24C48 24 56 32 56 40" 
          stroke="#c9a227" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path 
          d="M14 44C14 38 20 32 32 32C44 32 50 38 50 44" 
          stroke="#c9a227" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        
        {/* Microphone body - Gold gradient effect */}
        <rect 
          x="28" 
          y="28" 
          width="8" 
          height="16" 
          rx="4" 
          fill="url(#goldGradient)"
        />
        
        {/* Microphone grille lines */}
        <line x1="30" y1="32" x2="34" y2="32" stroke="#0a0a0a" strokeWidth="1" opacity="0.3"/>
        <line x1="30" y1="35" x2="34" y2="35" stroke="#0a0a0a" strokeWidth="1" opacity="0.3"/>
        <line x1="30" y1="38" x2="34" y2="38" stroke="#0a0a0a" strokeWidth="1" opacity="0.3"/>
        
        {/* Microphone stand */}
        <path 
          d="M32 44V50" 
          stroke="#c9a227" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <path 
          d="M26 50H38" 
          stroke="#c9a227" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        
        {/* Sound waves emanating */}
        <path 
          d="M22 36C22 33 26 30 32 30" 
          stroke="#1a5a6e" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path 
          d="M42 36C42 33 38 30 32 30" 
          stroke="#1a5a6e" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="goldGradient" x1="28" y1="28" x2="36" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e0b82f"/>
            <stop offset="100%" stopColor="#c9a227"/>
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div className="logo-text-container" style={{ display: 'flex', flexDirection: 'column' }}>
          <span 
            className="logo-text-main"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: `${s.text}px`,
              fontWeight: 700,
              letterSpacing: '2px',
              background: 'linear-gradient(135deg, #1a5a6e 0%, #2a7a92 50%, #1a5a6e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AUDIOLYSE
          </span>
          {showTagline && (
            <span 
              className="logo-tagline"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: `${s.tagline}px`,
                fontWeight: 400,
                letterSpacing: '0.5px',
                color: '#c9a227',
                marginTop: '-2px',
              }}
            >
              PRECISION INTELLIGENCE
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
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified brain/audio icon */}
      <circle cx="32" cy="32" r="28" fill="#1a5a6e"/>
      <circle cx="32" cy="32" r="24" fill="#0a1520"/>
      
      {/* Microphone */}
      <rect x="28" y="24" width="8" height="14" rx="4" fill="#c9a227"/>
      <path d="M32 38V44" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 44H38" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* Sound waves */}
      <path d="M22 32C22 28 26 24 32 24" stroke="#c9a227" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M42 32C42 28 38 24 32 24" stroke="#c9a227" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M18 34C18 28 24 22 32 22" stroke="#1a5a6e" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M46 34C46 28 40 22 32 22" stroke="#1a5a6e" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
    </svg>
  );
}

