'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Organization, CallAnalysis } from '@/lib/types/database';
import '@/app/styles/dashboard.css';

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

        // Use API route to bypass RLS issues
        const response = await fetch('/api/organization/me');
        const data = await response.json();

        if (!response.ok) {
          console.error('Error fetching organization:', data.error);
          return;
        }

        if (!data.organization) {
          console.warn('No organization found for user');
          return;
        }

        const organization = data.organization;
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
          <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
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

      {/* Recent Calls */}
      <div className="recent-calls-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Recent Analyses</h2>
          <Link href="/history" style={{ color: '#00d9ff', textDecoration: 'none', fontSize: '0.95rem' }}>
            View All →
          </Link>
        </div>

        {recentCalls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎙️</div>
            <h3>No calls analyzed yet</h3>
            <p>Upload your first call recording to get started</p>
            <Link href="/analyze" className="cta-button" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Analyze Your First Call
            </Link>
          </div>
        ) : (
          <div className="calls-list">
            {recentCalls.map((call) => (
              <Link key={call.id} href={`/analyze?call=${call.id}`} className="call-item">
                <div className="call-item-info">
                  <div className="call-item-name">{call.file_name}</div>
                  <div className="call-item-meta">
                    {new Date(call.created_at).toLocaleDateString()} • {call.duration_sec ? `${Math.round(call.duration_sec / 60)} min` : 'N/A'}
                  </div>
                </div>
                {call.status === 'completed' && call.overall_score && (
                  <div className="call-item-score">{Math.round(call.overall_score)}</div>
                )}
                <div className="call-item-link">→</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



