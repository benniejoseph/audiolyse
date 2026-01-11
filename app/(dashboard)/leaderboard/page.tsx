'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Trophy, 
  Medal, 
  Star, 
  Flame, 
  Target, 
  Gift, 
  Lock, 
  CheckCircle, 
  Zap, 
  Crown, 
  Sprout, 
  Gem, 
  Award,
  Mic,
  BarChart3,
  TrendingUp,
  Moon,
  Rocket,
  Swords
} from 'lucide-react';

interface UserPoints {
  user_id: string;
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface Badge {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points_reward: number;
  earned_at?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  challenge_type: string;
  metric: string;
  target_value: number;
  start_date: string;
  end_date: string;
  points_reward: number;
  status: string;
  participant?: {
    current_value: number;
    completed: boolean;
  };
}

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'challenges'>('leaderboard');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  
  const [leaderboard, setLeaderboard] = useState<UserPoints[]>([]);
  const [currentUser, setCurrentUser] = useState<UserPoints | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        router.push('/onboarding');
        return;
      }
      setOrganizationId(membership.organization_id);

      // Load leaderboard
      const { data: pointsData } = await supabase
        .from('user_points')
        .select(`
          user_id, total_points, level, current_streak, longest_streak,
          profiles!inner(full_name, email)
        `)
        .eq('organization_id', membership.organization_id)
        .order('total_points', { ascending: false })
        .limit(20);

      if (pointsData) {
        // Transform the data to match expected interface
        const transformedData = pointsData.map((p: any) => ({
          ...p,
          profile: p.profiles,
        }));
        setLeaderboard(transformedData);
        const userEntry = transformedData.find((p: any) => p.user_id === user.id);
        setCurrentUser(userEntry || null);
      }

      // Load badges
      const { data: allBadges } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('is_active', true)
        .order('rarity', { ascending: true });

      if (allBadges) {
        setBadges(allBadges);
      }

      // Load earned badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badge:badge_definitions(*)
        `)
        .eq('user_id', user.id)
        .eq('organization_id', membership.organization_id);

      if (userBadges) {
        setEarnedBadges(userBadges.map((ub: any) => ({
          ...ub.badge,
          earned_at: ub.earned_at,
        })));
      }

      // Load active challenges
      const { data: activeChallenges } = await supabase
        .from('challenges')
        .select(`
          *,
          participant:challenge_participants!inner(current_value, completed)
        `)
        .eq('organization_id', membership.organization_id)
        .eq('status', 'active')
        .eq('challenge_participants.user_id', user.id);

      if (activeChallenges) {
        setChallenges(activeChallenges.map((c: any) => ({
          ...c,
          participant: c.participant?.[0],
        })));
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getLevelIcon = (level: number) => {
    if (level >= 8) return <Crown size={20} className="text-yellow-500" />;
    if (level >= 6) return <Gem size={20} className="text-blue-400" />;
    if (level >= 4) return <Trophy size={20} className="text-yellow-400" />;
    if (level >= 2) return <Star size={20} className="text-yellow-300" />;
    return <Sprout size={20} className="text-green-400" />;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal size={24} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={24} className="text-gray-400" />;
    if (rank === 3) return <Medal size={24} className="text-orange-400" />;
    return <span className="text-lg font-bold">#{rank}</span>;
  };

  const getBadgeIcon = (emoji: string) => {
    switch (emoji) {
      case '🎙️': return <Mic size={24} />;
      case '📊': return <BarChart3 size={24} />;
      case '⚔️': return <Swords size={24} />;
      case '💯': return <Target size={24} />;
      case '👑': return <Crown size={24} />;
      case '🌟': return <Star size={24} />;
      case '🏆': return <Trophy size={24} />;
      case '📈': return <TrendingUp size={24} />;
      case '🔥': return <Flame size={24} />;
      case '⚡': return <Zap size={24} />;
      case '🌙': return <Moon size={24} />;
      case '🌱': return <Sprout size={24} />;
      case '🚀': return <Rocket size={24} />;
      default: return <Award size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loader"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <div>
          <h1>Leaderboard & Achievements</h1>
          <p>Track your progress and compete with your team</p>
        </div>
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <div className="user-stats-card">
          <div className="stat-item">
            <span className="stat-icon">{getLevelIcon(currentUser.level)}</span>
            <div className="stat-content">
              <span className="stat-value">Level {currentUser.level}</span>
              <span className="stat-label">Your Level</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><Zap size={28} className="text-yellow-400" /></span>
            <div className="stat-content">
              <span className="stat-value">{currentUser.total_points}</span>
              <span className="stat-label">Total Points</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><Flame size={28} className="text-orange-500" /></span>
            <div className="stat-content">
              <span className="stat-value">{currentUser.current_streak} days</span>
              <span className="stat-label">Current Streak</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><Award size={28} className="text-purple-500" /></span>
            <div className="stat-content">
              <span className="stat-value">{earnedBadges.length}</span>
              <span className="stat-label">Badges Earned</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          <span style={{marginRight: 8}}><Trophy size={16} /></span> Leaderboard
        </button>
        <button 
          className={activeTab === 'badges' ? 'active' : ''}
          onClick={() => setActiveTab('badges')}
        >
          <span style={{marginRight: 8}}><Award size={16} /></span> Badges ({earnedBadges.length}/{badges.length})
        </button>
        <button 
          className={activeTab === 'challenges' ? 'active' : ''}
          onClick={() => setActiveTab('challenges')}
        >
          <span style={{marginRight: 8}}><Target size={16} /></span> Challenges
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-content">
            <div className="period-selector">
              {(['weekly', 'monthly', 'all_time'] as const).map(period => (
                <button
                  key={period}
                  className={periodType === period ? 'active' : ''}
                  onClick={() => setPeriodType(period)}
                >
                  {period.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            <div className="leaderboard-list">
              {leaderboard.length === 0 ? (
                <div className="no-data">
                  <Trophy size={48} className="opacity-50 mb-4" />
                  <p>No points earned yet. Start analyzing calls!</p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div 
                    key={entry.user_id} 
                    className={`leaderboard-entry ${entry.user_id === userId ? 'current-user' : ''}`}
                  >
                    <div className="entry-rank">{getRankIcon(index + 1)}</div>
                    <div className="entry-avatar">
                      {entry.profile?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="entry-info">
                      <span className="entry-name">
                        {entry.profile?.full_name || 'Unknown'}
                        {entry.user_id === userId && <span className="you-badge">You</span>}
                      </span>
                      <div className="entry-level">
                        <span style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                          {getLevelIcon(entry.level)} Level {entry.level} • {entry.current_streak} <Flame size={12} />
                        </span>
                      </div>
                    </div>
                    <div className="entry-points">{entry.total_points} pts</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="badges-content">
            <h3>Earned Badges</h3>
            {earnedBadges.length === 0 ? (
              <p className="no-badges">You haven&apos;t earned any badges yet. Keep analyzing calls!</p>
            ) : (
              <div className="badges-grid">
                {earnedBadges.map(badge => (
                  <div key={badge.id} className="badge-card earned">
                    <div className="badge-icon" style={{ backgroundColor: `${getRarityColor(badge.rarity)}30` }}>
                      {getBadgeIcon(badge.icon)}
                    </div>
                    <div className="badge-info">
                      <span className="badge-title">{badge.title}</span>
                      <span className="badge-desc">{badge.description}</span>
                      <span className="badge-rarity" style={{ color: getRarityColor(badge.rarity) }}>
                        {badge.rarity} • +{badge.points_reward} pts
                      </span>
                    </div>
                    <span className="earned-check"><CheckCircle size={20} className="text-green-500" /></span>
                  </div>
                ))}
              </div>
            )}
            
            <h3>Available Badges</h3>
            <div className="badges-grid">
              {badges.filter(b => !earnedBadges.find(eb => eb.id === b.id)).map(badge => (
                <div key={badge.id} className="badge-card locked">
                  <div className="badge-icon" style={{ backgroundColor: `${getRarityColor(badge.rarity)}15` }}>
                    {getBadgeIcon(badge.icon)}
                  </div>
                  <div className="badge-info">
                    <span className="badge-title">{badge.title}</span>
                    <span className="badge-desc">{badge.description}</span>
                    <span className="badge-rarity" style={{ color: getRarityColor(badge.rarity) }}>
                      {badge.rarity} • +{badge.points_reward} pts
                    </span>
                  </div>
                  <span className="locked-icon"><Lock size={20} /></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="challenges-content">
            {challenges.length === 0 ? (
              <div className="no-data">
                <Target size={48} className="opacity-50 mb-4" />
                <p>No active challenges. Check back soon!</p>
              </div>
            ) : (
              <div className="challenges-list">
                {challenges.map(challenge => (
                  <div key={challenge.id} className="challenge-card">
                    <div className="challenge-icon">{getBadgeIcon(challenge.icon || '🎯')}</div>
                    <div className="challenge-info">
                      <h4>{challenge.title}</h4>
                      <p>{challenge.description}</p>
                      <div className="challenge-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${Math.min((challenge.participant?.current_value || 0) / challenge.target_value * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="progress-text">
                          {challenge.participant?.current_value || 0} / {challenge.target_value}
                        </span>
                      </div>
                      <div className="challenge-meta">
                        <span className="reward" style={{display: 'flex', alignItems: 'center', gap: 4}}>
                          <Gift size={14} /> {challenge.points_reward} pts
                        </span>
                        <span className="deadline">
                          Ends: {new Date(challenge.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {challenge.participant?.completed && (
                      <span className="completed-badge"><CheckCircle size={24} className="text-green-500" /></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .leaderboard-page {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 4px;
          color: var(--text);
        }

        .page-header p {
          color: var(--muted);
          margin: 0 0 24px;
        }

        .user-stats-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(139, 92, 246, 0.1));
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
        }

        .stat-label {
          font-size: 12px;
          color: var(--muted);
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .tabs button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .tabs button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .tabs button.active {
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

        .period-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .period-selector button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          text-transform: capitalize;
        }

        .period-selector button.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .leaderboard-entry {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          transition: background 0.2s;
        }

        .leaderboard-entry:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .leaderboard-entry.current-user {
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.3);
        }

        .entry-rank {
          font-size: 20px;
          width: 40px;
          text-align: center;
          display: flex;
          justify-content: center;
        }

        .entry-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }

        .entry-info {
          flex: 1;
        }

        .entry-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text);
        }

        .you-badge {
          padding: 2px 8px;
          background: var(--accent);
          color: white;
          font-size: 10px;
          border-radius: 10px;
        }

        .entry-level {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }

        .entry-points {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
        }

        .badges-content h3 {
          font-size: 16px;
          color: var(--text);
          margin: 0 0 16px;
        }

        .badges-content h3:not(:first-child) {
          margin-top: 32px;
        }

        .no-badges {
          color: var(--muted);
          font-style: italic;
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .badge-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          position: relative;
        }

        .badge-card.locked {
          opacity: 0.6;
        }

        .badge-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
        }

        .badge-info {
          flex: 1;
        }

        .badge-title {
          display: block;
          font-weight: 600;
          color: var(--text);
        }

        .badge-desc {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }

        .badge-rarity {
          display: block;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
          text-transform: capitalize;
        }

        .earned-check, .locked-icon {
          font-size: 20px;
        }

        .challenges-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .challenge-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          position: relative;
        }

        .challenge-icon {
          font-size: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .challenge-info {
          flex: 1;
        }

        .challenge-info h4 {
          margin: 0 0 4px;
          color: var(--text);
        }

        .challenge-info p {
          margin: 0 0 12px;
          color: var(--muted);
          font-size: 14px;
        }

        .challenge-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          border-radius: 4px;
          transition: width 0.3s;
        }

        .progress-text {
          font-size: 13px;
          color: var(--muted);
          min-width: 60px;
        }

        .challenge-meta {
          display: flex;
          gap: 20px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--muted);
        }

        .challenge-meta .reward {
          color: var(--accent);
        }

        .completed-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 20px;
        }

        .no-data {
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .leaderboard-loading {
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
      `}</style>
    </div>
  );
}
