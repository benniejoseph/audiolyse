'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/analyze', icon: '🎙️', label: 'Analyze Calls' },
  { href: '/history', icon: '📁', label: 'History' },
  { href: '/team', icon: '👥', label: 'Team', badge: 'PRO' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-logo">
          <Image 
            src="/logo.png" 
            alt="Audiolyse" 
            width={140} 
            height={38}
            className="sidebar-logo-img"
          />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="usage-card">
          <div className="usage-header">
            <span>Usage This Month</span>
            <span className="usage-count">0/3 calls</span>
          </div>
          <div className="usage-bar">
            <div className="usage-fill" style={{ width: '0%' }}></div>
          </div>
          <Link href="/pricing" className="upgrade-link">
            Upgrade for more →
          </Link>
        </div>
      </div>
    </aside>
  );
}
