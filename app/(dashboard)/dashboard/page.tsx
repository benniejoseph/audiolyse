'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Organization, CallAnalysis } from '@/lib/types/database';

export default function DashboardPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallAnalysis[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgScore: 0,
    callsThisMonth: 0,
    topPerformer: '-',
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error getting user:', userError);
          return;
        }
        if (!user) {
          console.log('No user found');
          return;
        }

        console.log('Loading dashboard for user:', user.id);

        // Get organization
        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (membershipError) {
          console.error('Error fetching membership:', membershipError);
          return;
        }

        if (!membership) {
          console.warn('No organization membership found for user');
          return;
        }

        console.log('Found organization ID:', membership.organization_id);

        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
          return;
        }

        if (!organization) {
          console.warn('Organization not found');
          return;
        }

        console.log('Organization loaded:', organization.name);
        setOrg(organization);

        // Get recent calls
        const { data: calls, error: callsError } = await supabase
          .from('call_analyses')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (callsError) {
          console.error('Error fetching calls:', callsError);
          return;
        }

        console.log(`Loaded ${calls?.length || 0} recent calls from database`);
        if (calls) {
          setRecentCalls(calls);
          
          // Calculate stats - get all calls for accurate stats
          const { data: allCalls } = await supabase
            .from('call_analyses')
            .select('*')
            .eq('organization_id', organization.id);

          if (allCalls) {
            const completed = allCalls.filter(c => c.status === 'completed');
            const scores = completed.map(c => c.overall_score).filter(Boolean) as number[];
            const avgScore = scores.length > 0 
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0;

            setStats({
              totalCalls: allCalls.length,
              avgScore,
              callsThisMonth: organization.calls_used || 0,
              topPerformer: '-',
            });
          }
        } else {
          console.warn('Calls data is null or undefined');
        }
      } catch (error) {
        console.error('Unexpected error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [supabase, refreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back!</h1>
          <p>Here&apos;s an overview of your call analytics</p>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link href="/analyze" className="cta-button">
            <span>🎙️</span> Analyze New Call
          </Link>
        </div>
      </div>

      {/* Usage Alert */}
      {org && org.calls_used >= org.calls_limit && (
        <div className="usage-alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>You&apos;ve reached your monthly limit!</strong>
            <p>Upgrade to continue analyzing calls</p>
          </div>
          <Link href="/pricing" className="alert-cta">
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalCalls}</span>
            <span className="stat-label">Total Calls</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgScore || '-'}</span>
            <span className="stat-label">Avg. Score</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-value">
              {org?.calls_used || 0}/{org?.calls_limit || 3}
            </span>
            <span className="stat-label">Calls {org?.subscription_tier === 'free' ? 'Today' : 'This Month'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <span className="stat-value">{stats.topPerformer}</span>
            <span className="stat-label">Top Performer</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Recent Calls */}
        <div className="dashboard-section recent-calls">
          <div className="section-header">
            <h2>Recent Analyses</h2>
            <Link href="/history" className="view-all">View All →</Link>
          </div>

          {recentCalls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎙️</div>
              <h3>No calls analyzed yet</h3>
              <p>Upload your first call recording to get started</p>
              <Link href="/analyze" className="empty-cta">
                Analyze Your First Call
              </Link>
            </div>
          ) : (
            <div className="calls-list">
              {recentCalls.map((call) => (
                <div key={call.id} className="call-item">
                  <div className="call-info">
                    <span className="call-name">{call.file_name}</span>
                    <span className="call-date">
                      {new Date(call.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="call-meta">
                    {call.status === 'completed' && call.overall_score && (
                      <span className={`score-badge score-${getScoreLevel(call.overall_score)}`}>
                        {call.overall_score}
                      </span>
                    )}
                    <span className={`status-badge status-${call.status}`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link href="/analyze" className="action-card">
              <span className="action-icon">🎙️</span>
              <span className="action-label">Analyze Call</span>
            </Link>
            <Link href="/analyze?bulk=true" className="action-card">
              <span className="action-icon">📁</span>
              <span className="action-label">Bulk Upload</span>
            </Link>
            <Link href="/history?export=true" className="action-card">
              <span className="action-icon">📄</span>
              <span className="action-label">Export Reports</span>
            </Link>
            <Link href="/team" className="action-card">
              <span className="action-icon">👥</span>
              <span className="action-label">Invite Team</span>
            </Link>
          </div>
        </div>

        {/* Tips */}
        <div className="dashboard-section tips">
          <h2>Tips & Best Practices</h2>
          <ul className="tips-list">
            <li>
              <span className="tip-icon">💡</span>
              <span>Upload clear audio recordings for better transcription accuracy</span>
            </li>
            <li>
              <span className="tip-icon">📊</span>
              <span>Review coaching scores to identify improvement areas</span>
            </li>
            <li>
              <span className="tip-icon">🎯</span>
              <span>Use AI suggestions to train your team effectively</span>
            </li>
            <li>
              <span className="tip-icon">📈</span>
              <span>Track trends over time to measure improvement</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}


