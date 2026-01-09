'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Organization, CallAnalysis } from '@/lib/types/database';
import '@/app/styles/dashboard.css';

import { DashboardSkeleton } from '@/components/Skeleton';

export default function DashboardPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallAnalysis[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use API route to bypass RLS issues
        const response = await fetch('/api/organization/me');
        const data = await response.json();

        if (!data.organization) return;

        const organization = data.organization;
        setOrg(organization);

        // Check if user manages a team (Owner, Admin, or has reports)
        const { data: memberInfo } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        const isManager = ['owner', 'admin'].includes(memberInfo?.role || '') || false;

        // Get personal recent calls
        const { data: calls } = await supabase
          .from('call_analyses')
          .select('*')
          .or(`uploaded_by.eq.${user.id},assigned_to.eq.${user.id}`) // Personal or Assigned
          .order('created_at', { ascending: false })
          .limit(5);

        if (calls) setRecentCalls(calls);

        // Calculate Personal Stats
        const { data: allPersonalCalls } = await supabase
          .from('call_analyses')
          .select('*')
          .or(`uploaded_by.eq.${user.id},assigned_to.eq.${user.id}`);

        if (allPersonalCalls) {
          const completed = allPersonalCalls.filter(c => c.status === 'completed');
          const scores = completed.map(c => c.overall_score).filter(Boolean) as number[];
          const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

          setStats({
            totalCalls: allPersonalCalls.length,
            avgScore,
            callsThisMonth: organization.calls_used || 0,
            topPerformer: '-', // Only relevant for team view
          });
        }

        // If Manager, load Team Stats
        if (isManager) {
          const { data: teamCalls } = await supabase
            .from('call_analyses')
            .select('*, profiles:uploaded_by(full_name)')
            .eq('organization_id', organization.id);
            
          if (teamCalls) {
            const completed = teamCalls.filter(c => c.status === 'completed');
            const scores = completed.map(c => c.overall_score).filter(Boolean) as number[];
            const teamAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            
            // Find top performer
            const userScores: Record<string, number[]> = {};
            completed.forEach(c => {
              const name = (c as any).profiles?.full_name || 'Unknown';
              if (!userScores[name]) userScores[name] = [];
              if (c.overall_score) userScores[name].push(c.overall_score);
            });
            
            let bestPerformer = '-';
            let bestAvg = 0;
            
            Object.entries(userScores).forEach(([name, scores]) => {
              const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
              if (avg > bestAvg) {
                bestAvg = avg;
                bestPerformer = name;
              }
            });

            setTeamStats({
              totalCalls: teamCalls.length,
              avgScore: teamAvg,
              topPerformer: bestPerformer,
              calls: teamCalls
            });
            
            // Default to team view for managers
            setViewMode('team');
          }
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
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back!</h1>
          <p>Here&apos;s an overview of your call analytics</p>
        </div>
        <div className="header-actions">
          {teamStats && (
            <div className="view-toggle" style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px', marginRight: '12px' }}>
              <button 
                onClick={() => setViewMode('personal')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  background: viewMode === 'personal' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'personal' ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                My Stats
              </button>
              <button 
                onClick={() => setViewMode('team')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  background: viewMode === 'team' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'team' ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Team View
              </button>
            </div>
          )}
          <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
            🔄 {loading ? '...' : 'Refresh'}
          </button>
          <Link href="/analyze" className="cta-button">
            <span>🎙️</span> Analyze New Call
          </Link>
        </div>
      </div>

      {org?.industry === 'Medical' && (
        <div className="medical-disclaimer-banner" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1))',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚕️</span>
          <div>
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }}>Medical Industry Disclaimer</strong>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              This AI tool is for <strong>coaching & quality assurance only</strong>. It is not a medical device and must not be used for diagnosis, treatment planning, or triage. Always verify AI insights with professional medical judgment.
            </p>
          </div>
        </div>
      )}

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
            <span className="stat-value">
              {viewMode === 'team' ? teamStats?.totalCalls || 0 : stats.totalCalls}
            </span>
            <span className="stat-label">Total Calls</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">
              {viewMode === 'team' ? teamStats?.avgScore || 0 : stats.avgScore}
            </span>
            <span className="stat-label">Avg. Score</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-value">
              {org?.calls_used || 0}/{org?.calls_limit || 10}
            </span>
            <span className="stat-label">Org Usage</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <span className="stat-value">
              {viewMode === 'team' ? teamStats?.topPerformer || '-' : stats.topPerformer}
            </span>
            <span className="stat-label">Top Performer</span>
          </div>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="recent-calls-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>{viewMode === 'team' ? 'Team Activity' : 'Your Recent Analyses'}</h2>
          <Link href="/history" style={{ color: '#00d9ff', textDecoration: 'none', fontSize: '0.95rem' }}>
            View All →
          </Link>
        </div>

        {(viewMode === 'team' ? teamStats?.calls?.slice(0,5) : recentCalls)?.length === 0 ? (
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
            {(viewMode === 'team' ? teamStats?.calls?.slice(0,5) : recentCalls)?.map((call: any) => (
              <Link key={call.id} href={`/analyze?call=${call.id}`} className="call-item">
                <div className="call-item-info">
                  <div className="call-item-name">{call.file_name}</div>
                  <div className="call-item-meta">
                    {new Date(call.created_at).toLocaleDateString()} • {call.duration_sec ? `${Math.round(call.duration_sec / 60)} min` : 'N/A'}
                    {viewMode === 'team' && call.profiles?.full_name && ` • by ${call.profiles.full_name}`}
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



