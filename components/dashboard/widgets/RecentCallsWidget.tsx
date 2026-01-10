'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Widget } from './Widget';
import { createClient } from '@/lib/supabase/client';
import type { CallAnalysis } from '@/lib/types/database';

interface RecentCallsWidgetProps {
  organizationId: string;
  userId?: string;
  viewMode?: 'personal' | 'team';
  limit?: number;
}

export function RecentCallsWidget({ 
  organizationId, 
  userId,
  viewMode = 'personal',
  limit = 5
}: RecentCallsWidgetProps) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const loadCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('call_analyses')
        .select(`
          id, file_name, status, overall_score, created_at, duration_sec,
          sentiment, customer:customer_profiles(id, name),
          uploader:profiles!uploaded_by(full_name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (viewMode === 'personal' && userId) {
        query = query.or(`uploaded_by.eq.${userId},assigned_to.eq.${userId}`);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setCalls(data || []);
    } catch (err) {
      console.error('Error loading recent calls:', err);
      setError('Failed to load calls');
    } finally {
      setLoading(false);
    }
  }, [supabase, organizationId, userId, viewMode, limit]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const getScoreColor = (score: number | null) => {
    if (!score) return 'var(--muted)';
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      case 'neutral': return '😐';
      default: return '❔';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <Widget
      id="recent-calls"
      title={viewMode === 'team' ? 'Team Activity' : 'Recent Calls'}
      icon="📞"
      loading={loading}
      error={error}
      onRefresh={loadCalls}
      headerAction={
        <Link href="/history" className="view-all-link">
          View All →
        </Link>
      }
    >
      {calls.length === 0 ? (
        <div className="no-calls">
          <span className="empty-icon">🎙️</span>
          <p>No calls analyzed yet</p>
          <Link href="/analyze" className="analyze-link">
            Analyze Your First Call
          </Link>
        </div>
      ) : (
        <div className="calls-list">
          {calls.map((call) => (
            <Link key={call.id} href={`/history?id=${call.id}`} className="call-item">
              <div className="call-left">
                <div className="call-status">
                  {call.status === 'completed' ? (
                    <span className="status-dot completed"></span>
                  ) : call.status === 'failed' ? (
                    <span className="status-dot failed"></span>
                  ) : (
                    <span className="status-dot processing"></span>
                  )}
                </div>
                <div className="call-info">
                  <span className="call-name">{call.file_name}</span>
                  <span className="call-meta">
                    {new Date(call.created_at).toLocaleDateString()} 
                    {call.duration_sec && ` • ${formatDuration(call.duration_sec)}`}
                    {viewMode === 'team' && call.uploader?.full_name && (
                      <span className="call-uploader"> • {call.uploader.full_name}</span>
                    )}
                  </span>
                  {call.customer?.name && (
                    <span className="call-customer">👤 {call.customer.name}</span>
                  )}
                </div>
              </div>
              <div className="call-right">
                {call.status === 'completed' && (
                  <>
                    <span className="call-sentiment">{getSentimentIcon(call.sentiment)}</span>
                    <span 
                      className="call-score"
                      style={{ color: getScoreColor(call.overall_score) }}
                    >
                      {call.overall_score ? Math.round(call.overall_score) : '--'}
                    </span>
                  </>
                )}
                <span className="call-arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .view-all-link {
          color: var(--accent);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
        }
        
        .view-all-link:hover {
          text-decoration: underline;
        }
        
        .no-calls {
          text-align: center;
          padding: 40px 20px;
        }
        
        .empty-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
        }
        
        .no-calls p {
          color: var(--muted);
          margin: 0 0 16px;
        }
        
        .analyze-link {
          display: inline-block;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .calls-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .call-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .call-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }
        
        .call-left {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
        }
        
        .call-status {
          flex-shrink: 0;
        }
        
        .status-dot {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .status-dot.completed { background: #10b981; }
        .status-dot.failed { background: #ef4444; }
        .status-dot.processing { 
          background: #f59e0b;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .call-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        
        .call-name {
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        
        .call-meta {
          font-size: 12px;
          color: var(--muted);
        }
        
        .call-uploader {
          color: var(--accent);
        }
        
        .call-customer {
          font-size: 11px;
          color: #8b5cf6;
        }
        
        .call-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .call-sentiment {
          font-size: 18px;
        }
        
        .call-score {
          font-size: 18px;
          font-weight: 700;
          min-width: 30px;
          text-align: right;
        }
        
        .call-arrow {
          color: var(--muted);
          font-size: 14px;
        }
        
        /* Light theme */
        :global([data-theme="light"]) .call-item {
          background: rgba(0, 0, 0, 0.02);
        }
        
        :global([data-theme="light"]) .call-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </Widget>
  );
}
