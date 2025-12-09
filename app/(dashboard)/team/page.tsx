'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Organization, OrganizationMember, Profile } from '@/lib/types/database';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';

type MemberWithProfile = OrganizationMember & { profile: Profile };

export default function TeamPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadTeam() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's membership and organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .single();

        if (!membership) return;

        setCanManageTeam(['owner', 'admin'].includes(membership.role));

        // Get organization
        const { data: organization } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .single();

        if (organization) {
          setOrg(organization);

          // Get all members with their profiles
          const { data: orgMembers } = await supabase
            .from('organization_members')
            .select('*, profile:profiles(*)')
            .eq('organization_id', organization.id);

          if (orgMembers) {
            setMembers(orgMembers as MemberWithProfile[]);
          }
        }
      } catch (error) {
        console.error('Error loading team:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [supabase]);

  const tierLimits = org ? SUBSCRIPTION_LIMITS[org.subscription_tier] : SUBSCRIPTION_LIMITS.free;
  const hasTeamFeature = tierLimits.features.teamManagement;
  const canAddMore = members.length < (org?.users_limit || 1);

  const handleInvite = async () => {
    if (!org || !inviteEmail) return;
    setInviting(true);
    setMessage(null);

    try {
      // Generate invite token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: { user } } = await supabase.auth.getUser();

      // Create invitation
      const { error } = await supabase
        .from('invitations')
        .insert({
          organization_id: org.id,
          email: inviteEmail,
          role: inviteRole,
          token,
          invited_by: user!.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // In production, send email with invite link
      // For now, just show success message
      setMessage({ 
        type: 'success', 
        text: `Invitation sent to ${inviteEmail}! (Note: Email delivery not configured yet)`
      });
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      setMessage({ type: 'success', text: 'Team member removed successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="team-loading">
        <div className="loader"></div>
        <p>Loading team...</p>
      </div>
    );
  }

  // Show upgrade prompt if team feature not available
  if (!hasTeamFeature) {
    return (
      <div className="team-page">
        <div className="team-upgrade-prompt">
          <div className="upgrade-icon">👥</div>
          <h2>Team Management</h2>
          <p>Upgrade to Team or Enterprise plan to invite team members and collaborate on call analysis.</p>
          <div className="upgrade-features">
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Shared dashboards</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Team performance tracking</span>
            </div>
            <div className="feature">
              <span className="feature-icon">👤</span>
              <span>Role-based access</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📁</span>
              <span>Shared call history</span>
            </div>
          </div>
          <a href="/pricing" className="upgrade-cta">
            Upgrade to Team Plan →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="team-page">
      <div className="team-header">
        <div>
          <h1>Team Management</h1>
          <p>Manage your organization&apos;s team members</p>
        </div>
        {canManageTeam && canAddMore && (
          <button className="invite-btn" onClick={() => setShowInviteModal(true)}>
            + Invite Member
          </button>
        )}
      </div>

      {message && (
        <div className={`team-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="team-stats">
        <div className="stat">
          <span className="stat-value">{members.length}</span>
          <span className="stat-label">Team Members</span>
        </div>
        <div className="stat">
          <span className="stat-value">{org?.users_limit || 1}</span>
          <span className="stat-label">Max Allowed</span>
        </div>
        <div className="stat">
          <span className="stat-value">{(org?.users_limit || 1) - members.length}</span>
          <span className="stat-label">Slots Available</span>
        </div>
      </div>

      <div className="members-list">
        <h3>Team Members</h3>
        {members.map((member) => (
          <div key={member.id} className="member-card">
            <div className="member-avatar">
              {member.profile?.avatar_url ? (
                <img src={member.profile.avatar_url} alt="" />
              ) : (
                <span>{(member.profile?.full_name || member.profile?.email || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="member-info">
              <span className="member-name">{member.profile?.full_name || 'Unnamed'}</span>
              <span className="member-email">{member.profile?.email}</span>
            </div>
            <span className={`member-role role-${member.role}`}>
              {member.role}
            </span>
            <span className="member-joined">
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </span>
            {canManageTeam && member.role !== 'owner' && (
              <button 
                className="member-remove" 
                onClick={() => handleRemoveMember(member.id)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content invite-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInviteModal(false)}>×</button>
            <h2>Invite Team Member</h2>
            <p>Send an invitation to join your organization</p>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}>
                <option value="member">Member - Can analyze and view</option>
                <option value="admin">Admin - Can manage team</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleInvite}
                disabled={!inviteEmail || inviting}
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
