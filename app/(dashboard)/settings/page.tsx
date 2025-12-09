'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organization } from '@/lib/types/database';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'billing' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || '');
          setPhone(profileData.phone || '');
        }

        // Get organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          const { data: organization } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single();

          if (organization) {
            setOrg(organization);
            setOrgName(organization.name);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: fullName, phone });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!org) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName })
        .eq('id', org.id);

      if (error) throw error;

      setOrg({ ...org, name: orgName });
      setMessage({ type: 'success', text: 'Organization updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const tierLimits = org ? SUBSCRIPTION_LIMITS[org.subscription_tier] : null;

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loader"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={activeTab === 'organization' ? 'active' : ''} onClick={() => setActiveTab('organization')}>Organization</button>
        <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>Billing</button>
        <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>Security</button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile?.email || ''} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select value={profile?.currency || 'INR'} disabled>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab === 'organization' && (
          <div className="settings-section">
            <h3>Organization Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Organization Name</label>
                <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Company name" />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" value={org?.slug || ''} disabled />
              </div>
            </div>
            <button className="save-btn" onClick={handleSaveOrg} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <div className="usage-stats">
              <h4>Usage Statistics</h4>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">Calls Used</span>
                  <span className="stat-value">{org?.calls_used || 0} / {org?.calls_limit || 3}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Storage Used</span>
                  <span className="stat-value">{((org?.storage_used_mb || 0)).toFixed(1)} MB / {(org?.storage_limit_mb || 50)} MB</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Team Members</span>
                  <span className="stat-value">1 / {org?.users_limit || 1}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="settings-section">
            <h3>Subscription & Billing</h3>
            <div className="current-plan">
              <div className="plan-info">
                <span className="plan-name">{org?.subscription_tier?.charAt(0).toUpperCase()}{org?.subscription_tier?.slice(1)} Plan</span>
                <span className={`plan-status status-${org?.subscription_status}`}>{org?.subscription_status}</span>
              </div>
              <p className="plan-price">
                {tierLimits?.price.INR === 0 ? 'Free' : `₹${tierLimits?.price.INR}/month`}
              </p>
              {org?.current_period_end && (
                <p className="plan-renewal">
                  Renews on {new Date(org.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="plan-features">
              <h4>Plan Features</h4>
              <ul>
                <li>✓ {tierLimits?.calls} calls/month</li>
                <li>✓ {tierLimits?.users === 999 ? 'Unlimited' : tierLimits?.users} users</li>
                <li>✓ {tierLimits?.historyDays} days history</li>
                <li>{tierLimits?.features.bulkUpload ? '✓' : '✗'} Bulk upload</li>
                <li>{tierLimits?.features.pdfExport ? '✓' : '✗'} PDF export</li>
                <li>{tierLimits?.features.teamManagement ? '✓' : '✗'} Team management</li>
              </ul>
            </div>

            <a href="/pricing" className="upgrade-plan-btn">
              {org?.subscription_tier === 'enterprise' ? 'View Plans' : 'Upgrade Plan'}
            </a>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <h3>Change Password</h3>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <button className="save-btn" onClick={handleChangePassword} disabled={saving || !newPassword}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>

            <div className="danger-zone">
              <h4>Danger Zone</h4>
              <p>Permanently delete your account and all data. This action cannot be undone.</p>
              <button className="delete-btn">Delete Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
