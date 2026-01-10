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
  ChevronRight
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
            style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px' }}
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

      <style jsx>{`
        /* Styles handled by globals.css now for cleaner separation */
        .sidebar {
          /* Additional component-specific overrides if needed */
        }
        
        .collapse-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 50%;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          margin: 0 auto;
        }

        .collapse-btn:hover {
          background: var(--accent);
          color: var(--text-inverse);
          border-color: var(--accent);
        }
      `}</style>
    </aside>
  );
}
