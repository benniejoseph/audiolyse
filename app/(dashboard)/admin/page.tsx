'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  org_name: string;
  calls_used: number;
  calls_limit: number;
  subscription_tier: string;
}

interface Stats {
  totalUsers: number;
  totalOrgs: number;
  totalAnalyses: number;
  activeToday: number;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newLimit, setNewLimit] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadData();
      setLoading(false);
    }

    checkAdmin();
  }, [supabase, router]);

  async function loadData() {
    // Load users with their orgs
    const { data: usersData } = await supabase.rpc('get_admin_users_data');
    
    if (usersData) {
      setUsers(usersData);
    } else {
      // Fallback: manual query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_admin, created_at');
      
      if (profiles) {
        const usersWithOrgs = await Promise.all(profiles.map(async (p) => {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', p.id)
            .single();
          
          let org = null;
          if (membership) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('name, calls_used, calls_limit, subscription_tier')
              .eq('id', membership.organization_id)
              .single();
            org = orgData;
          }
          
          return {
            ...p,
            org_name: org?.name || 'No org',
            calls_used: org?.calls_used || 0,
            calls_limit: org?.calls_limit || 0,
            subscription_tier: org?.subscription_tier || 'free',
          };
        }));
        setUsers(usersWithOrgs);
      }
    }

    // Load stats
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    const { count: analysisCount } = await supabase.from('call_analyses').select('*', { count: 'exact', head: true });
    
    setStats({
      totalUsers: userCount || 0,
      totalOrgs: orgCount || 0,
      totalAnalyses: analysisCount || 0,
      activeToday: 0,
    });
  }

  async function updateUserLimit(userId: string, newLimitValue: number) {
    // Find user's org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (membership) {
      await supabase
        .from('organizations')
        .update({ calls_limit: newLimitValue })
        .eq('id', membership.organization_id);
      
      await loadData();
      setSelectedUser(null);
      setNewLimit('');
    }
  }

  async function toggleAdmin(userId: string, currentStatus: boolean) {
    await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);
    
    await loadData();
  }

  async function resetUsage(userId: string) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (membership) {
      await supabase
        .from('organizations')
        .update({ calls_used: 0 })
        .eq('id', membership.organization_id);
      
      await loadData();
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🔐 Admin Panel</h1>
        <p>Manage users, organizations, and system settings</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalOrgs}</span>
            <span className="stat-label">Organizations</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalAnalyses}</span>
            <span className="stat-label">Total Analyses</span>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="admin-section">
        <h2>Users</h2>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Organization</th>
                <th>Usage</th>
                <th>Tier</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <span className="user-name">{user.full_name || 'Unknown'}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </td>
                  <td>{user.org_name}</td>
                  <td>
                    <span className={user.calls_used >= user.calls_limit ? 'limit-reached' : ''}>
                      {user.calls_used} / {user.calls_limit}
                    </span>
                  </td>
                  <td>
                    <span className={`tier-badge tier-${user.subscription_tier}`}>
                      {user.subscription_tier}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`admin-toggle ${user.is_admin ? 'active' : ''}`}
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                    >
                      {user.is_admin ? '✓ Admin' : 'Make Admin'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn"
                        onClick={() => { setSelectedUser(user); setNewLimit(String(user.calls_limit)); }}
                      >
                        Edit Limit
                      </button>
                      <button 
                        className="action-btn reset"
                        onClick={() => resetUsage(user.id)}
                      >
                        Reset Usage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Call Limit</h3>
            <p>User: {selectedUser.email}</p>
            <div className="form-group">
              <label>New Call Limit</label>
              <input 
                type="number" 
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                min="0"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedUser(null)}>Cancel</button>
              <button 
                className="primary"
                onClick={() => updateUserLimit(selectedUser.id, parseInt(newLimit))}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .admin-header {
          margin-bottom: 32px;
        }
        .admin-header h1 {
          font-size: 28px;
          color: #fff;
          margin: 0 0 8px;
        }
        .admin-header p {
          color: rgba(255,255,255,0.6);
          margin: 0;
        }
        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: rgba(255,255,255,0.6);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(201, 162, 39, 0.2);
          border-top-color: #c9a227;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: rgba(26, 90, 110, 0.15);
          border: 1px solid rgba(201, 162, 39, 0.2);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 36px;
          font-weight: 700;
          color: #c9a227;
        }
        .stat-label {
          color: rgba(255,255,255,0.6);
          font-size: 14px;
        }
        .admin-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .admin-section h2 {
          color: #fff;
          font-size: 20px;
          margin: 0 0 20px;
        }
        .users-table-wrapper {
          overflow-x: auto;
        }
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-table th {
          text-align: left;
          padding: 12px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          font-size: 13px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .users-table td {
          padding: 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
        }
        .user-cell {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-weight: 500;
          color: #fff;
        }
        .user-email {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
        }
        .limit-reached {
          color: #ff6b6b;
        }
        .tier-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .tier-free { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
        .tier-individual { background: rgba(79, 172, 254, 0.2); color: #4facfe; }
        .tier-team { background: rgba(201, 162, 39, 0.2); color: #c9a227; }
        .tier-enterprise { background: rgba(167, 139, 250, 0.2); color: #a78bfa; }
        .admin-toggle {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .admin-toggle:hover {
          border-color: #c9a227;
          color: #c9a227;
        }
        .admin-toggle.active {
          background: rgba(34, 197, 94, 0.2);
          border-color: #22c55e;
          color: #22c55e;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(201, 162, 39, 0.3);
          background: rgba(201, 162, 39, 0.1);
          color: #c9a227;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: rgba(201, 162, 39, 0.2);
        }
        .action-btn.reset {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .action-btn.reset:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #1a1a2e;
          border: 1px solid rgba(201, 162, 39, 0.3);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 400px;
        }
        .modal h3 {
          color: #fff;
          margin: 0 0 8px;
        }
        .modal p {
          color: rgba(255,255,255,0.6);
          margin: 0 0 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          margin-bottom: 8px;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 16px;
        }
        .form-group input:focus {
          outline: none;
          border-color: #c9a227;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .modal-actions button {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .modal-actions button:first-child {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
        }
        .modal-actions button.primary {
          background: linear-gradient(135deg, #c9a227, #e0b82f);
          color: #0a0a0a;
        }
        .modal-actions button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(201, 162, 39, 0.3);
        }
      `}</style>
    </div>
  );
}

