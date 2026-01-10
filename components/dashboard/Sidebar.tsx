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
  { href: '/knowledge', icon: '📚', label: 'Knowledge Base' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
  { href: '/security', icon: '🔐', label: 'Security' },
  { href: '/compliance', icon: '🛡️', label: 'Compliance' },
  { href: '/credits', icon: '💳', label: 'Buy Credits', showForPayg: true },
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

      // Check admin status and role
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

      // Use API route to bypass RLS issues
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
          // Hide credits link unless user is on payg tier
          if (item.showForPayg && subscriptionTier !== 'payg') {
            return null;
          }
          // Hide manager-only links for non-managers
          if ((item as any).showForManager && !isManager) {
            return null;
          }
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
        
        {/* Admin Link */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`nav-item admin-link ${pathname === '/admin' ? 'active' : ''}`}
          >
            <span className="nav-icon">🔐</span>
            <span className="nav-label">Admin Panel</span>
            <span className="nav-badge admin">ADMIN</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <ThemeToggle />
        </div>
        {isAdmin ? (
          <div className="admin-badge-card">
            <span className="admin-icon">👑</span>
            <span className="admin-text">Admin Account</span>
            <span className="admin-subtext">Unlimited Access</span>
          </div>
        ) : (
          <div className="usage-card">
            <div className="usage-header">
              <span>Usage This Month</span>
              <span className="usage-count">{usage.used}/{usage.limit} calls</span>
            </div>
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ 
                  width: `${usagePercent}%`,
                  backgroundColor: usagePercent >= 100 ? '#ff6b6b' : usagePercent >= 80 ? '#ffd166' : '#c9a227'
                }}
              ></div>
            </div>
            <Link href="/pricing" className="upgrade-link">
              Upgrade for more →
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-link {
          border-top: 1px solid rgba(201, 162, 39, 0.2);
          margin-top: 8px;
          padding-top: 8px;
        }
        .nav-badge.admin {
          background: linear-gradient(135deg, #c9a227, #e0b82f);
          color: #0a0a0a;
        }
        .admin-badge-card {
          background: linear-gradient(135deg, rgba(201, 162, 39, 0.2), rgba(26, 90, 110, 0.2));
          border: 1px solid rgba(201, 162, 39, 0.3);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }
        .admin-icon {
          font-size: 24px;
          display: block;
          margin-bottom: 8px;
        }
        .admin-text {
          display: block;
          color: #c9a227;
          font-weight: 600;
          font-size: 14px;
        }
        .admin-subtext {
          display: block;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </aside>
  );
}
