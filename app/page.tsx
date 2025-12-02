"use client";

import { useCallback, useMemo, useState } from 'react';
import { 
  ApiResult, BulkCallResult, BulkAnalysisSummary, Coaching, 
  ConversationMetrics, ConversationSegment, KeyMoment, Predictions, CustomerProfile, ActionItems,
  getMomentIcon, getMomentLabel, getQualityColor, getRiskColor
} from './types';

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkCallResult[]>([]);
  const [selectedCall, setSelectedCall] = useState<BulkCallResult | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'moments' | 'coaching' | 'transcript' | 'summary' | 'predictions'>('metrics');
  const [viewMode, setViewMode] = useState<'upload' | 'dashboard' | 'detail'>('upload');

  const onDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragOver(false);
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.webm', '.amr', '.3gp', '.mpeg', '.mpga', '.mp4'];
    const droppedFiles = Array.from(ev.dataTransfer.files).filter(f => 
      f.type.startsWith('audio/') || 
      f.type.startsWith('video/') ||
      f.type === 'application/octet-stream' ||
      audioExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const onInput = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(ev.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setBulkResults([]);
    setSelectedCall(null);
    setViewMode('upload');
  }, []);

  const canSubmit = useMemo(() => files.length > 0 && !isLoading, [files.length, isLoading]);

  const processFile = async (file: File, id: string): Promise<BulkCallResult> => {
    try {
      const body = new FormData();
      body.append('audio', file);
      const res = await fetch('/api/transcribe', { method: 'POST', body });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to process audio');
      }
      const data: ApiResult = await res.json();
      return { id, fileName: file.name, fileSize: file.size, status: 'completed', result: data, processedAt: new Date() };
    } catch (e: any) {
      return { id, fileName: file.name, fileSize: file.size, status: 'error', error: e?.message || 'Something went wrong' };
    }
  };

  const handleBulkUpload = useCallback(async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setViewMode('dashboard');
    const initialResults: BulkCallResult[] = files.map((file, i) => ({
      id: `call-${Date.now()}-${i}`, fileName: file.name, fileSize: file.size, status: 'pending',
    }));
    setBulkResults(initialResults);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = initialResults[i].id;
      setBulkResults(prev => prev.map(r => (r.id === id ? { ...r, status: 'processing' } : r)));
      const result = await processFile(file, id);
      setBulkResults(prev => prev.map(r => (r.id === id ? result : r)));
    }
    setIsLoading(false);
  }, [files]);

  const summary = useMemo((): BulkAnalysisSummary | null => {
    const completed = bulkResults.filter(r => r.status === 'completed' && r.result);
    if (completed.length === 0) return null;
    const scores = completed.map(r => r.result?.coaching?.overallScore || 0).filter(s => s > 0);
    const sentiments = completed.map(r => r.result?.insights?.sentiment?.toLowerCase() || '');
    const talkRatios = completed.map(r => r.result?.conversationMetrics?.agentTalkRatio || 0).filter(r => r > 0);
    const questions = completed.map(r => r.result?.conversationMetrics?.totalQuestions || 0);
    const allStrengths = completed.flatMap(r => r.result?.coaching?.strengths || []);
    const allWeaknesses = completed.flatMap(r => r.result?.coaching?.weaknesses || []);
    const allSuggestions = completed.flatMap(r => r.result?.coaching?.improvementSuggestions || []);
    const redFlags = completed.flatMap(r => r.result?.coaching?.redFlags || []);
    const allMoments = completed.flatMap(r => r.result?.keyMoments || []);
    const countFrequency = (arr: string[]) => {
      const freq: Record<string, number> = {};
      arr.forEach(item => { const key = item.toLowerCase().trim(); freq[key] = (freq[key] || 0) + 1; });
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    };
    return {
      totalCalls: bulkResults.length,
      completedCalls: completed.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      sentimentBreakdown: {
        positive: sentiments.filter(s => s === 'positive').length,
        neutral: sentiments.filter(s => s === 'neutral').length,
        negative: sentiments.filter(s => s === 'negative').length,
      },
      avgTalkRatio: talkRatios.length > 0 ? Math.round(talkRatios.reduce((a, b) => a + b, 0) / talkRatios.length) : 0,
      avgQuestions: questions.length > 0 ? Math.round(questions.reduce((a, b) => a + b, 0) / questions.length) : 0,
      commonStrengths: countFrequency(allStrengths),
      commonWeaknesses: countFrequency(allWeaknesses),
      topImprovementAreas: countFrequency(allSuggestions),
      redFlagCount: redFlags.length,
      keyMomentsSummary: {
        complaints: allMoments.filter(m => m.type === 'complaint').length,
        compliments: allMoments.filter(m => m.type === 'compliment').length,
        objections: allMoments.filter(m => m.type === 'objection').length,
        competitorMentions: allMoments.filter(m => m.type === 'competitor_mention').length,
      },
    };
  }, [bulkResults]);

  const onCopy = useCallback((text: string) => { navigator.clipboard.writeText(text); }, []);
  const download = useCallback((filename: string, content: string, mime = 'application/json') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }, []);
  const exportAllResults = useCallback(() => {
    const exportData = { exportedAt: new Date().toISOString(), summary, calls: bulkResults.filter(r => r.status === 'completed').map(r => ({ fileName: r.fileName, ...r.result })) };
    download('bulk-analysis.json', JSON.stringify(exportData, null, 2));
  }, [bulkResults, summary, download]);

  const getScoreColor = (score: number) => score >= 80 ? '#7cffc7' : score >= 60 ? '#ffd166' : '#ff6b6b';
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

  const ScoreRing = ({ score, size = 80, label }: { score: number; size?: number; label?: string }) => {
    const circumference = 2 * Math.PI * 35;
    const offset = circumference - (score / 100) * circumference;
  return (
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="35" stroke={getScoreColor(score)} strokeWidth="6" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="score-value" style={{ color: getScoreColor(score) }}>{score}</div>
        {label && <div className="score-label">{label}</div>}
      </div>
    );
  };

  const TalkRatioBar = ({ metrics }: { metrics: ConversationMetrics }) => (
    <div className="talk-ratio-container">
      <div className="talk-ratio-bar">
        <div className="ratio-segment agent" style={{ width: `${metrics.agentTalkRatio}%` }}>
          <span>{metrics.agentTalkRatio}%</span>
        </div>
        <div className="ratio-segment customer" style={{ width: `${metrics.customerTalkRatio}%` }}>
          <span>{metrics.customerTalkRatio}%</span>
        </div>
        <div className="ratio-segment silence" style={{ width: `${metrics.silenceRatio}%` }}>
          <span>{metrics.silenceRatio}%</span>
        </div>
      </div>
      <div className="ratio-legend">
        <span className="legend-item"><span className="dot agent"></span> Agent</span>
        <span className="legend-item"><span className="dot customer"></span> Customer</span>
        <span className="legend-item"><span className="dot silence"></span> Silence</span>
      </div>
    </div>
  );

  const MetricsGrid = ({ metrics }: { metrics: ConversationMetrics }) => (
    <div className="metrics-grid-detailed">
      <div className="metric-box">
        <div className="metric-icon">❓</div>
        <div className="metric-value">{metrics.totalQuestions}</div>
        <div className="metric-label">Questions Asked</div>
        <div className="metric-sub">Open: {metrics.openQuestions} | Closed: {metrics.closedQuestions}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon">🔄</div>
        <div className="metric-value">{metrics.agentInterruptions + metrics.customerInterruptions}</div>
        <div className="metric-label">Interruptions</div>
        <div className="metric-sub">Agent: {metrics.agentInterruptions} | Customer: {metrics.customerInterruptions}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon">⏱️</div>
        <div className="metric-value">{metrics.avgResponseTimeSec.toFixed(1)}s</div>
        <div className="metric-label">Avg Response Time</div>
        <div className="metric-sub">Longest pause: {metrics.longestPauseSec.toFixed(1)}s</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon">🗣️</div>
        <div className="metric-value">{metrics.wordsPerMinuteAgent}</div>
        <div className="metric-label">Agent WPM</div>
        <div className="metric-sub">Customer: {metrics.wordsPerMinuteCustomer} WPM</div>
      </div>
    </div>
  );

  const SegmentsTimeline = ({ segments, duration }: { segments: ConversationSegment[], duration: number }) => (
    <div className="segments-timeline">
      <div className="segments-bar">
        {segments.map((seg, i) => (
          <div key={i} className="segment" style={{ 
            width: `${(seg.durationSec / duration) * 100}%`,
            backgroundColor: getQualityColor(seg.quality)
          }}>
            <div className="segment-tooltip">
              <strong>{seg.name}</strong><br/>
              {seg.startTime} - {seg.endTime}<br/>
              Quality: {seg.quality}<br/>
              {seg.notes}
            </div>
          </div>
        ))}
      </div>
      <div className="segments-labels">
        {segments.map((seg, i) => (
          <div key={i} className="segment-label" style={{ width: `${(seg.durationSec / duration) * 100}%` }}>
            <span className="seg-name">{seg.name}</span>
            <span className="seg-quality" style={{ color: getQualityColor(seg.quality) }}>{seg.quality}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const KeyMomentsTimeline = ({ moments }: { moments: KeyMoment[] }) => (
    <div className="key-moments-list">
      {moments.map((m, i) => (
        <div key={i} className={`moment-card ${m.sentiment} ${m.importance}`}>
          <div className="moment-header">
            <span className="moment-time">{m.timestamp}</span>
            <span className="moment-type">{getMomentIcon(m.type)} {getMomentLabel(m.type)}</span>
            <span className={`moment-badge ${m.importance}`}>{m.importance}</span>
          </div>
          <div className="moment-text">&ldquo;{m.text}&rdquo;</div>
          <div className="moment-speaker">{m.speaker === 'agent' ? '👤 Agent' : '🙋 Customer'}</div>
        </div>
      ))}
    </div>
  );

  const PredictionsCard = ({ predictions, profile }: { predictions: Predictions, profile: CustomerProfile }) => (
    <div className="predictions-grid">
      <div className="prediction-section">
        <h4>📊 Predictions</h4>
        <div className="prediction-items">
          <div className="prediction-item">
            <span className="pred-label">Conversion Probability</span>
            <div className="pred-bar">
              <div className="pred-fill" style={{ width: `${predictions.conversionProbability}%`, backgroundColor: getScoreColor(predictions.conversionProbability) }}></div>
            </div>
            <span className="pred-value">{predictions.conversionProbability}%</span>
          </div>
          <div className="prediction-item">
            <span className="pred-label">Churn Risk</span>
            <span className="pred-badge" style={{ backgroundColor: getRiskColor(predictions.churnRisk) }}>{predictions.churnRisk}</span>
          </div>
          <div className="prediction-item">
            <span className="pred-label">Escalation Risk</span>
            <span className="pred-badge" style={{ backgroundColor: getRiskColor(predictions.escalationRisk) }}>{predictions.escalationRisk}</span>
          </div>
          <div className="prediction-item">
            <span className="pred-label">Satisfaction</span>
            <span className="pred-badge" style={{ backgroundColor: getRiskColor(predictions.satisfactionLikely === 'high' ? 'low' : predictions.satisfactionLikely === 'low' ? 'high' : 'medium') }}>{predictions.satisfactionLikely}</span>
          </div>
          <div className="prediction-item">
            <span className="pred-label">Follow-up Needed</span>
            <span className={`pred-badge ${predictions.followUpNeeded ? 'yes' : 'no'}`}>{predictions.followUpNeeded ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
      <div className="prediction-section">
        <h4>👤 Customer Profile</h4>
        <div className="profile-items">
          <div className="profile-item"><span>Communication:</span> <strong>{profile.communicationStyle}</strong></div>
          <div className="profile-item"><span>Decision Style:</span> <strong>{profile.decisionStyle}</strong></div>
          <div className="profile-item"><span>Engagement:</span> <strong>{profile.engagementLevel}</strong></div>
          <div className="profile-item"><span>Price Sensitivity:</span> <strong>{profile.pricesSensitivity}</strong></div>
          {profile.concerns.length > 0 && (
            <div className="profile-list"><span>Concerns:</span><ul>{profile.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
          )}
        </div>
      </div>
    </div>
  );

  const EnhancedCoachingCard = ({ coaching }: { coaching: Coaching }) => (
    <div className="coaching-grid">
      <div className="coaching-header">
        <ScoreRing score={coaching.overallScore} size={100} />
        <div className="coaching-summary">
          <h4>Overall Assessment</h4>
          <p>{coaching.coachingSummary || 'No summary available'}</p>
        </div>
        </div>

      <div className="category-scores">
        <h5>Category Breakdown</h5>
        <div className="category-bars">
          {Object.entries(coaching.categoryScores).map(([key, value]) => (
            <div key={key} className="category-bar-item">
              <span className="cat-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div className="cat-bar">
                <div className="cat-fill" style={{ width: `${value}%`, backgroundColor: getScoreColor(value) }}></div>
              </div>
              <span className="cat-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-row">
        {[
          { label: 'Customer Handling', data: coaching.customerHandling },
          { label: 'Communication', data: coaching.communicationQuality },
          { label: 'Pitch Effectiveness', data: coaching.pitchEffectiveness },
          { label: 'Objection Handling', data: coaching.objectionHandling },
        ].map((item, i) => (
          <div key={i} className="metric-card">
            <ScoreRing score={item.data?.score || 0} size={60} />
            <div className="metric-info">
              <strong>{item.label}</strong>
              <p>{item.data?.feedback || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="coaching-details">
        <div className="detail-section strengths"><h5>✓ Strengths</h5><ul>{(coaching.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul></div>
        <div className="detail-section weaknesses"><h5>✗ Areas for Improvement</h5><ul>{(coaching.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul></div>
      </div>

      {coaching.missedOpportunities?.length > 0 && (
        <div className="detail-section missed"><h5>💡 Missed Opportunities</h5><ul>{coaching.missedOpportunities.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
      )}

      <div className="detail-section suggestions"><h5>📈 Improvement Suggestions</h5><ul>{(coaching.improvementSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul></div>

      {coaching.scriptRecommendations?.length > 0 && (
        <div className="detail-section scripts">
          <h5>📝 Recommended Scripts</h5>
          <div className="script-cards">{coaching.scriptRecommendations.map((s, i) => (
            <div key={i} className="script-card"><span>&ldquo;{s}&rdquo;</span><button className="copy-small" onClick={() => onCopy(s)}>Copy</button></div>
          ))}</div>
        </div>
      )}

      {coaching.redFlags?.length > 0 && (
        <div className="detail-section red-flags"><h5>🚨 Red Flags</h5><ul>{coaching.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
      )}
    </div>
  );

  const ActionItemsCard = ({ items }: { items: ActionItems }) => (
    <div className="action-items-grid">
      {items.forAgent?.length > 0 && (
        <div className="action-section"><h5>👤 For Agent</h5><ul>{items.forAgent.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
      )}
      {items.forManager?.length > 0 && (
        <div className="action-section"><h5>👔 For Manager</h5><ul>{items.forManager.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
      )}
      {items.forFollowUp?.length > 0 && (
        <div className="action-section"><h5>📞 Follow-up</h5><ul>{items.forFollowUp.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
      )}
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <div className="tag"><span>🎧</span><strong>CallTranscribe</strong></div>
        <span className="muted">Advanced Call Intelligence • AI Coaching • Insights</span>
        {viewMode !== 'upload' && <button className="back-btn" onClick={clearAll}>← New Analysis</button>}
      </div>

      {viewMode === 'upload' && (
        <div className="card upload-card">
          <h1 className="title">Bulk Call Analysis</h1>
          <p className="subtitle">Upload calls for deep AI analysis with metrics, moments, and coaching</p>
          <div className={`uploader ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
            <div className="upload-icon">📁</div>
            <p>Drag & drop audio files or click to browse</p>
            <div className="fileWrap">
              <button type="button" className="fileCTA" onClick={() => document.getElementById('file-input')?.click()}>Choose Files</button>
              <input id="file-input" type="file" accept="audio/*,.mpeg,.mpga,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.amr,.3gp,.mp4,video/mpeg,audio/mpeg" multiple onChange={onInput} style={{ display: 'none' }} />
            </div>
          </div>
          {files.length > 0 && (
            <div className="file-list">
              <div className="file-list-header"><h4>Selected Files ({files.length})</h4><button className="clear-btn" onClick={() => setFiles([])}>Clear All</button></div>
              <div className="file-items">{files.map((file, i) => (
                <div key={i} className="file-item">
                  <span className="file-icon">🎵</span><span className="file-name">{file.name}</span>
                  <span className="file-size">{Math.round(file.size / 1024)} KB</span>
                  <button className="remove-btn" onClick={() => removeFile(i)}>×</button>
                </div>
              ))}</div>
            </div>
          )}
          <button className="btn primary-btn" disabled={!canSubmit} onClick={handleBulkUpload}>
            {isLoading ? <span className="keren"><span className="eqbar"></span><span className="eqbar"></span><span className="eqbar"></span><span className="eqbar"></span></span> : `Analyze ${files.length} Call${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {viewMode === 'dashboard' && (
        <div className="dashboard">
          {summary && (
            <div className="card summary-card">
              <div className="summary-header"><h2>Analysis Dashboard</h2><button className="export-btn" onClick={exportAllResults}>Export All Results</button></div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-value">{summary.completedCalls}/{summary.totalCalls}</div><div className="stat-label">Calls Analyzed</div></div>
                <div className="stat-card highlight"><div className="stat-value" style={{ color: getScoreColor(summary.averageScore) }}>{summary.averageScore}</div><div className="stat-label">Avg Score</div></div>
                <div className="stat-card"><div className="stat-value">{summary.avgTalkRatio}%</div><div className="stat-label">Avg Agent Talk</div></div>
                <div className="stat-card"><div className="stat-value">{summary.avgQuestions}</div><div className="stat-label">Avg Questions</div></div>
                <div className="stat-card danger"><div className="stat-value">{summary.redFlagCount}</div><div className="stat-label">Red Flags</div></div>
                <div className="stat-card"><div className="stat-value">{summary.keyMomentsSummary.complaints}</div><div className="stat-label">Complaints</div></div>
                <div className="stat-card success"><div className="stat-value">{summary.keyMomentsSummary.compliments}</div><div className="stat-label">Compliments</div></div>
                <div className="stat-card"><div className="stat-value">{summary.keyMomentsSummary.competitorMentions}</div><div className="stat-label">Competitor Mentions</div></div>
              </div>
              <div className="insights-grid">
                <div className="insight-card"><h4>Top Strengths</h4><ul>{summary.commonStrengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                <div className="insight-card"><h4>Common Weaknesses</h4><ul>{summary.commonWeaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                <div className="insight-card full-width"><h4>Training Focus Areas</h4><ul>{summary.topImprovementAreas.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              </div>
            </div>
          )}
          <div className="card calls-list-card">
            <h3>Individual Call Results</h3>
            <div className="calls-table">{bulkResults.map((call) => (
              <div key={call.id} className={`call-row ${call.status} ${selectedCall?.id === call.id ? 'selected' : ''}`}
                onClick={() => { if (call.status === 'completed') { setSelectedCall(call); setViewMode('detail'); } }}>
                <div className="call-status"><span className={`status-dot ${call.status}`} /></div>
                <div className="call-info">
                  <span className="call-name">{call.fileName}</span>
                  <span className="call-meta">{call.status === 'completed' && call.result?.coaching?.overallScore ? `Score: ${call.result.coaching.overallScore} | ${call.result.keyMoments?.length || 0} moments` : call.status === 'error' ? 'Failed' : call.status === 'processing' ? 'Processing...' : 'Waiting...'}</span>
                </div>
                {call.status === 'completed' && <div className="call-score" style={{ color: getScoreColor(call.result?.coaching?.overallScore || 0) }}>{call.result?.coaching?.overallScore || '—'}</div>}
                {call.status === 'completed' && <span className="view-arrow">→</span>}
              </div>
            ))}</div>
          </div>
                  </div>
                )}

      {viewMode === 'detail' && selectedCall?.result && (
        <div className="detail-view">
          <button className="back-link" onClick={() => setViewMode('dashboard')}>← Back to Dashboard</button>
          <div className="card detail-header-card">
            <div className="detail-header">
              <div>
                <h2>{selectedCall.fileName}</h2>
                <div className="detail-meta">
                  <span>🌐 {selectedCall.result.language}</span>
                  {selectedCall.result.durationSec && <span>⏱️ {formatTime(selectedCall.result.durationSec)}</span>}
                  <span style={{ color: selectedCall.result.insights?.sentiment === 'Positive' ? '#7cffc7' : selectedCall.result.insights?.sentiment === 'Negative' ? '#ff6b6b' : '#ffd166' }}>
                    {selectedCall.result.insights?.sentiment === 'Positive' ? '😊' : selectedCall.result.insights?.sentiment === 'Negative' ? '😤' : '😐'} {selectedCall.result.insights?.sentiment}
                  </span>
                  <span>📍 {selectedCall.result.keyMoments?.length || 0} Key Moments</span>
                </div>
              </div>
              <ScoreRing score={selectedCall.result.coaching?.overallScore || 0} size={80} />
            </div>
          </div>

              <div className="tabs">
            {(['metrics', 'moments', 'coaching', 'predictions', 'transcript', 'summary'] as const).map(key => (
              <button key={key} className={`tab ${activeTab === key ? 'tab-active' : ''}`} onClick={() => setActiveTab(key)}>
                {key === 'metrics' ? '📊 Metrics' : key === 'moments' ? '⚡ Moments' : key === 'coaching' ? '🎯 Coaching' : key === 'predictions' ? '🔮 Predictions' : key === 'transcript' ? '📝 Transcript' : '📋 Summary'}
              </button>
            ))}
          </div>

          <div className="card tab-content">
            {activeTab === 'metrics' && selectedCall.result.conversationMetrics && (
              <div className="metrics-tab">
                <h4>Talk Time Distribution</h4>
                <TalkRatioBar metrics={selectedCall.result.conversationMetrics} />
                <h4>Conversation Metrics</h4>
                <MetricsGrid metrics={selectedCall.result.conversationMetrics} />
                {selectedCall.result.conversationSegments && selectedCall.result.conversationSegments.length > 0 && (
                  <><h4>Call Segments</h4><SegmentsTimeline segments={selectedCall.result.conversationSegments} duration={selectedCall.result.durationSec || 300} /></>
                )}
              </div>
            )}

            {activeTab === 'moments' && (
              <div className="moments-tab">
                <h4>Key Moments ({selectedCall.result.keyMoments?.length || 0})</h4>
                {selectedCall.result.keyMoments && selectedCall.result.keyMoments.length > 0 
                  ? <KeyMomentsTimeline moments={selectedCall.result.keyMoments} />
                  : <p className="muted">No key moments detected</p>}
              </div>
            )}

            {activeTab === 'coaching' && selectedCall.result.coaching && <EnhancedCoachingCard coaching={selectedCall.result.coaching} />}

            {activeTab === 'predictions' && selectedCall.result.predictions && selectedCall.result.customerProfile && (
              <div className="predictions-tab">
                <PredictionsCard predictions={selectedCall.result.predictions} profile={selectedCall.result.customerProfile} />
                {selectedCall.result.actionItems && <><h4>Action Items</h4><ActionItemsCard items={selectedCall.result.actionItems} /></>}
                  </div>
              )}

              {activeTab === 'transcript' && (
                <section className="result">
                <div className="sectionTitle"><strong>Full Transcription</strong><button className="copy" onClick={() => onCopy(selectedCall.result?.transcription || '')}>Copy</button></div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCall.result.transcription || 'No transcription'}</p>
                </section>
              )}

            {activeTab === 'summary' && (
              <div className="summary-tab">
                <section className="result">
                  <div className="sectionTitle"><strong>Call Summary</strong><button className="copy" onClick={() => onCopy(selectedCall.result?.summary || '')}>Copy</button></div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCall.result.summary || 'No summary'}</p>
                </section>
                <section className="result" style={{ marginTop: 16 }}>
                  <div className="sectionTitle"><strong>Minutes of Meeting</strong></div>
                  <div className="grid-two">
                    <div><strong>Participants</strong><ul>{(selectedCall.result.mom?.participants ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul></div>
                    <div><strong>Decisions</strong><ul>{(selectedCall.result.mom?.decisions ?? []).map((d, i) => <li key={i}>{d}</li>)}</ul></div>
                    <div><strong>Action Items</strong><ul>{(selectedCall.result.mom?.actionItems ?? []).map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                    <div><strong>Next Steps</strong><ul>{(selectedCall.result.mom?.nextSteps ?? []).map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                  </div>
                </section>
                <section className="result" style={{ marginTop: 16 }}>
                  <div className="sectionTitle"><strong>Topics & Keywords</strong></div>
                  <div className="keyword-tags">{(selectedCall.result.insights?.keywords ?? []).map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}</div>
                </section>
              </div>
            )}
          </div>

          <div className="card">
            <div className="sectionTitle"><strong>Export Options</strong></div>
            <div className="export-buttons">
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-full.json`, JSON.stringify(selectedCall.result, null, 2))}>Full Analysis (JSON)</button>
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-transcript.txt`, selectedCall.result?.transcription || '', 'text/plain')}>Transcript (TXT)</button>
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-coaching.json`, JSON.stringify(selectedCall.result?.coaching, null, 2))}>Coaching Report</button>
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-moments.json`, JSON.stringify(selectedCall.result?.keyMoments, null, 2))}>Key Moments</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
