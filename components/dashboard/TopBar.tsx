'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organization } from '@/lib/types/database';
import { ChevronDown, Settings, HelpCircle, LogOut } from 'lucide-react';

export function TopBar() {
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
        <h1 className="page-title">
          {/* Will be set by each page */}
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
        .item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }
      `}</style>
    </header>
  );
}
