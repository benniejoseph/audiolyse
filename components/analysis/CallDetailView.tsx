"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, FileAudio, Activity, TrendingUp, AlertOctagon,
  AlertCircle, CheckCircle2, Zap, FileText, Database, Music,
  Play, Pause, Volume2
} from 'lucide-react';

// --- Helper Functions ---
const getScoreColor = (score: number) => {
  if (score >= 90) return 'var(--success)';
  if (score >= 75) return 'var(--accent)';
  if (score >= 60) return '#fbbf24';
  return 'var(--danger)';
};

const getRiskColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case 'high': return 'var(--danger)';
    case 'medium': return 'var(--warning)';
    case 'low': return 'var(--success)';
    default: return 'var(--main-text-muted)';
  }
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- Score Ring Component ---
const ScoreRing = ({ score, size = 80, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) => {
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
        <circle cx="40" cy="40" r="35" stroke="var(--border-color)" strokeWidth={strokeWidth} fill="none" />
        <circle 
          cx="40" cy="40" r="35" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} 
        />
      </svg>
      <div style={{ 
        position: 'absolute', top: '50%', left: '50%', 
        transform: 'translate(-50%, -50%)',
        fontSize: size < 70 ? '16px' : '20px',
        fontWeight: 'bold',
        color
      }}>{score}</div>
    </div>
  );
};

// --- Talk Ratio Bar ---
const TalkRatioBar = ({ agent, customer, silence }: { agent: number; customer: number; silence: number }) => {
  const normalize = (val: number) => val > 1 ? val / 100 : val;
  const agentPct = normalize(agent) * 100;
  const customerPct = normalize(customer) * 100;
  const silencePct = normalize(silence) * 100;
  
  return (
    <div>
      <div style={{ display: 'flex', height: '12px', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ width: `${agentPct}%`, background: 'var(--accent)' }} title={`Agent: ${agentPct.toFixed(1)}%`} />
        <div style={{ width: `${customerPct}%`, background: '#8b5cf6' }} title={`Customer: ${customerPct.toFixed(1)}%`} />
        <div style={{ width: `${silencePct}%`, background: 'var(--border-color)' }} title={`Silence: ${silencePct.toFixed(1)}%`} />
      </div>
      <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} /> Agent {agentPct.toFixed(0)}%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }} /> Customer {customerPct.toFixed(0)}%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-color)' }} /> Silence {silencePct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// --- Modern Audio Player ---
const AudioPlayer = ({ audioUrl }: { audioUrl?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.onloadedmetadata = () => setDuration(audioRef.current?.duration || 0);
      audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current?.currentTime || 0);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (!audioUrl) return <div style={{ color: 'var(--main-text-muted)', fontStyle: 'italic', fontSize: '14px' }}>Audio not available</div>;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player-modern">
      <audio ref={audioRef} style={{ display: 'none' }} />
      <button className="audio-play-btn" onClick={togglePlay}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
      </button>
      <div className="audio-progress-container">
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          value={currentTime} 
          onChange={handleSeek}
          className="audio-slider"
          style={{ background: `linear-gradient(to right, var(--accent) ${progress}%, rgba(255,255,255,0.1) ${progress}%)` }}
        />
        <div className="audio-time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// --- Transcript Display ---
const TranscriptDisplay = ({ text }: { text: string }) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  return (
    <div className="transcript-container">
      {lines.length > 0 ? lines.map((line, i) => {
        const isAgent = line.toLowerCase().includes('agent:') || line.toLowerCase().includes('representative:');
        const isCustomer = line.toLowerCase().includes('customer:') || line.toLowerCase().includes('caller:');
        const speaker = isAgent ? 'agent' : isCustomer ? 'customer' : null;
        const cleanLine = line.replace(/^(agent:|customer:|representative:|caller:)/i, '').trim();
        
        return (
          <div key={i} className="transcript-line">
            {speaker && (
              <span className={`transcript-speaker ${speaker}`}>
                {speaker === 'agent' ? 'Agent' : 'Customer'}
              </span>
            )}
            <span className="transcript-text">{speaker ? cleanLine : line}</span>
          </div>
        );
      }) : (
        <div style={{ color: 'var(--main-text-muted)', textAlign: 'center', padding: '40px' }}>
          No transcription available.
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
interface CallDetailViewProps {
  call: any;
  onBack: () => void;
  showBackButton?: boolean;
}

export default function CallDetailView({ call, onBack, showBackButton = true }: CallDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'coaching' | 'moments' | 'predictions' | 'transcript' | 'summary'>('metrics');

  const result = call.result || call.analysis_json;
  const fileName = call.fileName || call.file_name;
  const durationSec = result?.durationSec || call.duration_sec;
  const audioUrl = call.audioUrl || call.audio_url || call.file_path;

  if (!result) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--main-text-muted)' }}>Analysis data not available.</div>;

  const download = (filename: string, content: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'metrics', label: 'Metrics' },
    { id: 'coaching', label: 'Coaching' },
    { id: 'moments', label: 'Moments' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'summary', label: 'Summary' },
  ] as const;

  return (
    <div className="detail-view">
      {/* Back Button */}
      {showBackButton && (
        <button className="btn-ghost" onClick={onBack} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back
        </button>
      )}
      
      {/* Audio Player Section */}
      <div className="detail-section">
        <div className="detail-section-title">
          <Music size={18} style={{ color: 'var(--accent)' }} /> Original Recording
        </div>
        <AudioPlayer audioUrl={audioUrl} />
      </div>

      {/* Header Card */}
      <div className="detail-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{fileName}</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-outline"><FileAudio size={12} /> {result.language || 'Unknown'}</span>
              {durationSec && <span className="badge badge-outline"><Activity size={12} /> {formatTime(durationSec)}</span>}
              <span className={`badge ${result.insights?.sentiment === 'Positive' ? 'badge-success' : result.insights?.sentiment === 'Negative' ? 'badge-danger' : 'badge-warning'}`}>
                {result.insights?.sentiment || 'Neutral'} Sentiment
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <ScoreRing score={result.coaching?.overallScore || 0} size={80} />
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>Overall Score</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ fontSize: '13px', color: 'var(--main-text-muted)' }}>Conversion</span>
                <strong style={{ color: getScoreColor(result.predictions?.conversionProbability || 0) }}>{result.predictions?.conversionProbability || 0}%</strong>
              </div>
              <div className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ fontSize: '13px', color: 'var(--main-text-muted)' }}>Churn Risk</span>
                <strong style={{ color: getRiskColor(result.predictions?.churnRisk || 'low') }}>{(result.predictions?.churnRisk || 'low').toUpperCase()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container" style={{ marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="detail-section">
        {activeTab === 'metrics' && (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title"><Activity size={16} /> Talk Ratio</div>
              <TalkRatioBar
                agent={result.conversationMetrics?.agentTalkRatio || 0}
                customer={result.conversationMetrics?.customerTalkRatio || 0}
                silence={result.conversationMetrics?.silenceRatio || 0}
              />
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title"><Zap size={16} /> Quick Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--item-bg)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{result.conversationMetrics?.wordsPerMinuteAgent?.toFixed(0) || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--main-text-muted)', textTransform: 'uppercase' }}>Agent WPM</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--item-bg)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{result.conversationMetrics?.wordsPerMinuteCustomer?.toFixed(0) || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--main-text-muted)', textTransform: 'uppercase' }}>Customer WPM</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--item-bg)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{result.conversationMetrics?.agentInterruptions || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--main-text-muted)', textTransform: 'uppercase' }}>Interruptions</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--item-bg)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{result.conversationMetrics?.longestPauseSec || 0}s</div>
                  <div style={{ fontSize: '12px', color: 'var(--main-text-muted)', textTransform: 'uppercase' }}>Longest Pause</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coaching' && result.coaching && (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* Strengths */}
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title" style={{ color: 'var(--success)' }}><CheckCircle2 size={16} /> Strengths</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(result.coaching.strengths || []).map((s: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', fontSize: '14px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', marginTop: 6, flexShrink: 0 }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Improvements */}
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title" style={{ color: '#f59e0b' }}><TrendingUp size={16} /> Improvements</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(result.coaching.improvementSuggestions || []).map((s: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', fontSize: '14px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginTop: 6, flexShrink: 0 }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Skill Breakdown */}
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title">Skill Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(result.coaching.categoryScores || {}).map(([key, score]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{ fontWeight: 600 }}>{score as number}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${score as number}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(result.keyMoments || []).length > 0 ? result.keyMoments.map((m: any, i: number) => (
              <div key={i} className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  background: m.sentiment === 'positive' ? 'rgba(16,185,129,0.1)' : m.sentiment === 'negative' ? 'rgba(239,68,68,0.1)' : 'var(--item-bg)',
                  color: m.sentiment === 'positive' ? 'var(--success)' : m.sentiment === 'negative' ? 'var(--danger)' : 'var(--main-text-muted)'
                }}>
                  {m.type === 'pain_point' ? <AlertCircle size={18} /> : <Activity size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{m.type?.replace(/_/g, ' ')}</span>
                    <span className="badge badge-outline">{m.timestamp}</span>
                    {m.importance === 'high' && <span className="badge badge-danger">High</span>}
                  </div>
                  <p style={{ fontSize: '14px', margin: '0 0 6px', lineHeight: 1.5 }}>&quot;{m.text}&quot;</p>
                  <div style={{ fontSize: '12px', color: 'var(--main-text-muted)' }}>
                    <strong>{m.speaker}</strong> • {m.sentiment} sentiment
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--main-text-muted)' }}>No key moments detected.</div>
            )}
          </div>
        )}

        {activeTab === 'predictions' && result.predictions && (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <ScoreRing score={result.predictions.conversionProbability} size={100} strokeWidth={8} />
              <h3 style={{ marginTop: '16px', fontSize: '16px', fontWeight: 600 }}>Conversion Probability</h3>
              <p style={{ fontSize: '13px', color: 'var(--main-text-muted)', marginTop: '8px' }}>Likelihood of successful outcome</p>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title"><AlertOctagon size={16} style={{ color: '#f59e0b' }} /> Risk Assessment</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>Churn Risk</span>
                    <strong style={{ color: getRiskColor(result.predictions.churnRisk) }}>{result.predictions.churnRisk?.toUpperCase()}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: result.predictions.churnRisk === 'high' ? '90%' : '20%', height: '100%', background: getRiskColor(result.predictions.churnRisk) }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>Escalation Risk</span>
                    <strong style={{ color: getRiskColor(result.predictions.escalationRisk) }}>{result.predictions.escalationRisk?.toUpperCase()}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: result.predictions.escalationRisk === 'high' ? '80%' : '15%', height: '100%', background: getRiskColor(result.predictions.escalationRisk) }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title"><Zap size={16} /> Next Steps</div>
              <div style={{ padding: '16px', background: result.predictions.followUpNeeded ? 'rgba(0,223,129,0.1)' : 'var(--item-bg)', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--main-text-muted)', marginBottom: '4px' }}>Follow-up Required?</div>
                <div style={{ fontWeight: 700, color: result.predictions.followUpNeeded ? 'var(--accent)' : 'var(--success)' }}>
                  {result.predictions.followUpNeeded ? 'YES' : 'NO'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--main-text-muted)', marginBottom: '4px' }}>Urgency Level</div>
                <div style={{ fontWeight: 700, fontSize: '18px', textTransform: 'capitalize' }}>{result.predictions.urgencyLevel}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <TranscriptDisplay text={result.transcription || ''} />
        )}

        {activeTab === 'summary' && (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div className="detail-section-title"><FileText size={16} /> Executive Summary</div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--main-text)' }}>
                {result.summary || 'No summary available.'}
              </p>
            </div>
            {result.mom && (
              <>
                <div className="card" style={{ padding: '24px' }}>
                  <div className="detail-section-title" style={{ color: 'var(--success)' }}><CheckCircle2 size={16} /> Decisions Made</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(result.mom.decisions || []).map((d: string, i: number) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '14px' }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--success)', marginTop: 3, flexShrink: 0 }} />
                        {d}
                      </li>
                    ))}
                    {(result.mom.decisions || []).length === 0 && <li style={{ color: 'var(--main-text-muted)', fontStyle: 'italic' }}>No decisions recorded.</li>}
                  </ul>
                </div>
                <div className="card" style={{ padding: '24px' }}>
                  <div className="detail-section-title" style={{ color: 'var(--accent)' }}><Zap size={16} /> Action Items</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(result.mom.actionItems || []).map((a: string, i: number) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '14px' }}>
                        <Zap size={14} style={{ color: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
                        {a}
                      </li>
                    ))}
                    {(result.mom.actionItems || []).length === 0 && <li style={{ color: 'var(--main-text-muted)', fontStyle: 'italic' }}>No action items detected.</li>}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
        <div style={{ fontWeight: 600, marginBottom: '16px' }}>Export Options</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => download(`${fileName}-full.json`, JSON.stringify(result, null, 2), 'application/json')}>
            <Database size={16} /> Export JSON
          </button>
          <button className="btn-secondary" onClick={() => download(`${fileName}-transcript.txt`, result?.transcription || '', 'text/plain')}>
            <FileAudio size={16} /> Export Transcript
          </button>
        </div>
      </div>
    </div>
  );
}
