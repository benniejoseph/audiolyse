'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateCallAnalysisPDF, generateBulkAnalysisPDF } from '@/app/utils/pdfGenerator';
import type { Organization } from '@/lib/types/database';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';

type ApiResult = {
  transcription: string;
  summary: string;
  language: string;
  durationSec?: number;
  mom: { participants: string[]; decisions: string[]; actionItems: string[]; nextSteps: string[] };
  insights?: { sentiment?: string; sentimentScore?: number; topics?: string[]; keywords?: string[] };
  coaching?: {
    overallScore: number;
    categoryScores?: { opening: number; discovery: number; solutionPresentation: number; objectionHandling: number; closing: number; empathy: number; clarity: number; compliance: number };
    strengths: string[];
    weaknesses: string[];
    missedOpportunities: string[];
    customerHandling: { score: number; feedback: string };
    communicationQuality: { score: number; feedback: string };
    pitchEffectiveness: { score: number; feedback: string };
    objectionHandling: { score: number; feedback: string };
    forcedSale?: { detected: boolean; severity: 'none' | 'mild' | 'moderate' | 'severe'; indicators: string[]; feedback: string };
    improvementSuggestions: string[];
    scriptRecommendations: string[];
    redFlags: string[];
    coachingSummary: string;
  };
  conversationMetrics?: {
    agentTalkRatio: number; customerTalkRatio: number; silenceRatio: number;
    totalQuestions: number; openQuestions: number; closedQuestions: number;
    agentInterruptions: number; customerInterruptions: number;
    avgResponseTimeSec: number; longestPauseSec: number;
    wordsPerMinuteAgent: number; wordsPerMinuteCustomer: number;
  };
  conversationSegments?: { name: string; startTime: string; endTime: string; durationSec: number; quality: string; notes: string }[];
  keyMoments?: { timestamp: string; type: string; speaker: string; text: string; sentiment: string; importance: string }[];
  predictions?: { conversionProbability: number; churnRisk: string; escalationRisk: string; satisfactionLikely: string; followUpNeeded: boolean; urgencyLevel: string };
  customerProfile?: { communicationStyle: string; decisionStyle: string; engagementLevel: string; pricesSensitivity: string; concerns: string[]; preferences: string[] };
  actionItems?: { forAgent: string[]; forManager: string[]; forFollowUp: string[] };
};

type BulkCallResult = { 
  id: string; 
  fileName: string; 
  fileSize: number; 
  status: 'pending' | 'processing' | 'completed' | 'error'; 
  result?: ApiResult; 
  error?: string;
  audioUrl?: string;
  dbId?: string; // Database ID after saving
};

const ScoreLegend = () => (
  <div className="score-legend card">
    <h4>Score Interpretation</h4>
    <div className="legend-items">
      <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#7cffc7' }}></span><span>90-100: Exceptional</span></div>
      <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#7cffc7' }}></span><span>80-89: Very Good</span></div>
      <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#ffd166' }}></span><span>70-79: Good</span></div>
      <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#ffd166' }}></span><span>60-69: Average</span></div>
      <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></span><span>0-59: Needs Work</span></div>
    </div>
    <p className="legend-note">AI scoring is strict. 70-80 is good performance.</p>
  </div>
);

export default function AnalyzePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkCallResult[]>([]);
  const [selectedCall, setSelectedCall] = useState<BulkCallResult | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'coaching' | 'moments' | 'transcript' | 'summary' | 'predictions'>('metrics');
  const [viewMode, setViewMode] = useState<'upload' | 'dashboard' | 'detail'>('upload');
  
  // Auth & organization state
  const [org, setOrg] = useState<Organization | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  
  // Audio player state
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  // Load user and org on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login?redirect=/analyze');
          return;
        }
        
        setUserId(user.id);

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
            setLimitReached(organization.calls_used >= organization.calls_limit);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuth();
  }, [supabase, router]);

  // Initialize global audio element
  useEffect(() => {
    globalAudioRef.current = new Audio();
    globalAudioRef.current.addEventListener('timeupdate', () => {
      setCurrentTime(globalAudioRef.current?.currentTime || 0);
    });
    globalAudioRef.current.addEventListener('loadedmetadata', () => {
      setAudioDuration(globalAudioRef.current?.duration || 0);
    });
    globalAudioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    globalAudioRef.current.addEventListener('pause', () => {
      setIsPlaying(false);
    });
    globalAudioRef.current.addEventListener('play', () => {
      setIsPlaying(true);
    });
    
    return () => {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
        globalAudioRef.current.src = '';
      }
    };
  }, []);

  // Load audio when selected call changes
  useEffect(() => {
    if (selectedCall?.audioUrl && globalAudioRef.current) {
      if (currentlyPlayingId !== selectedCall.id) {
        globalAudioRef.current.src = selectedCall.audioUrl;
        globalAudioRef.current.load();
        setCurrentlyPlayingId(selectedCall.id);
        setCurrentTime(0);
        setIsPlaying(false);
      }
    }
  }, [selectedCall, currentlyPlayingId]);

  const togglePlayPause = useCallback(() => {
    if (!globalAudioRef.current) return;
    if (isPlaying) {
      globalAudioRef.current.pause();
    } else {
      globalAudioRef.current.play();
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (globalAudioRef.current) {
      globalAudioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      
      // Create URLs for audio playback
      const newUrls = new Map(fileUrls);
      selectedFiles.forEach(file => {
        newUrls.set(file.name, URL.createObjectURL(file));
      });
      setFileUrls(newUrls);
    }
  }, [fileUrls]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('audio/') || 
      f.type === 'video/mpeg' || 
      f.name.endsWith('.mp3') || 
      f.name.endsWith('.wav') || 
      f.name.endsWith('.m4a') ||
      f.name.endsWith('.mpeg') ||
      f.name.endsWith('.mpga')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
    
    const newUrls = new Map(fileUrls);
    droppedFiles.forEach(file => {
      newUrls.set(file.name, URL.createObjectURL(file));
    });
    setFileUrls(newUrls);
  }, [fileUrls]);

  const removeFile = useCallback((index: number) => {
    const removedFile = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (removedFile && fileUrls.has(removedFile.name)) {
      URL.revokeObjectURL(fileUrls.get(removedFile.name)!);
      const newUrls = new Map(fileUrls);
      newUrls.delete(removedFile.name);
      setFileUrls(newUrls);
    }
  }, [files, fileUrls]);

  // Check if user can analyze more calls
  const canAnalyze = useMemo(() => {
    if (!org) return false;
    const remainingCalls = org.calls_limit - org.calls_used;
    return remainingCalls > 0 && files.length <= remainingCalls;
  }, [org, files.length]);

  // Save analysis result to database
  const saveAnalysis = async (result: BulkCallResult) => {
    if (!org || !userId || !result.result) return null;
    
    try {
      const { data, error } = await supabase
        .from('call_analyses')
        .insert({
          organization_id: org.id,
          uploaded_by: userId,
          file_name: result.fileName,
          file_size_bytes: result.fileSize,
          duration_sec: result.result.durationSec,
          language: result.result.language,
          transcription: result.result.transcription,
          summary: result.result.summary,
          overall_score: result.result.coaching?.overallScore,
          sentiment: result.result.insights?.sentiment,
          analysis_json: result.result as any,
          status: 'completed',
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Increment usage
      await supabase
        .from('organizations')
        .update({
          calls_used: (org.calls_used || 0) + 1,
          storage_used_mb: (org.storage_used_mb || 0) + (result.fileSize / (1024 * 1024)),
        })
        .eq('id', org.id);
      
      // Update local org state
      setOrg(prev => prev ? {
        ...prev,
        calls_used: prev.calls_used + 1,
        storage_used_mb: Number(prev.storage_used_mb) + (result.fileSize / (1024 * 1024)),
      } : null);
      
      // Log usage
      await supabase
        .from('usage_logs')
        .insert({
          organization_id: org.id,
          user_id: userId,
          action: 'call_analyzed',
          call_analysis_id: data?.id,
          metadata: { file_name: result.fileName, file_size: result.fileSize },
        });
      
      return data?.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      return null;
    }
  };

  const processFiles = async () => {
    if (files.length === 0 || !canAnalyze) return;
    
    setIsLoading(true);
    setViewMode('dashboard');
    
    const initialResults: BulkCallResult[] = files.map((file, index) => ({
      id: `call-${index}-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending',
      audioUrl: fileUrls.get(file.name),
    }));
    
    setBulkResults(initialResults);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setBulkResults(prev =>
        prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r)
      );
      
      try {
        const formData = new FormData();
        formData.append('audio', file);
        
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        const result: ApiResult = await response.json();
        
        // Save to database
        const completedResult: BulkCallResult = {
          ...initialResults[i],
          status: 'completed',
          result,
        };
        
        const dbId = await saveAnalysis(completedResult);
        
        setBulkResults(prev =>
          prev.map((r, idx) => idx === i ? { ...completedResult, dbId: dbId || undefined } : r)
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
        setBulkResults(prev =>
          prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: errorMessage } : r)
        );
      }
    }
    
    setIsLoading(false);
  };

  const summary = useMemo(() => {
    const completed = bulkResults.filter(r => r.status === 'completed' && r.result);
    if (completed.length === 0) return null;

    const scores = completed.map(r => r.result?.coaching?.overallScore).filter(Boolean) as number[];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highScorers = completed.filter(r => (r.result?.coaching?.overallScore || 0) >= 80);
    const needsAttention = completed.filter(r => (r.result?.coaching?.overallScore || 0) < 60);

    const redFlags = completed.flatMap(r => (r.result?.coaching?.redFlags || []).filter(flag => 
      flag && !['None', 'None detected', 'None detected.', 'N/A', 'No red flags', 'No red flags detected'].includes(flag.trim())
    ));
    
    const allWeaknesses = completed.flatMap(r => r.result?.coaching?.weaknesses || []);
    const weaknessMap: { [key: string]: number } = {};
    allWeaknesses.forEach(w => { weaknessMap[w] = (weaknessMap[w] || 0) + 1; });
    const commonWeaknesses = Object.entries(weaknessMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    const allStrengths = completed.flatMap(r => r.result?.coaching?.strengths || []);
    const strengthMap: { [key: string]: number } = {};
    allStrengths.forEach(s => { strengthMap[s] = (strengthMap[s] || 0) + 1; });
    const commonStrengths = Object.entries(strengthMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    return {
      totalAnalyzed: completed.length,
      avgScore,
      highScorers: highScorers.length,
      needsAttention: needsAttention.length,
      redFlagCount: redFlags.length,
      redFlags: redFlags.slice(0, 10),
      commonWeaknesses,
      commonStrengths,
    };
  }, [bulkResults]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#7cffc7';
    if (score >= 60) return '#ffd166';
    return '#ff6b6b';
  };

  const handleDownloadPDF = useCallback(() => {
    if (selectedCall?.result) {
      generateCallAnalysisPDF(selectedCall as any);
    }
  }, [selectedCall]);

  const handleDownloadBulkPDF = useCallback(() => {
    if (bulkResults.length > 0) {
      generateBulkAnalysisPDF(bulkResults.filter(r => r.status === 'completed' && r.result) as any);
    }
  }, [bulkResults]);

  const tierLimits = org ? SUBSCRIPTION_LIMITS[org.subscription_tier] : SUBSCRIPTION_LIMITS.free;
  const canBulkUpload = tierLimits.features.bulkUpload;
  const canExportPDF = tierLimits.features.pdfExport;

  if (authLoading) {
    return (
      <div className="analyze-loading">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // UPLOAD VIEW
  if (viewMode === 'upload') {
    return (
      <div className="analyze-page">
        <div className="analyze-header">
          <h1>Analyze Calls</h1>
          <p>Upload audio recordings for AI-powered analysis</p>
        </div>

        {/* Usage Warning */}
        {org && (
          <div className="usage-info">
            <span>
              {org.calls_used}/{org.calls_limit} calls used this month
            </span>
            {org.calls_used >= org.calls_limit && (
              <a href="/pricing" className="upgrade-btn">Upgrade →</a>
            )}
          </div>
        )}

        {/* Limit Reached Alert */}
        {limitReached && (
          <div className="limit-alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Monthly limit reached</strong>
              <p>Upgrade your plan to analyze more calls</p>
            </div>
            <a href="/pricing" className="alert-cta">View Plans</a>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''} ${limitReached ? 'disabled' : ''}`}
          onDragOver={(e) => { e.preventDefault(); if (!limitReached) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={limitReached ? undefined : handleDrop}
        >
          <div className="upload-icon">🎙️</div>
          <h3>Drop audio files here</h3>
          <p>or click to browse</p>
          <input
            type="file"
            accept="audio/*,video/mpeg,.mp3,.wav,.m4a,.mpeg,.mpga,.ogg,.webm"
            multiple={canBulkUpload}
            onChange={handleFileSelect}
            disabled={limitReached}
          />
          <span className="upload-formats">
            Supports: MP3, WAV, M4A, MPEG, OGG, WebM
            {!canBulkUpload && <span className="upgrade-note"> • Bulk upload requires Pro</span>}
          </span>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="selected-files">
            <h3>Selected Files ({files.length})</h3>
            <div className="files-list">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-icon">🎵</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <button className="remove-btn" onClick={() => removeFile(index)}>×</button>
                </div>
              ))}
            </div>
            
            {!canAnalyze && files.length > (org?.calls_limit || 0) - (org?.calls_used || 0) && (
              <p className="warning-text">
                You can only analyze {(org?.calls_limit || 0) - (org?.calls_used || 0)} more calls this month
              </p>
            )}
            
            <button 
              className="analyze-btn"
              onClick={processFiles}
              disabled={!canAnalyze || files.length === 0}
            >
              {isLoading ? 'Processing...' : `Analyze ${files.length} Call${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // DASHBOARD VIEW
  if (viewMode === 'dashboard') {
    return (
      <div className="analyze-page">
        <div className="dashboard-header">
          <button className="back-btn" onClick={() => { setViewMode('upload'); setBulkResults([]); setFiles([]); }}>
            ← Back to Upload
          </button>
          <h1>Analysis Results</h1>
          {canExportPDF && summary && (
            <button className="export-btn" onClick={handleDownloadBulkPDF}>
              📄 Export All to PDF
            </button>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-value">{summary.totalAnalyzed}</span>
              <span className="summary-label">Calls Analyzed</span>
            </div>
            <div className="summary-card">
              <span className="summary-value" style={{ color: getScoreColor(summary.avgScore) }}>
                {summary.avgScore}
              </span>
              <span className="summary-label">Avg Score</span>
            </div>
            <div className="summary-card">
              <span className="summary-value" style={{ color: '#7cffc7' }}>{summary.highScorers}</span>
              <span className="summary-label">High Performers</span>
            </div>
            <div className="summary-card">
              <span className="summary-value" style={{ color: '#ff6b6b' }}>{summary.needsAttention}</span>
              <span className="summary-label">Need Attention</span>
            </div>
            <div className="summary-card">
              <span className="summary-value" style={{ color: '#ff6b6b' }}>{summary.redFlagCount}</span>
              <span className="summary-label">Red Flags</span>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="results-list">
          {bulkResults.map((call) => (
            <div 
              key={call.id} 
              className={`result-item ${call.status}`}
              onClick={() => call.status === 'completed' && (setSelectedCall(call), setViewMode('detail'))}
            >
              <div className="result-info">
                <span className="result-name">{call.fileName}</span>
                <span className="result-size">{(call.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="result-meta">
                {call.status === 'completed' && call.result?.coaching?.overallScore && (
                  <span 
                    className="result-score"
                    style={{ color: getScoreColor(call.result.coaching.overallScore) }}
                  >
                    {call.result.coaching.overallScore}
                  </span>
                )}
                <span className={`result-status status-${call.status}`}>
                  {call.status === 'processing' && <span className="spinner"></span>}
                  {call.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Common Issues */}
        {summary && summary.commonWeaknesses.length > 0 && (
          <div className="insights-section">
            <h3>Common Areas for Improvement</h3>
            <ul className="insights-list">
              {summary.commonWeaknesses.map((w, i) => (
                <li key={i}><span className="insight-icon">⚠️</span> {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // DETAIL VIEW
  if (viewMode === 'detail' && selectedCall?.result) {
    const result = selectedCall.result;
    const coaching = result.coaching;
    const metrics = result.conversationMetrics;
    const predictions = result.predictions;

    return (
      <div className="analyze-page detail-view">
        <div className="detail-header">
          <button className="back-btn" onClick={() => setViewMode('dashboard')}>
            ← Back to Results
          </button>
          <h1>{selectedCall.fileName}</h1>
          {canExportPDF && (
            <button className="export-btn" onClick={handleDownloadPDF}>
              📄 Download PDF
            </button>
          )}
        </div>

        {/* Audio Player */}
        {selectedCall.audioUrl && (
          <div className="audio-player">
            <button className="play-btn" onClick={togglePlayPause}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <input
              type="range"
              min={0}
              max={audioDuration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="seek-bar"
            />
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          </div>
        )}

        {/* Score Overview */}
        {coaching && (
          <div className="score-overview">
            <div 
              className="main-score"
              style={{ borderColor: getScoreColor(coaching.overallScore) }}
            >
              <span className="score-value" style={{ color: getScoreColor(coaching.overallScore) }}>
                {coaching.overallScore}
              </span>
              <span className="score-label">Overall Score</span>
            </div>
            <div className="sub-scores">
              {coaching.customerHandling && (
                <div className="sub-score">
                  <span className="sub-value">{coaching.customerHandling.score}</span>
                  <span className="sub-label">Customer Handling</span>
                </div>
              )}
              {coaching.communicationQuality && (
                <div className="sub-score">
                  <span className="sub-value">{coaching.communicationQuality.score}</span>
                  <span className="sub-label">Communication</span>
                </div>
              )}
              {coaching.pitchEffectiveness && (
                <div className="sub-score">
                  <span className="sub-value">{coaching.pitchEffectiveness.score}</span>
                  <span className="sub-label">Pitch</span>
                </div>
              )}
              {coaching.objectionHandling && (
                <div className="sub-score">
                  <span className="sub-value">{coaching.objectionHandling.score}</span>
                  <span className="sub-label">Objections</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={activeTab === 'metrics' ? 'active' : ''} onClick={() => setActiveTab('metrics')}>Metrics</button>
          <button className={activeTab === 'coaching' ? 'active' : ''} onClick={() => setActiveTab('coaching')}>Coaching</button>
          <button className={activeTab === 'moments' ? 'active' : ''} onClick={() => setActiveTab('moments')}>Key Moments</button>
          <button className={activeTab === 'predictions' ? 'active' : ''} onClick={() => setActiveTab('predictions')}>Predictions</button>
          <button className={activeTab === 'transcript' ? 'active' : ''} onClick={() => setActiveTab('transcript')}>Transcript</button>
          <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Summary</button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'metrics' && metrics && (
            <div className="metrics-view">
              <div className="metrics-grid">
                <div className="metric-card">
                  <h4>Talk Ratio</h4>
                  <div className="talk-ratio-bar">
                    <div className="ratio-segment agent" style={{ width: `${(metrics.agentTalkRatio * 100)}%` }}>
                      Agent {Math.round(metrics.agentTalkRatio * 100)}%
                    </div>
                    <div className="ratio-segment customer" style={{ width: `${(metrics.customerTalkRatio * 100)}%` }}>
                      Customer {Math.round(metrics.customerTalkRatio * 100)}%
                    </div>
                  </div>
                </div>
                <div className="metric-card">
                  <h4>Questions Asked</h4>
                  <span className="metric-value">{metrics.totalQuestions}</span>
                  <p>Open: {metrics.openQuestions} | Closed: {metrics.closedQuestions}</p>
                </div>
                <div className="metric-card">
                  <h4>Interruptions</h4>
                  <p>Agent: {metrics.agentInterruptions} | Customer: {metrics.customerInterruptions}</p>
                </div>
                <div className="metric-card">
                  <h4>Response Time</h4>
                  <span className="metric-value">{metrics.avgResponseTimeSec}s</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coaching' && coaching && (
            <div className="coaching-view">
              <ScoreLegend />
              
              <div className="coaching-section">
                <h4>Strengths</h4>
                <ul className="coaching-list strengths">
                  {coaching.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                </ul>
              </div>
              
              <div className="coaching-section">
                <h4>Areas for Improvement</h4>
                <ul className="coaching-list weaknesses">
                  {coaching.weaknesses.map((w, i) => <li key={i}>⚠ {w}</li>)}
                </ul>
              </div>
              
              <div className="coaching-section">
                <h4>Missed Opportunities</h4>
                <ul className="coaching-list missed">
                  {coaching.missedOpportunities.map((m, i) => <li key={i}>💡 {m}</li>)}
                </ul>
              </div>
              
              {coaching.forcedSale && coaching.forcedSale.detected && (
                <div className="coaching-section forced-sale">
                  <h4>⚠️ Forced Sale Detection</h4>
                  <p className={`severity severity-${coaching.forcedSale.severity}`}>
                    Severity: {coaching.forcedSale.severity.toUpperCase()}
                  </p>
                  <ul>
                    {coaching.forcedSale.indicators.map((ind, i) => <li key={i}>{ind}</li>)}
                  </ul>
                  <p className="feedback">{coaching.forcedSale.feedback}</p>
                </div>
              )}
              
              {coaching.redFlags.filter(flag => 
                flag && !['None', 'None detected', 'None detected.', 'N/A', 'No red flags'].includes(flag.trim())
              ).length > 0 && (
                <div className="coaching-section red-flags">
                  <h4>🚩 Red Flags</h4>
                  <ul>
                    {coaching.redFlags
                      .filter(flag => flag && !['None', 'None detected', 'None detected.', 'N/A', 'No red flags'].includes(flag.trim()))
                      .map((flag, i) => <li key={i}>{flag}</li>)
                    }
                  </ul>
                </div>
              )}
              
              <div className="coaching-section">
                <h4>Improvement Suggestions</h4>
                <ul className="coaching-list suggestions">
                  {coaching.improvementSuggestions.map((s, i) => <li key={i}>→ {s}</li>)}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'moments' && result.keyMoments && (
            <div className="moments-view">
              {result.keyMoments.map((moment, i) => (
                <div key={i} className={`moment-item sentiment-${moment.sentiment.toLowerCase()}`}>
                  <span className="moment-time">{moment.timestamp}</span>
                  <span className="moment-type">{moment.type}</span>
                  <span className="moment-speaker">{moment.speaker}</span>
                  <p className="moment-text">&ldquo;{moment.text}&rdquo;</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'predictions' && predictions && (
            <div className="predictions-view">
              <div className="prediction-grid">
                <div className="prediction-card">
                  <h4>Conversion Probability</h4>
                  <span className="prediction-value">{Math.round(predictions.conversionProbability * 100)}%</span>
                </div>
                <div className="prediction-card">
                  <h4>Churn Risk</h4>
                  <span className={`prediction-value risk-${predictions.churnRisk.toLowerCase()}`}>
                    {predictions.churnRisk}
                  </span>
                </div>
                <div className="prediction-card">
                  <h4>Satisfaction Likely</h4>
                  <span className="prediction-value">{predictions.satisfactionLikely}</span>
                </div>
                <div className="prediction-card">
                  <h4>Follow-up Needed</h4>
                  <span className="prediction-value">{predictions.followUpNeeded ? 'Yes' : 'No'}</span>
                </div>
                <div className="prediction-card">
                  <h4>Urgency Level</h4>
                  <span className="prediction-value">{predictions.urgencyLevel}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="transcript-view">
              <pre className="transcript-text">{result.transcription}</pre>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="summary-view">
              <h4>Summary</h4>
              <p>{result.summary}</p>
              
              {result.mom && (
                <div className="mom-section">
                  <h4>Meeting Notes</h4>
                  {result.mom.decisions.length > 0 && (
                    <div>
                      <h5>Decisions</h5>
                      <ul>{result.mom.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>
                    </div>
                  )}
                  {result.mom.actionItems.length > 0 && (
                    <div>
                      <h5>Action Items</h5>
                      <ul>{result.mom.actionItems.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  )}
                  {result.mom.nextSteps.length > 0 && (
                    <div>
                      <h5>Next Steps</h5>
                      <ul>{result.mom.nextSteps.map((n, i) => <li key={i}>{n}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}


