'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/analyze', icon: '🎙️', label: 'Analyze Calls' },
  { href: '/history', icon: '📁', label: 'History' },
  { href: '/customers', icon: '👤', label: 'Customers' },
  { href: '/team', icon: '👥', label: 'Team', badge: 'PRO' },
  { href: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { href: '/coaching', icon: '🎯', label: 'Coaching', showForManager: true },
  { href: '/knowledge', icon: '📚', label: 'Knowledge' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
  { href: '/security', icon: '🔐', label: 'Security' },
  { href: '/compliance', icon: '🛡️', label: 'Compliance' },
  { href: '/credits', icon: '💳', label: 'Credits', showForPayg: true },
  { href: '/transactions', icon: '📋', label: 'Transactions', showForPayg: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 10 });
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
          setUsage({ 
            used: data.organization.calls_used, 
            limit: data.organization.calls_limit 
          });
          setSubscriptionTier(data.organization.subscription_tier);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    }

    loadUserData();
  }, [supabase]);

  const usagePercent = Math.min((usage.used / usage.limit) * 100, 100);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-logo">
          <Logo size="md" />
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
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
        
        {isAdmin && (
          <Link
            href="/admin"
            className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}
            style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}
          >
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Admin</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle-wrapper">
          <ThemeToggle />
        </div>
        
        {!isAdmin && (
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-title">Monthly Usage</span>
              <span className="usage-count">{usage.used}/{usage.limit}</span>
            </div>
            <div className="progress">
              <div 
                className={`progress-bar ${usagePercent >= 90 ? 'danger' : usagePercent >= 70 ? 'warning' : ''}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <Link href="/pricing" className="upgrade-link">
              Upgrade Plan
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .theme-toggle-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .usage-card {
          background: var(--bg-tertiary);
          border-radius: 8px;
          padding: 16px;
        }
        
        .usage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .usage-title {
          font-size: 12px;
          font-weight: 500;
          color: var(--muted);
        }
        
        .usage-count {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }
        
        .upgrade-link {
          display: block;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: var(--accent);
          margin-top: 12px;
          text-decoration: none;
        }
        
        .upgrade-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </aside>
  );
}
