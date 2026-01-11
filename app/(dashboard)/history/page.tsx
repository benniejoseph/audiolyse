'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CallAnalysis, Organization, Profile } from '@/lib/types/database';
import { generateCallAnalysisPDF } from '@/app/utils/pdfGenerator';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';
import { toast } from '@/lib/toast';
import { getAudioUrl } from '@/lib/storage/audio';
import Link from 'next/link';
import { XCircle, Search, FolderOpen } from 'lucide-react';
import CallDetailView from '@/components/analysis/CallDetailView';

interface CustomerOption {
  id: string;
  name: string;
}

// Pagination constants
const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [calls, setCalls] = useState<CallAnalysis[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');
  const [selectedCall, setSelectedCall] = useState<CallAnalysis | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Assignment State
  const [members, setMembers] = useState<Profile[]>([]);
  const [assigning, setAssigning] = useState(false);
  
  // Customer Filter State
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  
  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const supabase = createClient();
  
  // Audio Player Functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const loadAudio = useCallback(async (call: CallAnalysis) => {
    if (!call.file_path && !call.audio_url) return;
    
    setLoadingAudio(true);
    try {
      let url = call.audio_url;
      
      // If no audio_url but has file_path, get a fresh signed URL
      if (!url && call.file_path) {
        url = await getAudioUrl(call.file_path);
      }
      
      if (url && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        setCurrentAudioUrl(url);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      toast.error('Failed to load audio file');
    } finally {
      setLoadingAudio(false);
    }
  }, []);
  
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);
  
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  }, []);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    
    audio.addEventListener('timeupdate', () => setAudioCurrentTime(audio.currentTime || 0));
    audio.addEventListener('loadedmetadata', () => setAudioDuration(audio.duration || 0));
    audio.addEventListener('ended', () => { setIsPlaying(false); setAudioCurrentTime(0); });
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // Load audio when selected call changes
  useEffect(() => {
    if (selectedCall && (selectedCall.file_path || selectedCall.audio_url)) {
      loadAudio(selectedCall);
    } else {
      setCurrentAudioUrl(null);
      setAudioCurrentTime(0);
      setAudioDuration(0);
    }
  }, [selectedCall, loadAudio]);

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
        if (userError || !user) return;

        // Parallel fetch: organization + team members
        const [orgResponse, teamMembersResult] = await Promise.all([
          fetch('/api/organization/me'),
          null // Will fetch after we have org
        ]);

        const orgData = await orgResponse.json();
        if (!orgResponse.ok || !orgData.organization) return;

        const organization = orgData.organization;
        setOrg(organization);

        // Fetch customers for filter dropdown
        const { data: customerList } = await supabase
          .from('customer_profiles')
          .select('id, name')
          .eq('organization_id', organization.id)
          .order('name');
        
        if (customerList) {
          setCustomers(customerList);
        }

        // Build query with server-side filtering
        let query = supabase
          .from('call_analyses')
          .select('*, customer:customer_profiles(id, name)', { count: 'exact' })
          .eq('organization_id', organization.id);

        // Apply server-side status filter
        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        // Apply customer filter
        if (filterCustomer !== 'all') {
          if (filterCustomer === 'unassigned') {
            query = query.is('customer_id', null);
          } else {
            query = query.eq('customer_id', filterCustomer);
          }
        }

        // Apply server-side search
        if (searchQuery.trim()) {
          query = query.ilike('file_name', `%${searchQuery}%`);
        }

        // Apply sorting
        if (sortBy === 'score') {
          query = query.order('overall_score', { ascending: false, nullsFirst: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data: callHistory, error: callsError, count } = await query;

        if (callsError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching call history:', callsError);
          }
          return;
        }

        if (callHistory) {
          setCalls(callHistory);
          setTotalCount(count || 0);
          setHasMore((count || 0) > (from + callHistory.length));
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
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading history:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supabase, refreshKey, currentPage, searchQuery, filterStatus, sortBy, filterCustomer]);

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
      
      toast.success('Call assigned successfully!');
    } catch (e: any) {
      toast.error('Failed to assign call');
    } finally {
      setAssigning(false);
    }
  };

  // With server-side filtering, we use calls directly
  const filteredCalls = calls;
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filterStatus, sortBy, filterCustomer]);
  
  // Pagination helpers
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < totalPages - 1;
  
  const goToPage = (page: number) => {
    setLoading(true);
    setCurrentPage(page);
  };

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
          <span className="search-icon"><Search size={16} /></span>
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
          <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
            <option value="all">All Customers</option>
            <option value="unassigned">Unassigned</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
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
          <div className="empty-icon"><FolderOpen size={48} /></div>
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

      {/* Pagination Controls */}
      {totalCount > PAGE_SIZE && (
        <div className="pagination-controls" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem',
          padding: '1rem'
        }}>
          <button 
            onClick={() => goToPage(0)} 
            disabled={!canGoBack || loading}
            style={{ padding: '8px 12px', borderRadius: '6px', cursor: canGoBack ? 'pointer' : 'not-allowed', opacity: canGoBack ? 1 : 0.5 }}
          >
            ⏮️ First
          </button>
          <button 
            onClick={() => goToPage(currentPage - 1)} 
            disabled={!canGoBack || loading}
            style={{ padding: '8px 12px', borderRadius: '6px', cursor: canGoBack ? 'pointer' : 'not-allowed', opacity: canGoBack ? 1 : 0.5 }}
          >
            ← Previous
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>
            Page {currentPage + 1} of {totalPages} ({totalCount} total)
          </span>
          <button 
            onClick={() => goToPage(currentPage + 1)} 
            disabled={!canGoForward || loading}
            style={{ padding: '8px 12px', borderRadius: '6px', cursor: canGoForward ? 'pointer' : 'not-allowed', opacity: canGoForward ? 1 : 0.5 }}
          >
            Next →
          </button>
          <button 
            onClick={() => goToPage(totalPages - 1)} 
            disabled={!canGoForward || loading}
            style={{ padding: '8px 12px', borderRadius: '6px', cursor: canGoForward ? 'pointer' : 'not-allowed', opacity: canGoForward ? 1 : 0.5 }}
          >
            Last ⏭️
          </button>
        </div>
      )}

      {/* Call Detail Full Screen Overlay */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-4 md:p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
           <div className="max-w-7xl mx-auto w-full bg-background rounded-xl shadow-2xl overflow-hidden min-h-[90vh]">
              <div className="p-4 border-b flex justify-between items-center bg-card">
                 <h2 className="text-xl font-bold">Analysis Details</h2>
                 <button 
                  onClick={() => setSelectedCall(null)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                 >
                    <XCircle size={24} />
                 </button>
              </div>
              <div className="p-6">
                <CallDetailView 
                   call={selectedCall} 
                   onBack={() => setSelectedCall(null)} 
                   showBackButton={false} 
                />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

