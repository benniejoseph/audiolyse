"use client";

import { useCallback, useMemo, useState } from 'react';

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

type BulkCallResult = { id: string; fileName: string; fileSize: number; status: 'pending' | 'processing' | 'completed' | 'error'; result?: ApiResult; error?: string };

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkCallResult[]>([]);
  const [selectedCall, setSelectedCall] = useState<BulkCallResult | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'coaching' | 'moments' | 'transcript' | 'summary' | 'predictions'>('metrics');
  const [viewMode, setViewMode] = useState<'upload' | 'dashboard' | 'detail'>('upload');

  const onDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault(); ev.stopPropagation(); setDragOver(false);
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.webm', '.amr', '.3gp', '.mpeg', '.mpga', '.mp4'];
    const droppedFiles = Array.from(ev.dataTransfer.files).filter(f => 
      f.type.startsWith('audio/') || f.type.startsWith('video/') || f.type === 'application/octet-stream' ||
      audioExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (droppedFiles.length > 0) setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const onInput = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(ev.target.files || []);
    if (selectedFiles.length > 0) setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));
  const clearAll = () => { setFiles([]); setBulkResults([]); setSelectedCall(null); setViewMode('upload'); };
  const canSubmit = files.length > 0 && !isLoading;

  const processFile = async (file: File, id: string): Promise<BulkCallResult> => {
    try {
      const body = new FormData(); body.append('audio', file);
      const res = await fetch('/api/transcribe', { method: 'POST', body });
      if (!res.ok) throw new Error(await res.text() || 'Failed to process audio');
      const data: ApiResult = await res.json();
      return { id, fileName: file.name, fileSize: file.size, status: 'completed', result: data };
    } catch (e: any) {
      return { id, fileName: file.name, fileSize: file.size, status: 'error', error: e?.message || 'Something went wrong' };
    }
  };

  const handleBulkUpload = useCallback(async () => {
    if (files.length === 0) return;
    setIsLoading(true); setViewMode('dashboard');
    const initialResults: BulkCallResult[] = files.map((file, i) => ({ id: `call-${Date.now()}-${i}`, fileName: file.name, fileSize: file.size, status: 'pending' }));
    setBulkResults(initialResults);
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; const id = initialResults[i].id;
      setBulkResults(prev => prev.map(r => (r.id === id ? { ...r, status: 'processing' } : r)));
      const result = await processFile(file, id);
      setBulkResults(prev => prev.map(r => (r.id === id ? result : r)));
    }
    setIsLoading(false);
  }, [files]);

  const summary = useMemo(() => {
    const completed = bulkResults.filter(r => r.status === 'completed' && r.result);
    if (completed.length === 0) return null;
    const scores = completed.map(r => r.result?.coaching?.overallScore || 0).filter(s => s > 0);
    const sentiments = completed.map(r => r.result?.insights?.sentiment?.toLowerCase() || '');
    const allStrengths = completed.flatMap(r => r.result?.coaching?.strengths || []);
    const allWeaknesses = completed.flatMap(r => r.result?.coaching?.weaknesses || []);
    const redFlags = completed.flatMap(r => r.result?.coaching?.redFlags || []);
    const avgConversion = completed.reduce((a, r) => a + (r.result?.predictions?.conversionProbability || 0), 0) / completed.length;
    const countFreq = (arr: string[]) => {
      const freq: Record<string, number> = {};
      arr.forEach(item => { const key = item.toLowerCase().trim(); freq[key] = (freq[key] || 0) + 1; });
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    };
    return {
      totalCalls: bulkResults.length, completedCalls: completed.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      avgConversion: Math.round(avgConversion),
      sentimentBreakdown: { positive: sentiments.filter(s => s === 'positive').length, neutral: sentiments.filter(s => s === 'neutral').length, negative: sentiments.filter(s => s === 'negative').length },
      commonStrengths: countFreq(allStrengths), commonWeaknesses: countFreq(allWeaknesses), redFlagCount: redFlags.length,
    };
  }, [bulkResults]);

  const onCopy = (text: string) => navigator.clipboard.writeText(text);
  const download = (filename: string, content: string, mime = 'application/json') => {
    const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const exportAllResults = () => download('bulk-analysis.json', JSON.stringify({ exportedAt: new Date().toISOString(), summary, calls: bulkResults.filter(r => r.status === 'completed').map(r => ({ fileName: r.fileName, ...r.result })) }, null, 2));
  const getScoreColor = (score: number) => score >= 80 ? '#7cffc7' : score >= 60 ? '#ffd166' : '#ff6b6b';
  const getRiskColor = (risk: string) => risk === 'high' ? '#ff6b6b' : risk === 'medium' ? '#ffd166' : '#7cffc7';
  const getMomentIcon = (type: string) => {
    const icons: Record<string, string> = { complaint: '😤', compliment: '😊', objection: '🤔', competitor_mention: '🏢', pricing_discussion: '💰', commitment: '✅', breakthrough: '💡', escalation_risk: '⚠️', pain_point: '😣', positive_signal: '👍' };
    return icons[type] || '📌';
  };

  const ScoreRing = ({ score, size = 80, label }: { score: number; size?: number; label?: string }) => {
    const circumference = 2 * Math.PI * 35; const offset = circumference - (score / 100) * circumference;
    return (
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="35" stroke={getScoreColor(score)} strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="score-value" style={{ color: getScoreColor(score) }}>{score}</div>
        {label && <div className="score-label">{label}</div>}
      </div>
    );
  };

  const TalkRatioBar = ({ agent, customer, silence }: { agent: number; customer: number; silence: number }) => (
    <div className="talk-ratio-container">
      <div className="talk-ratio-bar">
        <div className="ratio-segment agent" style={{ width: `${agent}%` }} title={`Agent: ${agent}%`} />
        <div className="ratio-segment customer" style={{ width: `${customer}%` }} title={`Customer: ${customer}%`} />
        <div className="ratio-segment silence" style={{ width: `${silence}%` }} title={`Silence: ${silence}%`} />
      </div>
      <div className="ratio-legend">
        <span><span className="dot agent" /> Agent {agent}%</span>
        <span><span className="dot customer" /> Customer {customer}%</span>
        <span><span className="dot silence" /> Silence {silence}%</span>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <div className="tag"><span>🎧</span><strong>CallTranscribe</strong></div>
        <span className="muted">Advanced Call Intelligence • AI Coaching • Predictive Analytics</span>
        {viewMode !== 'upload' && <button className="back-btn" onClick={clearAll}>← New Analysis</button>}
      </div>

      {viewMode === 'upload' && (
        <div className="card upload-card">
          <h1 className="title">Advanced Call Analysis</h1>
          <p className="subtitle">Upload calls for deep analytics, coaching scores, and predictive insights</p>
          <div className={`uploader ${dragOver ? 'dragover' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
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
                <div key={i} className="file-item"><span className="file-icon">🎵</span><span className="file-name">{file.name}</span><span className="file-size">{Math.round(file.size / 1024)} KB</span><button className="remove-btn" onClick={() => removeFile(i)}>×</button></div>
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
                <div className="stat-card highlight"><div className="stat-value" style={{ color: getScoreColor(summary.averageScore) }}>{summary.averageScore}</div><div className="stat-label">Avg. Score</div></div>
                <div className="stat-card"><div className="stat-value" style={{ color: getScoreColor(summary.avgConversion) }}>{summary.avgConversion}%</div><div className="stat-label">Avg. Conversion Prob.</div></div>
                <div className="stat-card danger"><div className="stat-value">{summary.redFlagCount}</div><div className="stat-label">Red Flags</div></div>
              </div>
              <div className="insights-grid">
                <div className="insight-card"><h4>Top Strengths</h4><ul>{summary.commonStrengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                <div className="insight-card"><h4>Common Weaknesses</h4><ul>{summary.commonWeaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
              </div>
            </div>
          )}
          <div className="card calls-list-card">
            <h3>Individual Call Results</h3>
            <div className="calls-table">{bulkResults.map((call) => (
              <div key={call.id} className={`call-row ${call.status}`} onClick={() => { if (call.status === 'completed') { setSelectedCall(call); setViewMode('detail'); } }}>
                <div className="call-status"><span className={`status-dot ${call.status}`} /></div>
                <div className="call-info">
                  <span className="call-name">{call.fileName}</span>
                  <span className="call-meta">{call.status === 'completed' ? `Score: ${call.result?.coaching?.overallScore || 0} | Conversion: ${call.result?.predictions?.conversionProbability || 0}%` : call.status === 'error' ? 'Failed' : call.status === 'processing' ? 'Processing...' : 'Waiting...'}</span>
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
                  {selectedCall.result.durationSec && <span>⏱️ {Math.round(selectedCall.result.durationSec)}s</span>}
                  <span style={{ color: selectedCall.result.insights?.sentiment === 'Positive' ? '#7cffc7' : selectedCall.result.insights?.sentiment === 'Negative' ? '#ff6b6b' : '#ffd166' }}>
                    {selectedCall.result.insights?.sentiment === 'Positive' ? '😊' : selectedCall.result.insights?.sentiment === 'Negative' ? '😤' : '😐'} {selectedCall.result.insights?.sentiment}
                  </span>
                </div>
              </div>
              <div className="header-scores">
                <ScoreRing score={selectedCall.result.coaching?.overallScore || 0} size={70} />
                <div className="mini-predictions">
                  <div className="mini-pred"><span>Conversion</span><strong style={{ color: getScoreColor(selectedCall.result.predictions?.conversionProbability || 0) }}>{selectedCall.result.predictions?.conversionProbability || 0}%</strong></div>
                  <div className="mini-pred"><span>Churn Risk</span><strong style={{ color: getRiskColor(selectedCall.result.predictions?.churnRisk || 'low') }}>{selectedCall.result.predictions?.churnRisk || 'low'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            {(['metrics', 'coaching', 'moments', 'predictions', 'transcript', 'summary'] as const).map(key => (
              <button key={key} className={`tab ${activeTab === key ? 'tab-active' : ''}`} onClick={() => setActiveTab(key)}>
                {key === 'metrics' ? '📊 Metrics' : key === 'coaching' ? '🎯 Coaching' : key === 'moments' ? '⚡ Key Moments' : key === 'predictions' ? '🔮 Predictions' : key === 'transcript' ? '📝 Transcript' : '📋 Summary'}
              </button>
            ))}
          </div>

          <div className="card tab-content">
            {activeTab === 'metrics' && selectedCall.result.conversationMetrics && (
              <div className="metrics-view">
                <h3>Conversation Metrics</h3>
                <div className="metric-section">
                  <h4>Talk Ratio</h4>
                  <TalkRatioBar agent={selectedCall.result.conversationMetrics.agentTalkRatio} customer={selectedCall.result.conversationMetrics.customerTalkRatio} silence={selectedCall.result.conversationMetrics.silenceRatio} />
                  <p className="metric-insight">{selectedCall.result.conversationMetrics.agentTalkRatio > 60 ? '⚠️ Agent talking too much. Aim for 40-50%.' : selectedCall.result.conversationMetrics.agentTalkRatio < 30 ? '⚠️ Agent should engage more.' : '✅ Good talk balance!'}</p>
                </div>
                
                <div className="metrics-grid-4">
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.totalQuestions}</div><div className="metric-label">Questions Asked</div></div>
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.openQuestions}</div><div className="metric-label">Open Questions</div></div>
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.closedQuestions}</div><div className="metric-label">Closed Questions</div></div>
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.agentInterruptions + selectedCall.result.conversationMetrics.customerInterruptions}</div><div className="metric-label">Interruptions</div></div>
                </div>

                <div className="metrics-grid-4">
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.avgResponseTimeSec?.toFixed(1)}s</div><div className="metric-label">Avg Response Time</div></div>
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.longestPauseSec?.toFixed(1)}s</div><div className="metric-label">Longest Pause</div></div>
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.wordsPerMinuteAgent}</div><div className="metric-label">Agent WPM</div></div>
                  <div className="metric-box"><div className="metric-value">{selectedCall.result.conversationMetrics.wordsPerMinuteCustomer}</div><div className="metric-label">Customer WPM</div></div>
                </div>

                {selectedCall.result.conversationSegments && selectedCall.result.conversationSegments.length > 0 && (
                  <div className="segments-section">
                    <h4>Conversation Flow</h4>
                    <div className="segments-timeline">
                      {selectedCall.result.conversationSegments.map((seg, i) => (
                        <div key={i} className={`segment-card ${seg.quality}`}>
                          <div className="segment-header"><strong>{seg.name}</strong><span className={`quality-badge ${seg.quality}`}>{seg.quality}</span></div>
                          <div className="segment-time">{seg.startTime} - {seg.endTime} ({seg.durationSec}s)</div>
                          {seg.notes && <div className="segment-notes">{seg.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCall.result.customerProfile && (
                  <div className="customer-profile-section">
                    <h4>Customer Profile</h4>
                    <div className="profile-grid">
                      <div className="profile-item"><span>Communication</span><strong>{selectedCall.result.customerProfile.communicationStyle}</strong></div>
                      <div className="profile-item"><span>Decision Style</span><strong>{selectedCall.result.customerProfile.decisionStyle}</strong></div>
                      <div className="profile-item"><span>Engagement</span><strong>{selectedCall.result.customerProfile.engagementLevel}</strong></div>
                      <div className="profile-item"><span>Price Sensitivity</span><strong style={{ color: getRiskColor(selectedCall.result.customerProfile.pricesSensitivity) }}>{selectedCall.result.customerProfile.pricesSensitivity}</strong></div>
                    </div>
                    {selectedCall.result.customerProfile.concerns?.length > 0 && (
                      <div className="profile-concerns"><strong>Concerns:</strong> {selectedCall.result.customerProfile.concerns.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'coaching' && selectedCall.result.coaching && (
              <div className="coaching-view">
                <div className="coaching-header">
                  <ScoreRing score={selectedCall.result.coaching.overallScore} size={100} />
                  <div className="coaching-summary"><h4>Overall Assessment</h4><p>{selectedCall.result.coaching.coachingSummary || 'No summary available'}</p></div>
                </div>

                {selectedCall.result.coaching.categoryScores && (
                  <div className="category-scores">
                    <h4>Category Breakdown</h4>
                    <div className="scores-grid">
                      {Object.entries(selectedCall.result.coaching.categoryScores).map(([key, score]) => (
                        <div key={key} className="score-item"><div className="score-bar-container"><div className="score-bar" style={{ width: `${score}%`, background: getScoreColor(score) }} /></div><span className="score-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span><span className="score-num">{score}</span></div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="coaching-details">
                  <div className="detail-section strengths"><h5>✓ Strengths</h5><ul>{(selectedCall.result.coaching.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                  <div className="detail-section weaknesses"><h5>✗ Areas for Improvement</h5><ul>{(selectedCall.result.coaching.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                </div>

                {selectedCall.result.coaching.missedOpportunities?.length > 0 && (
                  <div className="detail-section missed"><h5>💡 Missed Opportunities</h5><ul>{selectedCall.result.coaching.missedOpportunities.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
                )}

                <div className="detail-section suggestions"><h5>📈 Improvement Suggestions</h5><ul>{(selectedCall.result.coaching.improvementSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul></div>

                {selectedCall.result.coaching.scriptRecommendations?.length > 0 && (
                  <div className="detail-section scripts"><h5>📝 Recommended Scripts</h5><div className="script-cards">{selectedCall.result.coaching.scriptRecommendations.map((s, i) => (
                    <div key={i} className="script-card"><span>&ldquo;{s}&rdquo;</span><button className="copy-small" onClick={() => onCopy(s)}>Copy</button></div>
                  ))}</div></div>
                )}

                {selectedCall.result.coaching.redFlags?.length > 0 && (
                  <div className="detail-section red-flags"><h5>🚨 Red Flags</h5><ul>{selectedCall.result.coaching.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                )}
              </div>
            )}

            {activeTab === 'moments' && (
              <div className="moments-view">
                <h3>Key Moments Timeline</h3>
                {selectedCall.result.keyMoments && selectedCall.result.keyMoments.length > 0 ? (
                  <div className="moments-timeline">
                    {selectedCall.result.keyMoments.map((m, i) => (
                      <div key={i} className={`moment-card ${m.sentiment} ${m.importance}`}>
                        <div className="moment-header">
                          <span className="moment-icon">{getMomentIcon(m.type)}</span>
                          <span className="moment-type">{m.type.replace(/_/g, ' ')}</span>
                          <span className="moment-time">{m.timestamp}</span>
                          <span className={`moment-importance ${m.importance}`}>{m.importance}</span>
                        </div>
                        <div className="moment-text">&ldquo;{m.text}&rdquo;</div>
                        <div className="moment-speaker">— {m.speaker}</div>
                      </div>
                    ))}
                  </div>
                ) : <p className="muted">No key moments detected</p>}

                {selectedCall.result.actionItems && (
                  <div className="action-items-section">
                    <h4>Action Items</h4>
                    <div className="action-grid">
                      {selectedCall.result.actionItems.forAgent?.length > 0 && (
                        <div className="action-card agent"><h5>For Agent</h5><ul>{selectedCall.result.actionItems.forAgent.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                      )}
                      {selectedCall.result.actionItems.forManager?.length > 0 && (
                        <div className="action-card manager"><h5>For Manager</h5><ul>{selectedCall.result.actionItems.forManager.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                      )}
                      {selectedCall.result.actionItems.forFollowUp?.length > 0 && (
                        <div className="action-card followup"><h5>Follow-Up Required</h5><ul>{selectedCall.result.actionItems.forFollowUp.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'predictions' && selectedCall.result.predictions && (
              <div className="predictions-view">
                <h3>Predictive Analytics</h3>
                <div className="predictions-grid">
                  <div className="prediction-card">
                    <ScoreRing score={selectedCall.result.predictions.conversionProbability} size={90} />
                    <h4>Conversion Probability</h4>
                    <p>{selectedCall.result.predictions.conversionProbability >= 70 ? 'High likelihood of conversion' : selectedCall.result.predictions.conversionProbability >= 40 ? 'Moderate conversion potential' : 'Low conversion probability - needs follow-up'}</p>
                  </div>
                  <div className="prediction-card">
                    <div className={`risk-indicator ${selectedCall.result.predictions.churnRisk}`}>{selectedCall.result.predictions.churnRisk === 'high' ? '⚠️' : selectedCall.result.predictions.churnRisk === 'medium' ? '⚡' : '✅'}</div>
                    <h4>Churn Risk</h4>
                    <p className={`risk-${selectedCall.result.predictions.churnRisk}`}>{selectedCall.result.predictions.churnRisk.toUpperCase()}</p>
                  </div>
                  <div className="prediction-card">
                    <div className={`risk-indicator ${selectedCall.result.predictions.escalationRisk}`}>{selectedCall.result.predictions.escalationRisk === 'high' ? '🚨' : selectedCall.result.predictions.escalationRisk === 'medium' ? '⚡' : '✅'}</div>
                    <h4>Escalation Risk</h4>
                    <p className={`risk-${selectedCall.result.predictions.escalationRisk}`}>{selectedCall.result.predictions.escalationRisk.toUpperCase()}</p>
                  </div>
                  <div className="prediction-card">
                    <div className={`risk-indicator ${selectedCall.result.predictions.satisfactionLikely}`}>{selectedCall.result.predictions.satisfactionLikely === 'high' ? '😊' : selectedCall.result.predictions.satisfactionLikely === 'low' ? '😤' : '😐'}</div>
                    <h4>Satisfaction</h4>
                    <p className={`risk-${selectedCall.result.predictions.satisfactionLikely === 'high' ? 'low' : selectedCall.result.predictions.satisfactionLikely === 'low' ? 'high' : 'medium'}`}>{selectedCall.result.predictions.satisfactionLikely.toUpperCase()}</p>
                  </div>
                </div>
                <div className="prediction-details">
                  <div className="pred-item"><span>Follow-up Needed:</span><strong>{selectedCall.result.predictions.followUpNeeded ? 'Yes' : 'No'}</strong></div>
                  <div className="pred-item"><span>Urgency Level:</span><strong style={{ color: getRiskColor(selectedCall.result.predictions.urgencyLevel) }}>{selectedCall.result.predictions.urgencyLevel.toUpperCase()}</strong></div>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <section className="result">
                <div className="sectionTitle"><strong>Full Transcription</strong><button className="copy" onClick={() => onCopy(selectedCall.result?.transcription || '')}>Copy</button></div>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{selectedCall.result.transcription || 'No transcription'}</p>
              </section>
            )}

            {activeTab === 'summary' && (
              <div>
                <section className="result">
                  <div className="sectionTitle"><strong>Call Summary</strong><button className="copy" onClick={() => onCopy(selectedCall.result?.summary || '')}>Copy</button></div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCall.result.summary || 'No summary'}</p>
                </section>
                <section className="result" style={{ marginTop: 16 }}>
                  <h4>Minutes of Meeting</h4>
                  <div className="grid-two">
                    <div><strong>Participants</strong><ul>{(selectedCall.result.mom?.participants ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul></div>
                    <div><strong>Decisions</strong><ul>{(selectedCall.result.mom?.decisions ?? []).map((d, i) => <li key={i}>{d}</li>)}</ul></div>
                    <div><strong>Action Items</strong><ul>{(selectedCall.result.mom?.actionItems ?? []).map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                    <div><strong>Next Steps</strong><ul>{(selectedCall.result.mom?.nextSteps ?? []).map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                  </div>
                </section>
                <section className="result" style={{ marginTop: 16 }}>
                  <h4>Topics & Keywords</h4>
                  <div className="keyword-tags">{(selectedCall.result.insights?.topics ?? []).map((t, i) => <span key={i} className="keyword-tag topic">{t}</span>)}</div>
                  <div className="keyword-tags" style={{ marginTop: 8 }}>{(selectedCall.result.insights?.keywords ?? []).map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}</div>
                </section>
              </div>
            )}
          </div>

          <div className="card">
            <div className="sectionTitle"><strong>Export Options</strong></div>
            <div className="export-buttons">
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-full.json`, JSON.stringify(selectedCall.result, null, 2))}>Export Full Analysis</button>
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-transcript.txt`, selectedCall.result?.transcription || '', 'text/plain')}>Export Transcript</button>
              <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-coaching.json`, JSON.stringify(selectedCall.result?.coaching, null, 2))}>Export Coaching</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
