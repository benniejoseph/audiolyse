export function Skeleton({ 
  className = "", 
  style = {} 
}: { 
  className?: string; 
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={style}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <Skeleton style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
          <Skeleton style={{ width: '300px', height: '20px' }} />
        </div>
        <Skeleton style={{ width: '120px', height: '40px', borderRadius: '12px' }} />
      </div>

      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <Skeleton style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
            <div style={{ flex: 1, marginLeft: '1rem' }}>
              <Skeleton style={{ width: '60px', height: '32px', marginBottom: '4px' }} />
              <Skeleton style={{ width: '100px', height: '16px' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="recent-calls-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <Skeleton style={{ width: '150px', height: '28px' }} />
          <Skeleton style={{ width: '80px', height: '20px' }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="call-item" style={{ marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <Skeleton style={{ width: '200px', height: '20px', marginBottom: '4px' }} />
              <Skeleton style={{ width: '150px', height: '14px' }} />
            </div>
            <Skeleton style={{ width: '40px', height: '24px' }} />
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        .skeleton {
          background: var(--bg-secondary);
          background-image: linear-gradient(
            90deg,
            var(--bg-secondary) 0px,
            var(--bg-tertiary) 40px,
            var(--bg-secondary) 80px
          );
          background-size: 200px 100%;
          animation: skeleton-shine 1.5s infinite linear;
          border-radius: 4px;
        }
        @keyframes skeleton-shine {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
      `}</style>
    </div>
  );
}
