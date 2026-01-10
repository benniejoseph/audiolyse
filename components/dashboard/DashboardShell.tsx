'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic margin matches sidebar width directly (no floating gap)
  const marginLeft = isSidebarCollapsed 
    ? 'var(--sidebar-width-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        closeMobile={() => setIsMobileMenuOpen(false)}
      />
      
      <main 
        className="dashboard-main"
        style={{ marginLeft }}
      >
        <TopBar onMobileMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="dashboard-content">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0 !important;
            padding-top: 0;
          }
        }
      `}</style>
    </div>
  );
}
