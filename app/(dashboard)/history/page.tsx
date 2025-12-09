'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CallAnalysis, Organization } from '@/lib/types/database';
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

  const supabase = createClient();

  useEffect(() => {
    async function loadHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          const { data: organization } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single();

          if (organization) {
            setOrg(organization);

            // Get call history
            const { data: callHistory } = await supabase
              .from('call_analyses')
              .select('*')
              .eq('organization_id', organization.id)
              .order('created_at', { ascending: false });

            if (callHistory) {
              setCalls(callHistory);
            }
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supabase]);

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
        <div className="history-info">
          <span className="history-count">{calls.length} calls</span>
          <span className="history-retention">Retention: {historyDays} days</span>
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


