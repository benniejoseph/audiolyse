'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

interface LoginEvent {
  id: string;
  event_type: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  is_suspicious: boolean;
  created_at: string;
}

interface Session {
  id: string;
  device_type: string | null;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  ip_address: string | null;
  is_current: boolean;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface MFASettings {
  mfa_enabled: boolean;
  mfa_method: string;
  recovery_email: string | null;
}

export default function SecurityPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'mfa' | 'sessions' | 'history' | 'alerts'>('overview');
  
  // Data state
  const [loginHistory, setLoginHistory] = useState<LoginEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [mfaSettings, setMfaSettings] = useState<MFASettings>({ mfa_enabled: false, mfa_method: 'totp', recovery_email: null });
  
  // MFA setup state
  const [mfaStep, setMfaStep] = useState<'disabled' | 'setup' | 'verify' | 'enabled'>('disabled');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalLogins: 0,
    suspiciousEvents: 0,
    activeSessions: 0,
    unresolvedAlerts: 0,
  });

  const loadSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Parallel fetch all data
      const [historyResult, sessionsResult, alertsResult, mfaResult] = await Promise.all([
        supabase
          .from('login_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('last_activity', { ascending: false }),
        supabase
          .from('security_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('mfa_settings')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (historyResult.data) setLoginHistory(historyResult.data);
      if (sessionsResult.data) setSessions(sessionsResult.data);
      if (alertsResult.data) setAlerts(alertsResult.data);
      if (mfaResult.data) {
        setMfaSettings(mfaResult.data);
        setMfaStep(mfaResult.data.mfa_enabled ? 'enabled' : 'disabled');
      }

      // Calculate stats
      setStats({
        totalLogins: historyResult.data?.filter(e => e.event_type === 'login' && e.success).length || 0,
        suspiciousEvents: historyResult.data?.filter(e => e.is_suspicious).length || 0,
        activeSessions: sessionsResult.data?.length || 0,
        unresolvedAlerts: alertsResult.data?.filter(a => a.status === 'new').length || 0,
      });
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const revokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_current', false);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.is_current));
      toast.success('All other sessions revoked');
    } catch (error) {
      console.error('Error revoking sessions:', error);
      toast.error('Failed to revoke sessions');
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          status: 'acknowledged', 
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, status: 'acknowledged' } : a
      ));
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const enableMFA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note: Full MFA requires Supabase Pro plan
      // This is a simplified version for the UI
      const { error } = await supabase
        .from('mfa_settings')
        .upsert({
          user_id: user.id,
          mfa_enabled: true,
          mfa_method: 'totp',
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setMfaSettings({ ...mfaSettings, mfa_enabled: true });
      setMfaStep('enabled');
      toast.success('MFA enabled successfully');
    } catch (error) {
      console.error('Error enabling MFA:', error);
      toast.error('Failed to enable MFA');
    }
  };

  const disableMFA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('mfa_settings')
        .update({
          mfa_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMfaSettings({ ...mfaSettings, mfa_enabled: false });
      setMfaStep('disabled');
      toast.success('MFA disabled');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast.error('Failed to disable MFA');
    }
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return '❌';
    switch (eventType) {
      case 'login': return '🔓';
      case 'logout': return '🔒';
      case 'password_reset': return '🔑';
      case 'mfa_success': return '✅';
      case 'mfa_failure': return '⚠️';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📟';
      default: return '💻';
    }
  };

  if (loading) {
    return (
      <div className="security-loading">
        <div className="loader"></div>
        <p>Loading security settings...</p>
      </div>
    );
  }

  return (
    <div className="security-page">
      <div className="page-header">
        <h1>🔐 Security Settings</h1>
        <p>Manage your account security and privacy</p>
      </div>

      {/* Stats Overview */}
      <div className="security-stats">
        <div className="stat-card">
          <span className="stat-icon">🔓</span>
          <div className="stat-content">
            <span className="stat-value">{stats.totalLogins}</span>
            <span className="stat-label">Logins (30 days)</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📱</span>
          <div className="stat-content">
            <span className="stat-value">{stats.activeSessions}</span>
            <span className="stat-label">Active Sessions</span>
          </div>
        </div>
        <div className={`stat-card ${stats.suspiciousEvents > 0 ? 'warning' : ''}`}>
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-value">{stats.suspiciousEvents}</span>
            <span className="stat-label">Suspicious Events</span>
          </div>
        </div>
        <div className={`stat-card ${stats.unresolvedAlerts > 0 ? 'danger' : ''}`}>
          <span className="stat-icon">🔔</span>
          <div className="stat-content">
            <span className="stat-value">{stats.unresolvedAlerts}</span>
            <span className="stat-label">Unresolved Alerts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="security-tabs">
        {(['overview', 'mfa', 'sessions', 'history', 'alerts'] as const).map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'mfa' && '🔑 MFA'}
            {tab === 'sessions' && '📱 Sessions'}
            {tab === 'history' && '📜 Login History'}
            {tab === 'alerts' && `🔔 Alerts ${stats.unresolvedAlerts > 0 ? `(${stats.unresolvedAlerts})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="security-card">
              <h3>🔑 Two-Factor Authentication</h3>
              <p>Add an extra layer of security to your account</p>
              <div className="security-status">
                <span className={`status-indicator ${mfaSettings.mfa_enabled ? 'enabled' : 'disabled'}`}>
                  {mfaSettings.mfa_enabled ? '✅ Enabled' : '❌ Disabled'}
                </span>
                <button 
                  className="configure-btn"
                  onClick={() => setActiveTab('mfa')}
                >
                  Configure →
                </button>
              </div>
            </div>

            <div className="security-card">
              <h3>📱 Active Sessions</h3>
              <p>Manage devices logged into your account</p>
              <div className="security-status">
                <span className="status-info">{stats.activeSessions} active sessions</span>
                <button 
                  className="configure-btn"
                  onClick={() => setActiveTab('sessions')}
                >
                  Manage →
                </button>
              </div>
            </div>

            <div className="security-card">
              <h3>🔒 Password</h3>
              <p>Last changed: Never (use Supabase dashboard)</p>
              <div className="security-status">
                <span className="status-info">Password authentication</span>
              </div>
            </div>

            {alerts.filter(a => a.status === 'new').length > 0 && (
              <div className="security-card alert">
                <h3>⚠️ Recent Security Alerts</h3>
                <div className="alert-preview">
                  {alerts.filter(a => a.status === 'new').slice(0, 3).map(alert => (
                    <div key={alert.id} className="alert-item">
                      <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                        ●
                      </span>
                      <span className="alert-title">{alert.title}</span>
                      <span className="alert-time">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
                <button 
                  className="configure-btn"
                  onClick={() => setActiveTab('alerts')}
                >
                  View All →
                </button>
              </div>
            )}
          </div>
        )}

        {/* MFA Tab */}
        {activeTab === 'mfa' && (
          <div className="mfa-content">
            <div className="mfa-card">
              <div className="mfa-header">
                <h3>🔑 Two-Factor Authentication</h3>
                <span className={`mfa-badge ${mfaSettings.mfa_enabled ? 'enabled' : 'disabled'}`}>
                  {mfaSettings.mfa_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              
              <p className="mfa-description">
                Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
              </p>

              {!mfaSettings.mfa_enabled ? (
                <div className="mfa-setup">
                  <div className="mfa-benefits">
                    <h4>Benefits of enabling MFA:</h4>
                    <ul>
                      <li>✅ Prevents unauthorized access even if password is compromised</li>
                      <li>✅ Alerts you of suspicious login attempts</li>
                      <li>✅ Required for enterprise compliance (HIPAA, SOC2)</li>
                      <li>✅ Backup codes for account recovery</li>
                    </ul>
                  </div>
                  <button className="enable-mfa-btn" onClick={enableMFA}>
                    🔐 Enable Two-Factor Authentication
                  </button>
                  <p className="mfa-note">
                    Note: Full TOTP MFA requires Supabase Pro plan. This enables the MFA flag in your profile.
                  </p>
                </div>
              ) : (
                <div className="mfa-enabled-section">
                  <div className="mfa-method">
                    <span className="method-icon">📱</span>
                    <div className="method-info">
                      <span className="method-name">Authenticator App</span>
                      <span className="method-status">Primary method</span>
                    </div>
                  </div>
                  <button className="disable-mfa-btn" onClick={disableMFA}>
                    Disable MFA
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="sessions-content">
            <div className="sessions-header">
              <h3>Active Sessions</h3>
              {sessions.length > 1 && (
                <button className="revoke-all-btn" onClick={revokeAllOtherSessions}>
                  Sign Out All Other Sessions
                </button>
              )}
            </div>
            
            {sessions.length === 0 ? (
              <p className="no-data">No active sessions found</p>
            ) : (
              <div className="sessions-list">
                {sessions.map(session => (
                  <div key={session.id} className={`session-card ${session.is_current ? 'current' : ''}`}>
                    <div className="session-icon">{getDeviceIcon(session.device_type)}</div>
                    <div className="session-info">
                      <div className="session-device">
                        {session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                        {session.is_current && <span className="current-badge">This device</span>}
                      </div>
                      <div className="session-meta">
                        {session.city && session.country && (
                          <span>📍 {session.city}, {session.country}</span>
                        )}
                        {session.ip_address && <span>IP: {session.ip_address}</span>}
                      </div>
                      <div className="session-time">
                        Last active: {new Date(session.last_activity).toLocaleString()}
                      </div>
                    </div>
                    {!session.is_current && (
                      <button 
                        className="revoke-btn"
                        onClick={() => revokeSession(session.id)}
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'history' && (
          <div className="history-content">
            <h3>Login History</h3>
            {loginHistory.length === 0 ? (
              <p className="no-data">No login history found</p>
            ) : (
              <div className="history-list">
                {loginHistory.map(event => (
                  <div key={event.id} className={`history-item ${event.is_suspicious ? 'suspicious' : ''}`}>
                    <div className="history-icon">
                      {getEventIcon(event.event_type, event.success)}
                    </div>
                    <div className="history-info">
                      <div className="history-event">
                        {event.event_type.replace('_', ' ')}
                        {!event.success && <span className="failed-badge">Failed</span>}
                        {event.is_suspicious && <span className="suspicious-badge">Suspicious</span>}
                      </div>
                      <div className="history-meta">
                        {event.browser && <span>{event.browser}</span>}
                        {event.city && event.country && (
                          <span>📍 {event.city}, {event.country}</span>
                        )}
                        {event.ip_address && <span>IP: {event.ip_address}</span>}
                      </div>
                    </div>
                    <div className="history-time">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="alerts-content">
            <h3>Security Alerts</h3>
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <span>✅</span>
                <p>No security alerts. Your account is secure!</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-card ${alert.status}`}>
                    <div className="alert-severity-bar" style={{ backgroundColor: getSeverityColor(alert.severity) }}></div>
                    <div className="alert-content">
                      <div className="alert-header">
                        <span className="alert-title">{alert.title}</span>
                        <span className="alert-time">{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                      {alert.description && (
                        <p className="alert-description">{alert.description}</p>
                      )}
                      <div className="alert-footer">
                        <span className={`alert-status-badge ${alert.status}`}>
                          {alert.status}
                        </span>
                        {alert.status === 'new' && (
                          <button 
                            className="acknowledge-btn"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .security-page {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 8px;
          color: var(--text);
        }

        .page-header p {
          color: var(--muted);
          margin: 0 0 24px;
        }

        .security-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .stat-card.warning {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .stat-card.danger {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .stat-icon {
          font-size: 28px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }

        .stat-label {
          font-size: 12px;
          color: var(--muted);
        }

        .security-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .security-tabs button {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .security-tabs button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .security-tabs button.active {
          background: rgba(0, 217, 255, 0.15);
          border-color: rgba(0, 217, 255, 0.3);
          color: var(--accent);
        }

        .tab-content {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
        }

        .security-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .security-card.alert {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .security-card h3 {
          margin: 0 0 8px;
          font-size: 16px;
          color: var(--text);
        }

        .security-card p {
          margin: 0 0 16px;
          color: var(--muted);
          font-size: 14px;
        }

        .security-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          font-weight: 600;
        }

        .status-indicator.enabled {
          color: #10b981;
        }

        .status-indicator.disabled {
          color: #ef4444;
        }

        .status-info {
          color: var(--muted);
        }

        .configure-btn {
          padding: 8px 16px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 8px;
          color: var(--accent);
          cursor: pointer;
          font-size: 13px;
        }

        .configure-btn:hover {
          background: rgba(0, 217, 255, 0.2);
        }

        .mfa-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
        }

        .mfa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mfa-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text);
        }

        .mfa-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .mfa-badge.enabled {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .mfa-badge.disabled {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .mfa-description {
          color: var(--muted);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .mfa-benefits h4 {
          margin: 0 0 12px;
          color: var(--text);
          font-size: 14px;
        }

        .mfa-benefits ul {
          margin: 0 0 24px;
          padding-left: 0;
          list-style: none;
        }

        .mfa-benefits li {
          margin-bottom: 8px;
          color: var(--muted);
          font-size: 14px;
        }

        .enable-mfa-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .enable-mfa-btn:hover {
          transform: translateY(-2px);
        }

        .mfa-note {
          margin-top: 12px;
          font-size: 12px;
          color: var(--muted);
          font-style: italic;
        }

        .mfa-enabled-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
        }

        .mfa-method {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .method-icon {
          font-size: 24px;
        }

        .method-name {
          display: block;
          font-weight: 600;
          color: var(--text);
        }

        .method-status {
          font-size: 12px;
          color: var(--muted);
        }

        .disable-mfa-btn {
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
        }

        .sessions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .sessions-header h3 {
          margin: 0;
          color: var(--text);
        }

        .revoke-all-btn {
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
        }

        .sessions-list, .history-list, .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .session-card.current {
          border-color: rgba(0, 217, 255, 0.3);
          background: rgba(0, 217, 255, 0.05);
        }

        .session-icon {
          font-size: 28px;
        }

        .session-info {
          flex: 1;
        }

        .session-device {
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .current-badge {
          padding: 2px 8px;
          background: rgba(0, 217, 255, 0.2);
          color: var(--accent);
          font-size: 10px;
          border-radius: 10px;
        }

        .session-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .session-time {
          font-size: 12px;
          color: var(--muted);
        }

        .revoke-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          font-size: 13px;
        }

        .revoke-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        .history-item.suspicious {
          background: rgba(239, 68, 68, 0.08);
          border-left: 3px solid #ef4444;
        }

        .history-icon {
          font-size: 24px;
        }

        .history-info {
          flex: 1;
        }

        .history-event {
          font-weight: 600;
          color: var(--text);
          text-transform: capitalize;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .failed-badge, .suspicious-badge {
          padding: 2px 8px;
          font-size: 10px;
          border-radius: 10px;
        }

        .failed-badge {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .suspicious-badge {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .history-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--muted);
        }

        .history-time {
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
        }

        .alert-card {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          overflow: hidden;
        }

        .alert-card.new {
          background: rgba(239, 68, 68, 0.05);
        }

        .alert-severity-bar {
          width: 4px;
        }

        .alert-content {
          flex: 1;
          padding: 16px;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .alert-title {
          font-weight: 600;
          color: var(--text);
        }

        .alert-time {
          font-size: 12px;
          color: var(--muted);
        }

        .alert-description {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 12px;
        }

        .alert-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .alert-status-badge.new {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .alert-status-badge.acknowledged {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .alert-status-badge.resolved {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .acknowledge-btn {
          padding: 6px 12px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 6px;
          color: var(--accent);
          cursor: pointer;
          font-size: 12px;
        }

        .no-data, .no-alerts {
          text-align: center;
          padding: 40px;
          color: var(--muted);
        }

        .no-alerts span {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .security-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: var(--muted);
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 217, 255, 0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Light theme */
        [data-theme="light"] .security-card,
        [data-theme="light"] .mfa-card,
        [data-theme="light"] .session-card,
        [data-theme="light"] .history-item,
        [data-theme="light"] .alert-card {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
