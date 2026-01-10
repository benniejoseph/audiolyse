'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

interface CoachingSession {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  completed_at: string | null;
  agenda: string | null;
  notes: string | null;
  action_items: any[];
  agent_rating: number | null;
  agent: {
    id: string;
    full_name: string;
    email: string;
  };
  coach: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TeamMember {
  user_id: string;
  role: string;
  full_name: string;
  email: string;
}

export default function CoachingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  
  // New session modal
  const [showModal, setShowModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    session_type: 'one_on_one',
    agent_id: '',
    scheduled_at: '',
    duration_minutes: 30,
    agenda: '',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    avgRating: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Get organization and role
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        router.push('/onboarding');
        return;
      }

      const isManagerRole = ['owner', 'admin', 'manager'].includes(membership.role);
      setIsManager(isManagerRole);
      setOrganizationId(membership.organization_id);

      // Get team members
      const { data: team } = await supabase
        .from('organization_members')
        .select('user_id, role, profile:profiles(full_name, email)')
        .eq('organization_id', membership.organization_id);

      if (team) {
        setTeamMembers(team.map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          full_name: m.profile?.full_name || 'Unknown',
          email: m.profile?.email || '',
        })));
      }

      // Get coaching sessions
      let query = supabase
        .from('coaching_sessions')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, email),
          coach:profiles!coach_id(id, full_name, email)
        `)
        .eq('organization_id', membership.organization_id)
        .order('scheduled_at', { ascending: true });

      // Filter: if not manager, only show own sessions
      if (!isManagerRole) {
        query = query.or(`agent_id.eq.${user.id},coach_id.eq.${user.id}`);
      }

      const { data: sessionsData } = await query;
      if (sessionsData) {
        setSessions(sessionsData);
        
        // Calculate stats
        const upcoming = sessionsData.filter(s => s.status === 'scheduled').length;
        const completed = sessionsData.filter(s => s.status === 'completed').length;
        const ratings = sessionsData.filter(s => s.agent_rating).map(s => s.agent_rating!);
        const avgRating = ratings.length > 0 
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 
          : 0;
        
        setStats({
          total: sessionsData.length,
          upcoming,
          completed,
          avgRating,
        });
      }
    } catch (error) {
      console.error('Error loading coaching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createSession = async () => {
    if (!organizationId || !userId || !newSession.title || !newSession.agent_id || !newSession.scheduled_at) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('coaching_sessions')
        .insert({
          organization_id: organizationId,
          coach_id: userId,
          agent_id: newSession.agent_id,
          title: newSession.title,
          description: newSession.description || null,
          session_type: newSession.session_type,
          scheduled_at: newSession.scheduled_at,
          duration_minutes: newSession.duration_minutes,
          agenda: newSession.agenda || null,
        });

      if (error) throw error;
      
      toast.success('Coaching session scheduled!');
      setShowModal(false);
      setNewSession({
        title: '',
        description: '',
        session_type: 'one_on_one',
        agent_id: '',
        scheduled_at: '',
        duration_minutes: 30,
        agenda: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('coaching_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('Session updated');
      loadData();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#00d9ff';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'cancelled': return '#6b7280';
      case 'no_show': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'one_on_one': return '👥';
      case 'group': return '👨‍👩‍👧‍👦';
      case 'training': return '📚';
      case 'review': return '📊';
      default: return '🎯';
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filterStatus !== 'all' && session.status !== filterStatus) return false;
    if (filterAgent !== 'all' && session.agent.id !== filterAgent) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="coaching-loading">
        <div className="loader"></div>
        <p>Loading coaching sessions...</p>
      </div>
    );
  }

  return (
    <div className="coaching-page">
      <div className="page-header">
        <div>
          <h1>🎯 Coaching & 1:1s</h1>
          <p>Track and manage coaching sessions with your team</p>
        </div>
        {isManager && (
          <button className="new-session-btn" onClick={() => setShowModal(true)}>
            + Schedule Session
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="coaching-stats">
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <span className="stat-value">{stats.upcoming}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-content">
            <span className="stat-value">{stats.avgRating || '—'}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="coaching-filters">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {isManager && (
          <select 
            value={filterAgent} 
            onChange={(e) => setFilterAgent(e.target.value)}
          >
            <option value="all">All Team Members</option>
            {teamMembers.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.full_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="no-sessions">
          <span className="empty-icon">🎯</span>
          <h3>No coaching sessions</h3>
          <p>{isManager ? 'Schedule your first coaching session' : 'No sessions scheduled yet'}</p>
          {isManager && (
            <button className="new-session-btn" onClick={() => setShowModal(true)}>
              + Schedule Session
            </button>
          )}
        </div>
      ) : (
        <div className="sessions-list">
          {filteredSessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-icon">{getTypeIcon(session.session_type)}</div>
              <div className="session-content">
                <div className="session-header">
                  <h3>{session.title}</h3>
                  <span 
                    className="session-status"
                    style={{ backgroundColor: `${getStatusColor(session.status)}20`, color: getStatusColor(session.status) }}
                  >
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="session-meta">
                  <span className="session-date">
                    📅 {new Date(session.scheduled_at).toLocaleDateString()} at {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="session-duration">⏱️ {session.duration_minutes} min</span>
                </div>
                <div className="session-participants">
                  <span className="participant">
                    <span className="label">Agent:</span> {session.agent?.full_name || 'Unknown'}
                  </span>
                  <span className="participant">
                    <span className="label">Coach:</span> {session.coach?.full_name || 'Unknown'}
                  </span>
                </div>
                {session.agenda && (
                  <p className="session-agenda">{session.agenda}</p>
                )}
                {session.agent_rating && (
                  <div className="session-rating">
                    {'⭐'.repeat(session.agent_rating)}
                  </div>
                )}
              </div>
              <div className="session-actions">
                {session.status === 'scheduled' && isManager && (
                  <>
                    <button 
                      className="action-btn start"
                      onClick={() => updateSessionStatus(session.id, 'in_progress')}
                    >
                      Start
                    </button>
                    <button 
                      className="action-btn cancel"
                      onClick={() => updateSessionStatus(session.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {session.status === 'in_progress' && isManager && (
                  <button 
                    className="action-btn complete"
                    onClick={() => updateSessionStatus(session.id, 'completed')}
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Session Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schedule Coaching Session</h2>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                placeholder="Weekly 1:1, Performance Review, etc."
              />
            </div>
            
            <div className="form-group">
              <label>Team Member *</label>
              <select
                value={newSession.agent_id}
                onChange={(e) => setNewSession({ ...newSession, agent_id: e.target.value })}
              >
                <option value="">Select team member</option>
                {teamMembers.filter(m => m.user_id !== userId).map(member => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newSession.scheduled_at}
                  onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Duration</label>
                <select
                  value={newSession.duration_minutes}
                  onChange={(e) => setNewSession({ ...newSession, duration_minutes: Number(e.target.value) })}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Session Type</label>
              <select
                value={newSession.session_type}
                onChange={(e) => setNewSession({ ...newSession, session_type: e.target.value })}
              >
                <option value="one_on_one">1:1 Meeting</option>
                <option value="review">Performance Review</option>
                <option value="training">Training Session</option>
                <option value="group">Group Session</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Agenda</label>
              <textarea
                value={newSession.agenda}
                onChange={(e) => setNewSession({ ...newSession, agenda: e.target.value })}
                placeholder="Topics to discuss..."
                rows={3}
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="create-btn" onClick={createSession}>
                Schedule Session
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .coaching-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 4px;
          color: var(--text);
        }

        .page-header p {
          color: var(--muted);
          margin: 0;
        }

        .new-session-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .new-session-btn:hover {
          transform: translateY(-2px);
        }

        .coaching-stats {
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

        .coaching-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .coaching-filters select {
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .session-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: border-color 0.2s;
        }

        .session-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .session-icon {
          font-size: 32px;
        }

        .session-content {
          flex: 1;
        }

        .session-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .session-header h3 {
          margin: 0;
          font-size: 16px;
          color: var(--text);
        }

        .session-status {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .session-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .session-participants {
          display: flex;
          gap: 20px;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .participant .label {
          color: var(--muted);
        }

        .session-agenda {
          font-size: 13px;
          color: var(--muted);
          margin: 8px 0 0;
          font-style: italic;
        }

        .session-rating {
          margin-top: 8px;
        }

        .session-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .action-btn.start {
          background: rgba(0, 217, 255, 0.1);
          border-color: rgba(0, 217, 255, 0.3);
          color: var(--accent);
        }

        .action-btn.complete {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
        }

        .action-btn.cancel {
          background: rgba(107, 114, 128, 0.1);
          border-color: rgba(107, 114, 128, 0.3);
          color: #6b7280;
        }

        .no-sessions {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .no-sessions h3 {
          color: var(--text);
          margin: 0 0 8px;
        }

        .no-sessions p {
          color: var(--muted);
          margin: 0 0 20px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h2 {
          margin: 0 0 24px;
          color: var(--text);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: var(--muted);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: var(--muted);
          cursor: pointer;
        }

        .create-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .coaching-loading {
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
