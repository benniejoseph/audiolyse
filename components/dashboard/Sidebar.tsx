'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Mic, 
  FolderOpen, 
  Users, 
  Trophy, 
  Target, 
  BookOpen, 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  Zap, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { href: '/analyze', icon: <Mic size={20} />, label: 'Analyze Calls' },
  { href: '/history', icon: <FolderOpen size={20} />, label: 'History' },
  { href: '/customers', icon: <Users size={20} />, label: 'Customers' },
  { href: '/team', icon: <Users size={20} />, label: 'Team', badge: 'PRO' },
  { href: '/leaderboard', icon: <Trophy size={20} />, label: 'Leaderboard' },
  { href: '/coaching', icon: <Target size={20} />, label: 'Coaching', showForManager: true },
  { href: '/knowledge', icon: <BookOpen size={20} />, label: 'Knowledge' },
  { href: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  { href: '/security', icon: <Lock size={20} />, label: 'Security' },
  { href: '/compliance', icon: <ShieldCheck size={20} />, label: 'Compliance' },
  { href: '/credits', icon: <CreditCard size={20} />, label: 'Credits', showForPayg: true },
  { href: '/transactions', icon: <FileText size={20} />, label: 'Transactions', showForPayg: true },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse, isMobileOpen, closeMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileResult, memberResult] = await Promise.all([
        supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
        supabase.from('organization_members').select('role').eq('user_id', user.id).single(),
      ]);
      
      if (profileResult.data?.is_admin) {
        setIsAdmin(true);
      }
      
      if (memberResult.data?.role && ['owner', 'admin', 'manager'].includes(memberResult.data.role)) {
        setIsManager(true);
      }

      try {
        const response = await fetch('/api/organization/me');
        const data = await response.json();
        if (response.ok && data.organization) {
          setSubscriptionTier(data.organization.subscription_tier);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    }

    loadUserData();
  }, [supabase]);

  return (
    <>
      {/* Mobile Header (Only visible on mobile) */}
      <div className="mobile-header">
        <button onClick={toggleCollapse} className="mobile-menu-btn">
          {/* Note: In real mobile layout, we usually toggle isMobileOpen, but for now reuse toggle */}
        </button>
      </div>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo" onClick={closeMobile}>
            <Logo size={isCollapsed ? 'sm' : 'md'} showTagline={!isCollapsed} />
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.showForPayg && subscriptionTier !== 'payg') return null;
            if ((item as any).showForManager && !isManager) return null;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                onClick={closeMobile}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && !isCollapsed && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link
              href="/admin"
              className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}
              title={isCollapsed ? 'Admin' : undefined}
              style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}
              onClick={closeMobile}
            >
              <span className="nav-icon"><Zap size={20} /></span>
              <span className="nav-label">Admin</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <ThemeToggle />
          </div>
          
          <button 
            className="collapse-btn" 
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-header {
          height: var(--header-height);
          display: flex;
          align-items: center;
          padding: 0 24px;
          border-bottom: 1px solid var(--border);
          transition: all 0.3s;
        }

        .sidebar-nav {
          flex: 1;
          padding: 24px 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          border-radius: var(--radius);
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
        }

        .nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text);
        }

        .nav-item.active {
          background: var(--accent-light);
          color: var(--accent);
          border-right: 3px solid var(--accent);
        }

        .nav-icon {
          flex-shrink: 0;
          width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-label {
          transition: opacity 0.2s;
        }

        .nav-badge {
          margin-left: auto;
          background: var(--accent);
          color: var(--text-inverse);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .collapse-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .collapse-btn:hover {
          background: var(--accent);
          color: var(--text-inverse);
          border-color: var(--accent);
        }

        /* Collapsed State Overrides */
        .sidebar.collapsed .sidebar-header {
          padding: 0;
          justify-content: center;
        }

        .sidebar.collapsed .nav-item {
          padding: 12px;
          justify-content: center;
        }

        .sidebar.collapsed .nav-label,
        .sidebar.collapsed .nav-badge,
        .sidebar.collapsed .sidebar-footer-content {
          display: none;
        }

        .sidebar.collapsed .sidebar-footer {
          justify-content: center;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            width: 260px !important; /* Always full width on mobile when open */
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }

          .collapse-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
