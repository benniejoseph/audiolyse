'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organization } from '@/lib/types/database';
import { ChevronDown, Settings, HelpCircle, LogOut, Menu } from 'lucide-react';

interface TopBarProps {
  onMobileMenuClick?: () => void;
}

export function TopBar({ onMobileMenuClick }: TopBarProps) {
  const [user, setUser] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (profile) {
            setUser(profile);
          }

          // Get organization
          const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authUser.id)
            .single();

          if (membership) {
            const { data: organization } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', membership.organization_id)
              .single();
            
            if (organization) {
              setOrg(organization);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={onMobileMenuClick}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>

        <h1 className="page-title">
          {/* Page title placeholder */}
        </h1>
      </div>

      <div className="topbar-right">
        {/* Organization badge */}
        {org && (
          <div className="org-badge">
            <span className="org-name">{org.name}</span>
            <span className={`tier-badge tier-${org.subscription_tier}`}>
              {org.subscription_tier.toUpperCase()}
            </span>
          </div>
        )}

        {/* User dropdown */}
        <div className="user-menu" ref={dropdownRef}>
          <button 
            className="user-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="user-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" />
              ) : (
                <span>{getInitials(user?.full_name || user?.email || null)}</span>
              )}
            </div>
            <span className="user-name">{user?.full_name || user?.email?.split('@')[0]}</span>
            <span className="dropdown-arrow"><ChevronDown size={14} /></span>
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <p className="dropdown-email">{user?.email}</p>
              </div>
              <a href="/settings" className="dropdown-item">
                <span className="item-icon"><Settings size={16} /></span> Settings
              </a>
              <a href="/help" className="dropdown-item">
                <span className="item-icon"><HelpCircle size={16} /></span> Help
              </a>
              <hr className="dropdown-divider" />
              <button onClick={handleLogout} className="dropdown-item logout">
                <span className="item-icon"><LogOut size={16} /></span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .topbar {
          height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 8px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .org-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 99px;
        }

        .org-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--text);
        }

        .tier-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--bg);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .tier-badge.tier-pro {
          background: var(--accent-light);
          color: var(--accent);
          border-color: var(--accent);
        }

        .user-menu {
          position: relative;
        }

        .user-button {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius);
          transition: background 0.2s;
        }

        .user-button:hover {
          background: var(--bg-tertiary);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--text-inverse);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-name {
          font-weight: 500;
          color: var(--text);
          font-size: 14px;
        }

        .dropdown-arrow {
          color: var(--text-secondary);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 240px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          padding: 8px;
          z-index: 100;
        }

        .dropdown-header {
          padding: 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }

        .dropdown-email {
          color: var(--text-secondary);
          font-size: 13px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          color: var(--text);
          text-decoration: none;
          font-size: 14px;
          border-radius: var(--radius-sm);
          transition: background 0.2s;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: var(--bg-tertiary);
        }

        .dropdown-item.logout {
          color: var(--danger);
        }

        .dropdown-item.logout:hover {
          background: var(--danger-bg);
        }

        .dropdown-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 8px 0;
        }

        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          color: var(--text-secondary);
        }

        .dropdown-item.logout .item-icon {
          color: var(--danger);
        }

        @media (max-width: 768px) {
          .topbar {
            padding: 0 16px;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .user-name {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
