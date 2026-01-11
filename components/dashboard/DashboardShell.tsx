'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Reverted to Floating Sidebar Logic:
  // Calculate dynamic margin based on sidebar state + double margin (left+gap)
  const marginLeft = isSidebarCollapsed 
    ? 'calc(var(--sidebar-width-collapsed) + var(--sidebar-margin) * 2)'
    : 'calc(var(--sidebar-width) + var(--sidebar-margin) * 2)';

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
            margin-top: 0;
            padding-top: 20px;
          }
        }
      `}</style>
    </div>
  );
}
