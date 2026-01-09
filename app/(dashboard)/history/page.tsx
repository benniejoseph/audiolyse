'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CallAnalysis, Organization, Profile } from '@/lib/types/database';
import { generateCallAnalysisPDF } from '@/app/utils/pdfGenerator';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';

export default function HistoryPage() {
  const [calls, setCalls] = useState<CallAnalysis[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');
  const [selectedCall, setSelectedCall] = useState<CallAnalysis | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Assignment State
  const [members, setMembers] = useState<Profile[]>([]);
  const [assigning, setAssigning] = useState(false);

  const supabase = createClient();

  const logAccess = async (call: CallAnalysis) => {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: 'call_analysis',
          resource_id: call.id,
          action: 'viewed',
          organization_id: call.organization_id,
          metadata: { file_name: call.file_name }
        })
      });
    } catch (e) {
      console.error('Failed to log access', e);
    }
  };

  useEffect(() => {
    if (selectedCall) {
      logAccess(selectedCall);
    }
  }, [selectedCall]);

  useEffect(() => {
    async function loadHistory() {
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

        console.log('Loading history for user:', user.id);

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

        // Get call history
        const { data: callHistory, error: callsError } = await supabase
          .from('call_analyses')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false });

        if (callsError) {
          console.error('Error fetching call history:', callsError);
          return;
        }

        console.log(`Loaded ${callHistory?.length || 0} calls from database`);
        if (callHistory) {
          setCalls(callHistory);
        } else {
          console.warn('Call history is null or undefined');
        }

        // Get team members for assignment
        const { data: teamMembers } = await supabase
          .from('organization_members')
          .select('user_id, profile:profiles(id, full_name, email)')
          .eq('organization_id', organization.id);
        
        if (teamMembers) {
          setMembers(teamMembers.map((m: any) => m.profile).filter(Boolean));
        }
      } catch (error) {
        console.error('Unexpected error loading history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supabase, refreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleAssignCall = async (callId: string, userId: string) => {
    setAssigning(true);
    try {
      const { error } = await supabase
        .from('call_analyses')
        .update({ assigned_to: userId || null })
        .eq('id', callId);

      if (error) throw error;

      // Update local state
      setCalls(prev => prev.map(c => c.id === callId ? { ...c, assigned_to: userId || null } : c));
      if (selectedCall?.id === callId) {
        setSelectedCall(prev => prev ? { ...prev, assigned_to: userId || null } : null);
      }
      
      alert('Call assigned successfully!');
    } catch (e: any) {
      console.error('Assignment error:', e);
      alert('Failed to assign call');
    } finally {
      setAssigning(false);
    }
  };

  const filteredCalls = calls
    .filter(call => {
      if (searchQuery) {
        return call.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .filter(call => {
      if (filterStatus === 'all') return true;
      return call.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return (b.overall_score || 0) - (a.overall_score || 0);
    });

  const tierLimits = org ? SUBSCRIPTION_LIMITS[org.subscription_tier] : SUBSCRIPTION_LIMITS.free;
  const historyDays = tierLimits.historyDays;
  const canExportPDF = tierLimits.features.pdfExport;

  const handleExportPDF = (call: CallAnalysis) => {
    if (!canExportPDF || !call.analysis_json) return;
    // Create a BulkCallResult-like object for the PDF generator
    generateCallAnalysisPDF({
      id: call.id,
      fileName: call.file_name,
      fileSize: call.file_size_bytes,
      status: 'completed' as const,
      result: call.analysis_json as any
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'var(--muted)';
    if (score >= 80) return '#7cffc7';
    if (score >= 60) return '#ffd166';
    return '#ff6b6b';
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loader"></div>
        <p>Loading history...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1>Call History</h1>
          <p>View and manage your analyzed calls</p>
        </div>
        <div className="history-actions">
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="history-info">
            <span className="history-count">{calls.length} calls</span>
            <span className="history-retention">Retention: {historyDays} days</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
          </select>
        </div>
      </div>

      {/* Calls Grid */}
      {filteredCalls.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">📁</div>
          <h3>No calls found</h3>
          <p>{searchQuery ? 'Try a different search term' : 'Start by analyzing your first call'}</p>
          {!searchQuery && (
            <a href="/analyze" className="empty-cta">Analyze Call</a>
          )}
        </div>
      ) : (
        <div className="calls-grid">
          {filteredCalls.map((call) => (
            <div key={call.id} className="call-card" onClick={() => setSelectedCall(call)}>
              <div className="call-card-header">
                <span className="call-file-name">{call.file_name}</span>
                <span className={`call-status status-${call.status}`}>{call.status}</span>
              </div>
              
              <div className="call-card-body">
                {call.status === 'completed' && call.overall_score && (
                  <div className="call-score" style={{ color: getScoreColor(call.overall_score) }}>
                    {call.overall_score}
                  </div>
                )}
                
                <div className="call-details">
                  {call.duration_sec && (
                    <span>Duration: {Math.floor(call.duration_sec / 60)}:{(call.duration_sec % 60).toString().padStart(2, '0')}</span>
                  )}
                  {call.sentiment && (
                    <span>Sentiment: {call.sentiment}</span>
                  )}
                  {call.language && (
                    <span>Language: {call.language}</span>
                  )}
                </div>
              </div>

              <div className="call-card-footer">
                <span className="call-date">
                  {new Date(call.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {canExportPDF && call.status === 'completed' && (
                  <button
                    className="export-btn-small"
                    onClick={(e) => { e.stopPropagation(); handleExportPDF(call); }}
                  >
                    📄 PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCall(null)}>×</button>
            
            <h2>{selectedCall.file_name}</h2>
            
            {selectedCall.overall_score && (
              <div className="modal-score" style={{ color: getScoreColor(selectedCall.overall_score) }}>
                Score: {selectedCall.overall_score}
              </div>
            )}

            <div className="modal-section" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Assign to Team Member (Coaching)</label>
              <select 
                value={selectedCall.assigned_to || ''} 
                onChange={(e) => handleAssignCall(selectedCall.id, e.target.value)}
                disabled={assigning}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <option value="">-- Unassigned --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>

            {selectedCall.summary && (
              <div className="modal-section">
                <h4>Summary</h4>
                <p>{selectedCall.summary}</p>
              </div>
            )}

            {selectedCall.transcription && (
              <div className="modal-section">
                <h4>Transcription</h4>
                <pre className="transcript-preview">{selectedCall.transcription}</pre>
              </div>
            )}

            <div className="modal-actions">
              {canExportPDF && selectedCall.status === 'completed' && (
                <button className="modal-btn primary" onClick={() => handleExportPDF(selectedCall)}>
                  📄 Download PDF Report
                </button>
              )}
              <button className="modal-btn secondary" onClick={() => setSelectedCall(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


