'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Organization } from '@/lib/types/database';
import { DashboardSkeleton } from '@/components/Skeleton';
import { 
  ScoreTrendWidget, 
  RecentCallsWidget, 
  TeamPerformanceWidget, 
  QuickActionsWidget,
  NotificationWidget 
} from '@/components/dashboard/widgets';
import { getAtRiskCustomers, getTopCustomers, type CustomerProfile } from '@/lib/customer';
import { RefreshCw, Mic, BarChart3, Target, TrendingUp, User } from 'lucide-react';

interface DashboardData {
  org: Organization | null;
  userId: string;
  userName: string;
  isManager: boolean;
  stats: {
    totalCalls: number;
    avgScore: number;
    callsThisMonth: number;
    callsLimit: number;
  };
  atRiskCustomers: CustomerProfile[];
  topCustomers: CustomerProfile[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Parallel fetch: organization + member role + personal calls + profile
        const [orgResponse, memberResult, personalCallsResult, profileResult] = await Promise.all([
          fetch('/api/organization/me'),
          supabase.from('organization_members').select('role').eq('user_id', user.id).single(),
          supabase
            .from('call_analyses')
            .select('id, status, overall_score')
            .or(`uploaded_by.eq.${user.id},assigned_to.eq.${user.id}`),
          supabase.from('profiles').select('full_name').eq('id', user.id).single()
        ]);

        const orgData = await orgResponse.json();
        if (!orgData.organization) return;

        const organization = orgData.organization;
        const isManager = ['owner', 'admin'].includes(memberResult.data?.role || '');
        const userName = profileResult.data?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';

        // Calculate personal stats
        const personalCalls = personalCallsResult.data || [];
        const completed = personalCalls.filter(c => c.status === 'completed');
        const scores = completed.map(c => c.overall_score).filter(Boolean) as number[];
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        // Fetch customer insights
        const [atRisk, topCust] = await Promise.all([
          getAtRiskCustomers(organization.id, 3),
          getTopCustomers(organization.id, 3, 'calls'),
        ]);

        setData({
          org: organization,
          userId: user.id,
          userName,
          isManager,
          stats: {
            totalCalls: personalCalls.length,
            avgScore,
            callsThisMonth: organization.calls_used || 0,
            callsLimit: organization.calls_limit || 10,
          },
          atRiskCustomers: atRisk,
          topCustomers: topCust,
        });

        if (isManager) {
          setViewMode('team');
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading dashboard:', error);
        }
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

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { org, userId, userName, isManager, stats, atRiskCustomers, topCustomers } = data;
  const usagePercent = Math.round((stats.callsThisMonth / stats.callsLimit) * 100);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Hey {userName}</h1>
          <p>Here&apos;s an overview of your call analytics</p>
        </div>
        <div className="header-actions">
          {isManager && (
            <div className="view-toggle">
              <button 
                onClick={() => setViewMode('personal')}
                className={viewMode === 'personal' ? 'active' : ''}
              >
                My Stats
              </button>
              <button 
                onClick={() => setViewMode('team')}
                className={viewMode === 'team' ? 'active' : ''}
              >
                Team View
              </button>
            </div>
          )}
          <button onClick={handleRefresh} className="refresh-button" disabled={loading} title="Refresh">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <Link href="/analyze" className="cta-button">
            <Mic size={18} />
            <span>Analyze New Call</span>
          </Link>
        </div>
      </div>

      {/* Medical Disclaimer */}
      {org?.industry === 'Medical' && (
        <div className="medical-disclaimer">
          <span>⚕️</span>
          <div>
            <strong>Medical Industry Disclaimer</strong>
            <p>This AI tool is for coaching & quality assurance only. Not for diagnosis or treatment.</p>
          </div>
        </div>
      )}

      {/* Usage Alert */}
      {usagePercent >= 90 && (
        <div className={`usage-alert ${usagePercent >= 100 ? 'critical' : 'warning'}`}>
          <span className="alert-icon">{usagePercent >= 100 ? '🚫' : '⚠️'}</span>
          <div className="alert-content">
            <strong>
              {usagePercent >= 100 ? 'You\'ve reached your monthly limit!' : 'Approaching usage limit'}
            </strong>
            <p>{stats.callsThisMonth}/{stats.callsLimit} calls used</p>
          </div>
          <Link href="/pricing" className="alert-cta">
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalCalls}</span>
            <span className="stat-label">Total Calls</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value" style={{ color: stats.avgScore >= 70 ? '#10b981' : stats.avgScore >= 50 ? '#f59e0b' : '#ef4444' }}>
              {stats.avgScore}
            </span>
            <span className="stat-label">Avg. Score</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.callsThisMonth}/{stats.callsLimit}</span>
            <span className="stat-label">Monthly Usage</span>
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ 
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: usagePercent >= 100 ? '#ef4444' : usagePercent >= 80 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <User size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{topCustomers.length > 0 ? topCustomers[0].name.split(' ')[0] : '—'}</span>
            <span className="stat-label">Top Customer</span>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Main Column */}
        <div className="main-column">
          {/* Quick Actions */}
          <QuickActionsWidget 
            subscriptionTier={org?.subscription_tier}
            isManager={isManager}
          />

          {/* Score Trend */}
          <ScoreTrendWidget
            organizationId={org?.id || ''}
            userId={userId}
            viewMode={viewMode}
          />

          {/* Recent Calls */}
          <RecentCallsWidget
            organizationId={org?.id || ''}
            userId={userId}
            viewMode={viewMode}
          />
        </div>

        {/* Side Column */}
        <div className="side-column">
          {/* Notifications */}
          <NotificationWidget
            userId={userId}
            organizationId={org?.id || ''}
          />

          {/* Team Performance (Managers Only) */}
          {isManager && (
            <TeamPerformanceWidget
              organizationId={org?.id || ''}
            />
          )}

          {/* At-Risk Customers */}
          {atRiskCustomers.length > 0 && (
            <div className="customer-alert-card">
              <h3>⚠️ At-Risk Customers</h3>
              <div className="customer-alert-list">
                {atRiskCustomers.map(customer => (
                  <Link key={customer.id} href={`/customers/${customer.id}`} className="customer-alert-item">
                    <span className="customer-name">{customer.name}</span>
                    <span 
                      className="customer-sentiment"
                      style={{ color: '#ef4444' }}
                    >
                      {Math.round(customer.avg_sentiment_score || 0)}%
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/customers?filter=at-risk" className="view-all-link">
                View All At-Risk →
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          margin: 0 0 4px;
          color: var(--text);
        }

        .dashboard-header p {
          margin: 0;
          color: var(--muted);
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .view-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 4px;
        }

        .view-toggle button {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }

        .view-toggle button.active {
          background: var(--accent);
          color: white;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          background: var(--card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--main-text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background: var(--item-hover);
          color: var(--accent);
          border-color: var(--accent);
        }

        .refresh-button :global(.spin) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cta-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--accent);
          border-radius: 10px;
          color: #00120f;
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .cta-button:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 223, 129, 0.3);
        }

        .medical-disclaimer {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1));
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .medical-disclaimer span {
          font-size: 24px;
        }

        .medical-disclaimer strong {
          display: block;
          color: var(--text);
          margin-bottom: 4px;
        }

        .medical-disclaimer p {
          margin: 0;
          font-size: 14px;
          color: var(--muted);
        }

        .usage-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .usage-alert.warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .usage-alert.critical {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .alert-icon {
          font-size: 24px;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content strong {
          display: block;
          color: var(--text);
        }

        .alert-content p {
          margin: 4px 0 0;
          font-size: 14px;
          color: var(--muted);
        }

        .alert-cta {
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          box-shadow: var(--card-shadow);
          font-family: 'Poppins', sans-serif;
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .stat-icon.blue {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .stat-icon.green {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .stat-icon.orange {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .stat-icon.purple {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--main-text);
          font-family: 'Poppins', sans-serif;
        }

        .stat-label {
          font-size: 13px;
          color: var(--main-text-muted);
          font-family: 'Poppins', sans-serif;
        }

        .usage-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          margin-top: 8px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
        }

        .main-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .side-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .customer-alert-card {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          padding: 20px;
        }

        .customer-alert-card h3 {
          font-size: 14px;
          color: var(--text);
          margin: 0 0 16px;
        }

        .customer-alert-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .customer-alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.2s;
        }

        .customer-alert-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .customer-name {
          color: var(--text);
          font-weight: 500;
        }

        .customer-sentiment {
          font-weight: 700;
        }

        .view-all-link {
          display: block;
          text-align: center;
          margin-top: 16px;
          color: var(--accent);
          text-decoration: none;
          font-size: 13px;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .side-column {
            order: -1;
          }
        }

        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }

        .view-toggle {
          display: flex;
          background: var(--card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 4px;
        }

        .view-toggle button {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--main-text-muted);
          cursor: pointer;
          border-radius: 6px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }

        .view-toggle button.active {
          background: var(--accent);
          color: #00120f;
        }
      `}</style>
    </div>
  );
}
