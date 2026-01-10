'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Widget } from './Widget';
import { createClient } from '@/lib/supabase/client';
import { Users, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamMemberStats {
  userId: string;
  name: string;
  totalCalls: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface TeamPerformanceWidgetProps {
  organizationId: string;
  limit?: number;
}

export function TeamPerformanceWidget({ 
  organizationId, 
  limit = 5 
}: TeamPerformanceWidgetProps) {
  const [members, setMembers] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'calls'>('score');
  
  const supabase = createClient();

  const loadTeamStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id, profile:profiles(id, full_name)')
        .eq('organization_id', organizationId);
      
      if (membersError) throw membersError;
      
      // Get all calls for the org
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: calls, error: callsError } = await supabase
        .from('call_analyses')
        .select('uploaded_by, overall_score, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (callsError) throw callsError;
      
      // Calculate stats per member
      const statsMap = new Map<string, { scores: number[], recentScores: number[], olderScores: number[], name: string }>();
      
      (teamMembers || []).forEach((member: any) => {
        if (member.profile) {
          statsMap.set(member.user_id, {
            scores: [],
            recentScores: [],
            olderScores: [],
            name: member.profile.full_name || 'Unknown'
          });
        }
      });
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      (calls || []).forEach((call: any) => {
        const member = statsMap.get(call.uploaded_by);
        if (member && call.overall_score) {
          member.scores.push(call.overall_score);
          
          const callDate = new Date(call.created_at);
          if (callDate >= sevenDaysAgo) {
            member.recentScores.push(call.overall_score);
          } else if (callDate >= fourteenDaysAgo) {
            member.olderScores.push(call.overall_score);
          }
        }
      });
      
      // Convert to array with calculated stats
      const memberStats: TeamMemberStats[] = Array.from(statsMap.entries())
        .map(([userId, data]) => {
          const avgScore = data.scores.length > 0 
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
            : 0;
          
          const recentAvg = data.recentScores.length > 0
            ? data.recentScores.reduce((a, b) => a + b, 0) / data.recentScores.length
            : null;
          const olderAvg = data.olderScores.length > 0
            ? data.olderScores.reduce((a, b) => a + b, 0) / data.olderScores.length
            : null;
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (recentAvg !== null && olderAvg !== null) {
            const diff = recentAvg - olderAvg;
            trend = diff > 3 ? 'up' : diff < -3 ? 'down' : 'stable';
          }
          
          return {
            userId,
            name: data.name,
            totalCalls: data.scores.length,
            avgScore,
            trend,
          };
        })
        .filter(m => m.totalCalls > 0);
      
      // Sort
      memberStats.sort((a, b) => {
        if (sortBy === 'score') return b.avgScore - a.avgScore;
        return b.totalCalls - a.totalCalls;
      });
      
      setMembers(memberStats.slice(0, limit));
    } catch (err) {
      console.error('Error loading team stats:', err);
      setError('Failed to load team performance');
    } finally {
      setLoading(false);
    }
  }, [supabase, organizationId, limit, sortBy]);

  useEffect(() => {
    loadTeamStats();
  }, [loadTeamStats]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-emerald-500" />;
      case 'down': return <TrendingDown size={16} className="text-red-500" />;
      default: return <Minus size={16} className="text-gray-500" />;
    }
  };

  return (
    <Widget
      id="team-performance"
      title="Team Performance"
      icon={<Users size={20} />}
      loading={loading}
      error={error}
      onRefresh={loadTeamStats}
      headerAction={
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as 'score' | 'calls')}
          className="sort-select"
        >
          <option value="score">By Score</option>
          <option value="calls">By Calls</option>
        </select>
      }
    >
      {members.length === 0 ? (
        <div className="no-data">
          <Users size={32} className="opacity-50 mb-3" />
          <p>No team data available</p>
        </div>
      ) : (
        <div className="team-list">
          {members.map((member, index) => (
            <div key={member.userId} className="team-member">
              <div className="member-rank">
                {index < 3 ? <Medal size={20} className={
                  index === 0 ? 'text-yellow-400' : 
                  index === 1 ? 'text-gray-400' : 
                  'text-orange-400'
                } /> : `#${index + 1}`}
              </div>
              <div className="member-info">
                <span className="member-name">{member.name}</span>
                <span className="member-calls">{member.totalCalls} calls</span>
              </div>
              <div className="member-stats">
                <span className="member-trend">{getTrendIcon(member.trend)}</span>
                <div 
                  className="member-score"
                  style={{ backgroundColor: `${getScoreColor(member.avgScore)}20`, color: getScoreColor(member.avgScore) }}
                >
                  {member.avgScore}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Link href="/team" className="view-team-link">
        View Full Team Analytics →
      </Link>

      <style jsx>{`
        .sort-select {
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
        }
        
        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .team-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .team-member {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          transition: background 0.2s;
        }
        
        .team-member:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .member-rank {
          font-size: 14px;
          font-weight: 600;
          width: 32px;
          text-align: center;
          display: flex;
          justify-content: center;
        }
        
        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        
        .member-name {
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .member-calls {
          font-size: 12px;
          color: var(--muted);
        }
        
        .member-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .member-trend {
          display: flex;
          align-items: center;
        }
        
        .member-score {
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          min-width: 50px;
          text-align: center;
        }
        
        .view-team-link {
          display: block;
          text-align: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--accent);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
        }
        
        .view-team-link:hover {
          text-decoration: underline;
        }
        
        /* Light theme */
        :global([data-theme="light"]) .team-member {
          background: rgba(0, 0, 0, 0.02);
        }
        
        :global([data-theme="light"]) .team-member:hover {
          background: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </Widget>
  );
}
