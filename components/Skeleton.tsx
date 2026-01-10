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
    <div className="dashboard-skeleton">
      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div>
          <Skeleton style={{ width: '180px', height: '28px', marginBottom: '8px' }} />
          <Skeleton style={{ width: '280px', height: '16px' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Skeleton style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
          <Skeleton style={{ width: '160px', height: '40px', borderRadius: '10px' }} />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="skeleton-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-stat-card">
            <Skeleton style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ width: '50px', height: '24px', marginBottom: '6px' }} />
              <Skeleton style={{ width: '80px', height: '14px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="skeleton-grid">
        {/* Main Column */}
        <div className="skeleton-main">
          {/* Quick Actions Skeleton */}
          <div className="skeleton-card">
            <Skeleton style={{ width: '140px', height: '20px', marginBottom: '20px' }} />
            <div className="skeleton-actions">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-action-item">
                  <Skeleton style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ width: '100px', height: '14px', marginBottom: '4px' }} />
                    <Skeleton style={{ width: '150px', height: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Calls Skeleton */}
          <div className="skeleton-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <Skeleton style={{ width: '120px', height: '20px' }} />
              <Skeleton style={{ width: '70px', height: '20px' }} />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-call-item">
                <Skeleton style={{ width: '10px', height: '10px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: '180px', height: '14px', marginBottom: '4px' }} />
                  <Skeleton style={{ width: '120px', height: '12px' }} />
                </div>
                <Skeleton style={{ width: '36px', height: '24px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Side Column */}
        <div className="skeleton-side">
          {/* Notifications Skeleton */}
          <div className="skeleton-card">
            <Skeleton style={{ width: '140px', height: '24px', marginBottom: '8px' }} />
            <Skeleton style={{ width: '200px', height: '14px', marginBottom: '24px' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-notif-item">
                <Skeleton style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: '160px', height: '13px', marginBottom: '4px' }} />
                  <Skeleton style={{ width: '80px', height: '11px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .dashboard-skeleton {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .skeleton {
          background: var(--item-bg);
          background-image: linear-gradient(
            90deg,
            var(--item-bg) 0px,
            var(--item-hover) 40px,
            var(--item-bg) 80px
          );
          background-size: 200px 100%;
          animation: skeleton-shine 1.5s infinite linear;
          border-radius: 6px;
        }

        @keyframes skeleton-shine {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .skeleton-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .skeleton-stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 16px;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
        }

        .skeleton-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .skeleton-side {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .skeleton-card {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 20px;
        }

        .skeleton-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .skeleton-action-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--item-bg);
          border-radius: 12px;
        }

        .skeleton-call-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: var(--item-bg);
          border-radius: 12px;
          margin-bottom: 10px;
        }

        .skeleton-notif-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 8px;
          margin-bottom: 8px;
        }

        @media (max-width: 1024px) {
          .skeleton-grid {
            grid-template-columns: 1fr;
          }

          .skeleton-side {
            order: -1;
          }
        }

        @media (max-width: 640px) {
          .skeleton-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .skeleton-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
