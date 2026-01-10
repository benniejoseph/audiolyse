"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, FileAudio, Activity, TrendingUp, AlertOctagon, Loader2, Link, 
  MapPin, Phone, MessageSquare, Zap, Clock, Calendar, CheckCircle, XCircle, 
  AlertCircle, CheckCircle2, ChevronRight, Volume2, User, Mic, 
  Download, Share2, UploadCloud, FileText, Database, Music
} from 'lucide-react';
import { CallAnalysis } from '@/lib/types/database';

// --- Shared Helper Components ---

const getScoreColor = (score: number) => {
  if (score >= 90) return 'var(--success)';
  if (score >= 75) return 'var(--accent)'; // Good/Accent
  if (score >= 60) return '#fbbf24'; // Warning/Yellow
  return 'var(--danger)';
};

const getRiskColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case 'high': return 'var(--danger)';
    case 'medium': return 'var(--warning)';
    case 'low': return 'var(--success)';
    default: return 'var(--text-muted)';
  }
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ScoreRing = ({ score, size = 80, strokeWidth = 6, color, label }: { score: number; size?: number; strokeWidth?: number; color?: string; label?: string }) => {
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = color || getScoreColor(score);
  
  return (
    <div className="score-ring" style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
        <circle cx="40" cy="40" r="35" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} fill="none" />
        <circle 
          cx="40" 
          cy="40" 
          r="35" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} 
        />
      </svg>
      <div className="score-value" style={{ 
        color: strokeColor, 
        fontSize: size < 60 ? '0.9rem' : undefined,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontWeight: 'bold'
      }}>{score}</div>
      {label && <div className="score-label" style={{ textAlign: 'center', marginTop: '4px', fontSize: '12px' }}>{label}</div>}
    </div>
  );
};

const TalkRatioBar = ({ agent, customer, silence, style }: { agent: number; customer: number; silence: number; style?: React.CSSProperties }) => {
  const normalize = (val: number) => val > 1 ? val / 100 : val;
  const agentPct = normalize(agent) * 100;
  const customerPct = normalize(customer) * 100;
  const silencePct = normalize(silence) * 100;
  
  return (
    <div className="talk-ratio-container" style={style}>
      <div className="talk-ratio-bar" style={{ display: 'flex', height: '100%', borderRadius: '999px', overflow: 'hidden' }}>
        <div className="ratio-segment agent" style={{ width: `${agentPct}%`, background: 'var(--accent)' }} title={`Agent: ${agentPct.toFixed(1)}%`} />
        <div className="ratio-segment customer" style={{ width: `${customerPct}%`, background: '#8b5cf6' }} title={`Customer: ${customerPct.toFixed(1)}%`} />
        <div className="ratio-segment silence" style={{ width: `${silencePct}%`, background: 'var(--bg-tertiary)' }} title={`Silence: ${silencePct.toFixed(1)}%`} />
      </div>
      {!style && (
        <div className="ratio-legend" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Agent {agentPct.toFixed(1)}%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} /> Customer {customerPct.toFixed(1)}%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-tertiary)' }} /> Silence {silencePct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

const AudioPlayer = ({ audioUrl, callId }: { audioUrl?: string; callId?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl || '';
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

  if (!audioUrl) return <div className="text-muted-foreground italic text-sm">Audio not available</div>;

  return (
    <div className="audio-player flex items-center gap-4 w-full">
      <audio ref={audioRef} style={{ display: 'none' }} />
      <button 
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors"
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          value={currentTime} 
          onChange={handleSeek}
          className="w-full accent-accent h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
           <span>{formatTime(currentTime)}</span>
           <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Detail Components ---

interface CallDetailViewProps {
  call: any; // Using any for now to be compatible with different result structures, can refine to CallAnalysis | BulkCallResult
  onBack: () => void;
  showBackButton?: boolean;
}

export default function CallDetailView({ call, onBack, showBackButton = true }: CallDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'coaching' | 'moments' | 'predictions' | 'transcript' | 'summary'>('metrics');

  const result = call.result || call.analysis_json;
  const fileName = call.fileName || call.file_name;
  const durationSec = result?.durationSec || call.duration_sec;
  const audioUrl = call.audioUrl || call.audio_url || call.file_path; // Handle various property names

  if (!result) return <div className="p-8 text-center">Analysis data not available.</div>;

  const handleDownloadPDF = () => {
      // Logic for PDF download (placeholder or passed prop)
      console.log('Download PDF requested');
  };
  
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
  
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Optional: Show toast
  };

  return (
    <div className="detail-view fade-in">
      {showBackButton && (
        <button 
          className="btn-ghost" 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingLeft: 0, color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
      
      {/* Audio Player Card - Styled */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Music size={20} className="text-accent" /> Original Recording
        </h3>
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
          <AudioPlayer audioUrl={audioUrl} callId={call.id} />
        </div>
      </div>

      {/* Header Metadata Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border-light)', background: 'linear-gradient(to right, var(--card), var(--bg-secondary))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)' }}>{fileName}</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="badge badge-outline"><FileAudio size={12} style={{marginRight:4}}/> {result.language}</span>
              {durationSec && <span className="badge badge-outline"><Activity size={12} style={{marginRight:4}}/> {formatTime(durationSec)}</span>}
              <span className={`badge ${result.insights?.sentiment === 'Positive' ? 'badge-success' : result.insights?.sentiment === 'Negative' ? 'badge-danger' : 'badge-warning'}`}>
                {result.insights?.sentiment} Sentiment
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
               <ScoreRing score={result.coaching?.overallScore || 0} size={80} />
               <div style={{ marginTop: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Overall Score</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conversion</span>
                <strong style={{ color: getScoreColor(result.predictions?.conversionProbability || 0) }}>{result.predictions?.conversionProbability || 0}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Churn Risk</span>
                <strong style={{ color: getRiskColor(result.predictions?.churnRisk || 'low') }}>{(result.predictions?.churnRisk || 'low').toUpperCase()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6" style={{ margin: '0 -2rem 2rem -2rem', padding: '0 2rem' }}>
         <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
            {(['metrics', 'coaching', 'moments', 'predictions', 'transcript', 'summary'] as const).map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                     relative py-3 text-sm font-medium transition-colors hover:text-foreground
                     ${activeTab === tab
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted-foreground'}
                  `}
               >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
               </button>
            ))}
         </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content min-h-[500px]">
         {activeTab === 'metrics' && (
            <div className="space-y-6">
               {/* Conversation Flow */}
               <div className="grid gap-6 md:grid-cols-2">
                  <div className="card p-6">
                     <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-accent" /> Talk Ratio
                     </h3>
                     <div className="h-64 flex items-center justify-center">
                        <TalkRatioBar
                           agent={result.conversationMetrics?.agentTalkRatio || 0}
                           customer={result.conversationMetrics?.customerTalkRatio || 0}
                           silence={result.conversationMetrics?.silenceRatio || 0}
                           style={{ width: '100%', height: '40px' }}
                        />
                     </div>
                  </div>

                  <div className="card p-6">
                     <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-accent" /> Quick Stats
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary rounded-lg">
                           <div className="text-2xl font-bold">{result.conversationMetrics?.wordsPerMinuteAgent?.toFixed(0) || 0}</div>
                           <div className="text-xs text-muted-foreground uppercase tracking-wider">Agent WPM</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                           <div className="text-2xl font-bold">{result.conversationMetrics?.wordsPerMinuteCustomer?.toFixed(0) || 0}</div>
                           <div className="text-xs text-muted-foreground uppercase tracking-wider">Customer WPM</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                           <div className="text-2xl font-bold">{result.conversationMetrics?.agentInterruptions || 0}</div>
                           <div className="text-xs text-muted-foreground uppercase tracking-wider">Interruptions</div>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                           <div className="text-2xl font-bold">{result.conversationMetrics?.longestPauseSec || 0}s</div>
                           <div className="text-xs text-muted-foreground uppercase tracking-wider">Longest Pause</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'coaching' && result.coaching && (
            <div className="space-y-6">
               {/* Overall Score */}
               <div className="card p-6 flex items-center justify-between bg-gradient-to-r from-secondary to-background border-l-4 border-accent">
                  <div>
                     <h3 className="text-lg font-semibold mb-1">Overall Assessment</h3>
                     <p className="text-muted-foreground max-w-xl">{result.coaching.coachingSummary}</p>
                  </div>
                  <div className="relative w-24 h-24 flex-shrink-0">
                     <ScoreRing score={result.coaching.overallScore} size={96} strokeWidth={8} />
                     <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                        {result.coaching.overallScore}
                     </div>
                  </div>
               </div>

               {/* Detailed Scores Grid */}
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Strengths */}
                  <div className="card p-6">
                     <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="h-4 w-4" /> Strengths
                     </h4>
                     <ul className="space-y-3">
                        {result.coaching.strengths.map((s: string, i: number) => (
                           <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                              {s}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="card p-6">
                     <h4 className="font-semibold mb-4 flex items-center gap-2 text-orange-500">
                        <TrendingUp className="h-4 w-4" /> Improvements
                     </h4>
                     <ul className="space-y-3">
                        {result.coaching.improvementSuggestions.map((s: string, i: number) => (
                           <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                              {s}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Category Scores */}
                  <div className="card p-6">
                     <h4 className="font-semibold mb-4">Skill Breakdown</h4>
                     <div className="space-y-4">
                        {Object.entries(result.coaching.categoryScores || {}).map(([key, score]) => (
                           <div key={key}>
                              <div className="flex justify-between text-sm mb-1">
                                 <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                 <span className="font-mono">{(score as number)}</span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                 <div
                                    className="h-full bg-accent transition-all duration-500"
                                    style={{ width: `${(score as number)}%` }}
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'moments' && result.keyMoments && (
            <div className="space-y-4">
               {result.keyMoments.map((m: any, i: number) => (
                  <div key={i} className="card p-4 flex gap-4 items-start transition-colors hover:bg-secondary/50">
                     <div className={`mt-1 p-2 rounded-full ${m.sentiment === 'positive' ? 'bg-green-500/10 text-green-500' : m.sentiment === 'negative' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'}`}>
                        {m.type === 'pain_point' ? <AlertCircle size={16} /> : <Activity size={16} />}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-semibold capitalize">{m.type.replace(/_/g, ' ')}</span>
                           <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">{m.timestamp}</span>
                           {m.importance === 'high' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">High Importance</span>}
                        </div>
                        <p className="text-sm text-foreground mb-2">&quot;{m.text}&quot;</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                           <span className="uppercase tracking-wide font-semibold">{m.speaker}</span>
                           <span>•</span>
                           <span className="capitalize">{m.sentiment} sentiment</span>
                        </p>
                     </div>
                  </div>
               ))}
               {result.keyMoments.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">No key moments detected.</div>
               )}
            </div>
         )}

         {activeTab === 'predictions' && result.predictions && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Conversion Card */}
               <div className="card p-6 flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 mb-4">
                     <ScoreRing score={result.predictions.conversionProbability} size={128} strokeWidth={8} color="var(--accent)" />
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold">{result.predictions.conversionProbability}%</span>
                     </div>
                  </div>
                  <h3 className="text-lg font-semibold">Conversion Probability</h3>
                  <p className="text-sm text-muted-foreground mt-2">Likelihood of successful outcome based on engagement signals.</p>
               </div>

               {/* Risk Indicators */}
               <div className="card p-6 space-y-6">
                  <h3 className="font-semibold flex items-center gap-2">
                     <AlertOctagon className="h-4 w-4 text-orange-500" /> Risk Assessment
                  </h3>

                  <div className="space-y-4">
                      <div>
                         <div className="flex justify-between text-sm mb-1">
                            <span>Churn Risk</span>
                            <span className={`font-bold ${result.predictions.churnRisk === 'high' ? 'text-red-500' : 'text-green-500'}`}>
                               {result.predictions.churnRisk.toUpperCase()}
                            </span>
                         </div>
                         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full ${result.predictions.churnRisk === 'high' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: result.predictions.churnRisk === 'high' ? '90%' : '20%' }} />
                         </div>
                      </div>

                      <div>
                         <div className="flex justify-between text-sm mb-1">
                            <span>Escalation Risk</span>
                            <span className={`font-bold ${result.predictions.escalationRisk === 'high' ? 'text-red-500' : 'text-green-500'}`}>
                               {result.predictions.escalationRisk.toUpperCase()}
                            </span>
                         </div>
                         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full ${result.predictions.escalationRisk === 'high' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: result.predictions.escalationRisk === 'high' ? '80%' : '15%' }} />
                         </div>
                      </div>
                  </div>
               </div>

               {/* Next Steps */}
               <div className="card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                     <Zap className="h-4 w-4 text-accent" /> Recommended Actions
                  </h3>
                  <div className={`p-4 rounded-lg mb-4 ${result.predictions.followUpNeeded ? 'bg-accent/10 border border-accent/20' : 'bg-secondary'}`}>
                     <div className="font-medium mb-1">Follow-up Required?</div>
                     <div className="flex items-center gap-2">
                        {result.predictions.followUpNeeded
                           ? <><AlertCircle className="h-4 w-4 text-accent" /> <span className="text-accent font-bold">YES</span></>
                           : <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-green-500">NO</span></>
                        }
                     </div>
                  </div>
                  <div>
                     <div className="text-sm font-medium text-muted-foreground mb-1">Urgency Level</div>
                     <div className="capitalize font-bold text-lg">{result.predictions.urgencyLevel}</div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'transcript' && (
            <div className="card p-0 overflow-hidden">
               <div className="p-4 border-b bg-secondary/50 flex justify-between items-center">
                  <h3 className="font-semibold">Full Transcription</h3>
                  <button
                     onClick={() => copyToClipboard(result?.transcription || '')}
                     className="text-xs flex items-center gap-1 hover:text-accent transition-colors"
                  >
                     <FileText size={14} /> Copy Text
                  </button>
               </div>
               <div className="p-6 max-h-[600px] overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {result.transcription || 'No transcription available.'}
               </div>
            </div>
         )}

         {activeTab === 'summary' && (
            <div className="space-y-6">
               {/* Executive Summary */}
               <div className="card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                     <FileText className="h-4 w-4 text-accent" /> Executive Summary
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                     {result.summary || 'No summary available.'}
                  </p>
               </div>

               {/* MOM */}
               {result.mom && (
                  <div className="grid gap-6 md:grid-cols-2">
                     <div className="card p-6">
                        <h4 className="font-semibold mb-4 text-green-500">Decisions Made</h4>
                        <ul className="space-y-2">
                           {(result.mom.decisions || []).length > 0 ? (
                              result.mom.decisions.map((d: string, i: number) => (
                                 <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {d}
                                 </li>
                              ))
                           ) : (
                              <li className="text-muted-foreground text-sm italic">No specific decisions recorded.</li>
                           )}
                        </ul>
                     </div>

                     <div className="card p-6">
                        <h4 className="font-semibold mb-4 text-accent">Action Items</h4>
                        <ul className="space-y-2">
                           {(result.mom.actionItems || []).length > 0 ? (
                              result.mom.actionItems.map((a: string, i: number) => (
                                 <li key={i} className="flex items-start gap-2 text-sm">
                                    <Zap className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                                    {a}
                                 </li>
                              ))
                           ) : (
                              <li className="text-muted-foreground text-sm italic">No action items detected.</li>
                           )}
                        </ul>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>

      {/* Export Options */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem', border: '1px solid var(--border-light)' }}>
        <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Export Options</div>
        <div className="export-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleDownloadPDF}><FileText size={16} /> Download PDF Report</button>
          <button className="btn-secondary" onClick={() => download(`${fileName}-full.json`, JSON.stringify(result, null, 2))}><Database size={16} /> Export JSON</button>
          <button className="btn-secondary" onClick={() => download(`${fileName}-transcript.txt`, result?.transcription || '', 'text/plain')}><FileAudio size={16} /> Export Transcript</button>
        </div>
      </div>
    </div>
  );
}
