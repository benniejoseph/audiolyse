'use client';

import { useState, useEffect, useCallback } from 'react';
import { Widget } from './Widget';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  avgScore: number;
  callCount: number;
}

interface ScoreTrendWidgetProps {
  organizationId: string;
  userId?: string;
  viewMode?: 'personal' | 'team';
  days?: number;
}

export function ScoreTrendWidget({ 
  organizationId, 
  userId, 
  viewMode = 'personal',
  days = 30 
}: ScoreTrendWidgetProps) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(days);
  
  const supabase = createClient();

  const loadTrendData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      
      let query = supabase
        .from('call_analyses')
        .select('created_at, overall_score')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .not('overall_score', 'is', null);
      
      if (viewMode === 'personal' && userId) {
        query = query.or(`uploaded_by.eq.${userId},assigned_to.eq.${userId}`);
      }
      
      const { data: calls, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Group by date
      const byDate = new Map<string, { total: number; count: number }>();
      
      (calls || []).forEach(call => {
        const date = call.created_at.split('T')[0];
        const existing = byDate.get(date) || { total: 0, count: 0 };
        existing.total += call.overall_score || 0;
        existing.count += 1;
        byDate.set(date, existing);
      });
      
      // Convert to array and sort
      const trendData: TrendDataPoint[] = Array.from(byDate.entries())
        .map(([date, { total, count }]) => ({
          date,
          avgScore: Math.round(total / count),
          callCount: count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setData(trendData);
    } catch (err) {
      console.error('Error loading score trend:', err);
      setError('Failed to load trend data');
    } finally {
      setLoading(false);
    }
  }, [supabase, organizationId, userId, viewMode, timeRange]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Calculate trend direction
  const getTrend = () => {
    if (data.length < 2) return null;
    const recent = data.slice(-7);
    const older = data.slice(-14, -7);
    
    if (recent.length === 0 || older.length === 0) return null;
    
    const recentAvg = recent.reduce((sum, d) => sum + d.avgScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.avgScore, 0) / older.length;
    const diff = recentAvg - olderAvg;
    
    return {
      direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable',
      value: Math.abs(Math.round(diff)),
    };
  };

  const trend = getTrend();
  const maxScore = Math.max(...data.map(d => d.avgScore), 100);

  return (
    <Widget
      id="score-trend"
      title={viewMode === 'team' ? 'Team Score Trend' : 'Your Score Trend'}
      icon={<TrendingUp size={20} />}
      loading={loading}
      error={error}
      onRefresh={loadTrendData}
      headerAction={
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="trend-range-select"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      }
    >
      {data.length === 0 ? (
        <div className="no-data">
          <BarChart3 size={32} className="opacity-50 mb-3" />
          <p>No score data available for this period</p>
        </div>
      ) : (
        <div className="trend-content">
          {trend && (
            <div className="trend-summary">
              <span className={`trend-indicator ${trend.direction}`}>
                {trend.direction === 'up' ? <TrendingUp size={20} /> : trend.direction === 'down' ? <TrendingDown size={20} /> : <Minus size={20} />}
              </span>
              <span className="trend-text">
                {trend.direction === 'up' ? `Up ${trend.value}%` :
                 trend.direction === 'down' ? `Down ${trend.value}%` : 'Stable'}
              </span>
              <span className="trend-period">vs last week</span>
            </div>
          )}
          
          <div className="chart-container">
            <div className="chart-y-axis">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="chart-bars">
              {data.slice(-14).map((point, i) => (
                <div key={i} className="bar-wrapper">
                  <div 
                    className="bar"
                    style={{ 
                      height: `${(point.avgScore / maxScore) * 100}%`,
                      backgroundColor: getScoreColor(point.avgScore)
                    }}
                    title={`${point.date}: ${point.avgScore}% (${point.callCount} calls)`}
                  >
                    <span className="bar-value">{point.avgScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#10b981' }}></span>
              80+
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
              60-79
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#ef4444' }}></span>
              &lt;60
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .trend-range-select {
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
        
        .trend-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .trend-summary {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .trend-indicator {
          display: flex;
          align-items: center;
        }
        
        .trend-indicator.up { color: #10b981; }
        .trend-indicator.down { color: #ef4444; }
        .trend-indicator.stable { color: #f59e0b; }
        
        .trend-text {
          font-weight: 600;
          color: var(--text);
        }
        
        .trend-period {
          color: var(--muted);
          font-size: 12px;
        }
        
        .chart-container {
          display: flex;
          gap: 12px;
          height: 150px;
        }
        
        .chart-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 11px;
          color: var(--muted);
          width: 30px;
          text-align: right;
          padding: 4px 0;
        }
        
        .chart-bars {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .bar-wrapper {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: flex-end;
        }
        
        .bar {
          width: 100%;
          min-height: 4px;
          border-radius: 4px 4px 0 0;
          position: relative;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .bar:hover {
          opacity: 0.8;
        }
        
        .bar-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: var(--text);
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .bar:hover .bar-value {
          opacity: 1;
        }
        
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 12px;
          color: var(--muted);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
      `}</style>
    </Widget>
  );
}
