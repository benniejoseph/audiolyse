'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Widget } from './Widget';
import { createClient } from '@/lib/supabase/client';
import { Phone, Mic, User, ChevronRight, Smile, Frown, Meh, HelpCircle, ArrowRight } from 'lucide-react';

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
      case 'positive': return <Smile size={18} className="text-green-500" />;
      case 'negative': return <Frown size={18} className="text-red-500" />;
      case 'neutral': return <Meh size={18} className="text-yellow-500" />;
      default: return <HelpCircle size={18} className="text-gray-500" />;
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
      icon={<Phone size={20} />}
      loading={loading}
      error={error}
      onRefresh={loadCalls}
      headerAction={
        <Link href="/history" className="view-all-link">
          View All <ArrowRight size={14} />
        </Link>
      }
    >
      {calls.length === 0 ? (
        <div className="no-calls">
          <Mic size={40} className="empty-icon" />
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
                    <span className="call-customer"><User size={12} style={{display: 'inline', marginRight: 4}} /> {call.customer.name}</span>
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
                <span className="call-arrow"><ChevronRight size={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .view-all-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--accent);
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .view-all-link:hover {
          background: var(--accent-light);
        }
        
        .no-calls {
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .empty-icon {
          margin-bottom: 12px;
          color: var(--main-text-muted);
          opacity: 0.5;
        }
        
        .no-calls p {
          font-family: 'Poppins', sans-serif;
          color: var(--main-text-muted);
          margin: 0 0 16px;
        }
        
        .analyze-link {
          display: inline-block;
          padding: 10px 20px;
          background: var(--accent);
          color: #00120f;
          text-decoration: none;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .analyze-link:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }
        
        .calls-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .call-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: var(--item-bg);
          border: 1px solid transparent;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        
        .call-item:hover {
          background: var(--item-hover);
          border-color: var(--border-color);
          transform: translateX(2px);
        }
        
        .call-left {
          display: flex;
          gap: 14px;
          align-items: center;
          min-width: 0;
          flex: 1;
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
          gap: 3px;
          min-width: 0;
        }
        
        .call-name {
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: 14px;
          color: var(--main-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
          line-height: 1.3;
        }
        
        .call-meta {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          color: var(--main-text-muted);
          line-height: 1.4;
        }
        
        .call-uploader {
          color: var(--accent);
        }
        
        .call-customer {
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          color: #8b5cf6;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .call-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        
        .call-sentiment {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--item-hover);
        }
        
        .call-score {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 600;
          min-width: 36px;
          text-align: right;
        }
        
        .call-arrow {
          color: var(--main-text-muted);
          display: flex;
          align-items: center;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s;
        }

        .call-item:hover .call-arrow {
          opacity: 1;
          transform: translateX(0);
          color: var(--accent);
        }
      `}</style>
    </Widget>
  );
}
