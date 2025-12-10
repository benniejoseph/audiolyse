'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { generateCallAnalysisPDF, generateBulkAnalysisPDF } from '@/app/utils/pdfGenerator';
import type { Organization } from '@/lib/types/database';
import { SUBSCRIPTION_LIMITS } from '@/lib/types/database';

// Simple toast notification function
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;max-width:420px;';
  document.body.appendChild(container);
  
  // Add styles if not already present
  if (!document.getElementById('toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;background:rgba(20,20,30,0.95);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:slideIn 0.3s ease-out}
      @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
      .toast-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;flex-shrink:0}
      .toast-success .toast-icon{background:rgba(124,255,199,0.2);color:#7cffc7}
      .toast-error .toast-icon{background:rgba(255,107,107,0.2);color:#ff6b6b}
      .toast-warning .toast-icon{background:rgba(255,209,102,0.2);color:#ffd166}
      .toast-info .toast-icon{background:rgba(0,217,255,0.2);color:#00d9ff}
      .toast-message{flex:1;color:#fff;font-size:14px;line-height:1.4}
      .toast-close{background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%}
      .toast-close:hover{color:#fff;background:rgba(255,255,255,0.1)}
      .toast-success{border-color:rgba(124,255,199,0.3)}
      .toast-error{border-color:rgba(255,107,107,0.3)}
      .toast-warning{border-color:rgba(255,209,102,0.3)}
      .toast-info{border-color:rgba(0,217,255,0.3)}
    `;
    document.head.appendChild(styles);
  }
  return container;
};

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
  const [isAdmin, setIsAdmin] = useState(false);
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

        // Get user profile to check admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (profile?.is_admin) {
          setIsAdmin(true);
        }

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
        console.log('Organization loaded:', organization.name, 'ID:', organization.id);
        setOrg(organization as Organization);
        
        // Admin users never hit limits
        let isLimitReached = false;
        if (!profile?.is_admin) {
          if (organization.subscription_tier === 'payg') {
            // For payg, check if credits are available
            isLimitReached = (organization.credits_balance || 0) < 1;
          } else {
            // For other tiers, check call limits
            isLimitReached = organization.calls_used >= organization.calls_limit;
          }
        }
        setLimitReached(isLimitReached);
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
    // Admins can always analyze
    if (isAdmin) return files.length > 0;
    // Need org to check limits
    if (!org) return false;
    
    // For payg tier, check credits balance
    if (org.subscription_tier === 'payg') {
      const creditsBalance = org.credits_balance || 0;
      return creditsBalance >= files.length;
    }
    
    // For other tiers, check call limits
    const remainingCalls = org.calls_limit - org.calls_used;
    return remainingCalls > 0 && files.length <= remainingCalls;
  }, [org, files.length, isAdmin]);

  // Save analysis result to database
  const saveAnalysis = async (result: BulkCallResult) => {
    if (!org || !userId || !result.result) {
      console.error('Cannot save analysis: missing org, userId, or result', { org: !!org, userId: !!userId, hasResult: !!result.result });
      return null;
    }
    
    try {
      console.log('Saving analysis to database:', {
        fileName: result.fileName,
        orgId: org.id,
        userId: userId,
        hasResult: !!result.result
      });
      
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
      
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      if (!data?.id) {
        console.error('No ID returned from insert');
        throw new Error('Failed to save analysis: No ID returned');
      }
      
      console.log('Analysis saved with ID:', data.id);
      
      // Increment usage - use database function for payg tier, direct update for others
      if (org.subscription_tier === 'payg') {
        // For payg, credits are handled by database function
        // Just update storage
        const { error: storageError } = await supabase
          .from('organizations')
          .update({
            storage_used_mb: (org.storage_used_mb || 0) + (result.fileSize / (1024 * 1024)),
          })
          .eq('id', org.id);
        
        if (storageError) {
          console.error('Error updating storage:', storageError);
        }
        
        // Refresh org to get updated credits balance
        const { data: updatedOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', org.id)
          .single();
        
        if (updatedOrg) {
          setOrg(updatedOrg as Organization);
        }
      } else {
        // For other tiers, update calls_used
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            calls_used: (org.calls_used || 0) + 1,
            storage_used_mb: (org.storage_used_mb || 0) + (result.fileSize / (1024 * 1024)),
          })
          .eq('id', org.id);
        
        if (updateError) {
          console.error('Error updating organization usage:', updateError);
        }
        
        // Update local org state
        setOrg(prev => prev ? {
          ...prev,
          calls_used: prev.calls_used + 1,
          storage_used_mb: Number(prev.storage_used_mb) + (result.fileSize / (1024 * 1024)),
        } : null);
      }
      
      // Log usage
      const { error: logError } = await supabase
        .from('usage_logs')
        .insert({
          organization_id: org.id,
          user_id: userId,
          action: 'call_analyzed',
          call_analysis_id: data.id,
          metadata: { file_name: result.fileName, file_size: result.fileSize },
        });
      
      if (logError) {
        console.error('Error logging usage:', logError);
        // Don't throw - the analysis is saved, logging can fail
      }
      
      return data.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      // Show error to user via toast
      showToast(`Failed to save analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Analysis completed but may not appear in history.`, 'error');
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
    
    let savedCount = 0;
    let failedCount = 0;
    
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
        
        console.log(`Saving analysis ${i + 1}/${files.length} to database...`);
        const dbId = await saveAnalysis(completedResult);
        
        if (dbId) {
          console.log(`✅ Analysis ${i + 1} saved successfully with ID: ${dbId}`);
          savedCount++;
        } else {
          console.warn(`⚠️ Analysis ${i + 1} completed but failed to save to database`);
        }
        
        setBulkResults(prev =>
          prev.map((r, idx) => idx === i ? { ...completedResult, dbId: dbId || undefined } : r)
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
        failedCount++;
        console.error(`❌ Analysis ${i + 1} failed:`, errorMessage);
        setBulkResults(prev =>
          prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: errorMessage } : r)
        );
      }
    }
    
    setIsLoading(false);
    
    // Show completion summary via toast
    const completedCount = files.length - failedCount;
    if (completedCount > 0) {
      if (failedCount > 0) {
        showToast(`Analysis complete! ${completedCount} succeeded, ${failedCount} failed. Click retry on failed items.`, 'warning');
      } else if (savedCount < completedCount) {
        showToast(`${completedCount} calls analyzed. ${savedCount} saved to database. Some may not appear in history.`, 'warning');
      } else {
        showToast(`Successfully analyzed ${completedCount} call${completedCount > 1 ? 's' : ''}!`, 'success');
      }
    } else if (failedCount > 0) {
      showToast(`All ${failedCount} analyses failed. Please retry.`, 'error');
    }
  };

  // Retry a single failed analysis
  const retryAnalysis = async (index: number) => {
    const failedResult = bulkResults[index];
    if (!failedResult || failedResult.status !== 'error') return;
    
    // Find the original file
    const file = files.find(f => f.name === failedResult.fileName);
    if (!file) {
      showToast('Original file not found. Please re-upload.', 'error');
      return;
    }
    
    // Update status to processing
    setBulkResults(prev =>
      prev.map((r, idx) => idx === index ? { ...r, status: 'processing', error: undefined } : r)
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
      
      // Create completed result
      const completedResult: BulkCallResult = {
        ...failedResult,
        status: 'completed',
        result,
        error: undefined,
      };
      
      // Save to database
      const dbId = await saveAnalysis(completedResult);
      
      // Update state
      setBulkResults(prev =>
        prev.map((r, idx) => idx === index ? { ...completedResult, dbId: dbId || undefined } : r)
      );
      
      showToast(`${file.name} analyzed successfully!`, 'success');
      
      // Update org usage if saved
      if (dbId && org) {
        setOrg(prev => prev ? { ...prev, calls_used: prev.calls_used + 1 } : prev);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setBulkResults(prev =>
        prev.map((r, idx) => idx === index ? { ...r, status: 'error', error: errorMessage } : r)
      );
      showToast(`Retry failed: ${errorMessage}`, 'error');
    }
  };

  // Retry all failed analyses
  const retryAllFailed = async () => {
    const failedIndices = bulkResults
      .map((r, i) => r.status === 'error' ? i : -1)
      .filter(i => i >= 0);
    
    if (failedIndices.length === 0) {
      showToast('No failed analyses to retry', 'info');
      return;
    }
    
    showToast(`Retrying ${failedIndices.length} failed analyses...`, 'info');
    
    for (const index of failedIndices) {
      await retryAnalysis(index);
    }
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

  const getRiskColor = (risk: string) => risk === 'high' ? '#ff6b6b' : risk === 'medium' ? '#ffd166' : '#7cffc7';
  const getSeverityColor = (severity: string) => severity === 'severe' ? '#ff6b6b' : severity === 'moderate' ? '#ffa94d' : severity === 'mild' ? '#ffd166' : '#7cffc7';
  
  const getMomentIcon = (type: string) => {
    const icons: Record<string, string> = { 
      complaint: '😤', compliment: '😊', objection: '🤔', competitor_mention: '🏢', 
      pricing_discussion: '💰', commitment: '✅', breakthrough: '💡', escalation_risk: '⚠️', 
      pain_point: '😣', positive_signal: '👍' 
    };
    return icons[type] || '📌';
  };

  const onCopy = (text: string) => navigator.clipboard.writeText(text);
  const download = (filename: string, content: string, mime = 'application/json') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const ScoreRing = ({ score, size = 80, label }: { score: number; size?: number; label?: string }) => {
    const circumference = 2 * Math.PI * 35;
    const offset = circumference - (score / 100) * circumference;
    return (
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle 
            cx="40" 
            cy="40" 
            r="35" 
            stroke={getScoreColor(score)} 
            strokeWidth="6" 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} 
          />
        </svg>
        <div className="score-value" style={{ color: getScoreColor(score) }}>{score}</div>
        {label && <div className="score-label">{label}</div>}
      </div>
    );
  };

  const TalkRatioBar = ({ agent, customer, silence }: { agent: number; customer: number; silence: number }) => {
    // Normalize: API should return decimals (0-1), but handle edge case where it might be percentages
    const normalize = (val: number) => val > 1 ? val / 100 : val;
    const agentPct = normalize(agent) * 100;
    const customerPct = normalize(customer) * 100;
    const silencePct = normalize(silence) * 100;
    
    return (
      <div className="talk-ratio-container">
        <div className="talk-ratio-bar">
          <div className="ratio-segment agent" style={{ width: `${agentPct}%` }} title={`Agent: ${agentPct.toFixed(1)}%`} />
          <div className="ratio-segment customer" style={{ width: `${customerPct}%` }} title={`Customer: ${customerPct.toFixed(1)}%`} />
          <div className="ratio-segment silence" style={{ width: `${silencePct}%` }} title={`Silence: ${silencePct.toFixed(1)}%`} />
        </div>
        <div className="ratio-legend">
          <span><span className="dot agent" /> Agent {agentPct.toFixed(1)}%</span>
          <span><span className="dot customer" /> Customer {customerPct.toFixed(1)}%</span>
          <span><span className="dot silence" /> Silence {silencePct.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  // Persistent Audio Player Component
  const AudioPlayer = ({ audioUrl, callId }: { audioUrl?: string; callId?: string }) => {
    const isThisCallPlaying = currentlyPlayingId === callId && isPlaying;
    const isThisCallLoaded = currentlyPlayingId === callId;
    
    if (!audioUrl) return null;

    const handleToggle = () => {
      if (callId && callId !== currentlyPlayingId && globalAudioRef.current && audioUrl) {
        globalAudioRef.current.src = audioUrl;
        globalAudioRef.current.load();
        setCurrentlyPlayingId(callId);
      }
      togglePlayPause();
    };

    return (
      <div className="audio-player">
        <button className="play-btn" onClick={handleToggle}>
          {isThisCallPlaying ? '⏸️' : '▶️'}
        </button>
        <div className="audio-progress">
          <span className="time-display">{formatTime(isThisCallLoaded ? currentTime : 0)}</span>
          <input 
            type="range" 
            min="0" 
            max={isThisCallLoaded ? audioDuration : (selectedCall?.result?.durationSec || 100)}
            value={isThisCallLoaded ? currentTime : 0}
            onChange={handleSeek}
            className="progress-slider"
          />
          <span className="time-display">{formatTime(isThisCallLoaded ? audioDuration : (selectedCall?.result?.durationSec || 0))}</span>
        </div>
        <div className="audio-label">
          {isThisCallPlaying ? '🎵 Playing...' : '🎧 Listen to the original recording while reviewing the analysis'}
        </div>
      </div>
    );
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
              {org.subscription_tier === 'payg' ? (
                <>{(org.credits_balance || 0)} credits available</>
              ) : (
                <>{org.calls_used}/{org.calls_limit} calls used {org.subscription_tier === 'free' ? 'today' : 'this month'}</>
              )}
            </span>
            {(org.subscription_tier === 'payg' ? (org.credits_balance || 0) < files.length : org.calls_used >= org.calls_limit) && (
              <a href="/pricing" className="upgrade-btn">
                {org.subscription_tier === 'payg' ? 'Buy Credits →' : 'Upgrade →'}
              </a>
            )}
          </div>
        )}

        {/* Limit Reached Alert */}
        {limitReached && (
          <div className="limit-alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>
              {org?.subscription_tier === 'payg' 
                ? 'Insufficient credits' 
                : org?.subscription_tier === 'free' 
                  ? 'Daily limit reached' 
                  : 'Monthly limit reached'}
            </strong>
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
            multiple
            onChange={handleFileSelect}
            disabled={limitReached}
          />
          <span className="upload-formats">
            Supports: MP3, WAV, M4A, MPEG, OGG, WebM
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
                {org?.subscription_tier === 'payg' 
                  ? `You need ${files.length - (org?.credits_balance || 0)} more credits to analyze ${files.length} call${files.length > 1 ? 's' : ''}`
                  : `You can only analyze ${(org?.calls_limit || 0) - (org?.calls_used || 0)} more calls ${org?.subscription_tier === 'free' ? 'today' : 'this month'}`}
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

        {/* Retry All Failed Button */}
        {bulkResults.some(r => r.status === 'error') && (
          <div className="retry-all-section">
            <button className="retry-all-btn" onClick={retryAllFailed}>
              🔄 Retry All Failed ({bulkResults.filter(r => r.status === 'error').length})
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="results-list">
          {bulkResults.map((call, index) => (
            <div 
              key={call.id} 
              className={`result-item ${call.status}`}
              onClick={() => call.status === 'completed' && (setSelectedCall(call), setViewMode('detail'))}
            >
              <div className="result-info">
                <span className="result-name">{call.fileName}</span>
                <span className="result-size">{(call.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                {call.status === 'error' && call.error && (
                  <span className="result-error" title={call.error}>❌ {call.error.substring(0, 50)}{call.error.length > 50 ? '...' : ''}</span>
                )}
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
                {call.status === 'error' && (
                  <button 
                    className="retry-btn"
                    onClick={(e) => { e.stopPropagation(); retryAnalysis(index); }}
                  >
                    🔄 Retry
                  </button>
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
    return (
      <div className="detail-view">
        <button className="back-link" onClick={() => setViewMode('dashboard')}>← Back to Dashboard</button>
        
        {/* Audio Player Card */}
        <div className="card audio-card">
          <h3>Original Recording</h3>
          <AudioPlayer audioUrl={selectedCall.audioUrl} callId={selectedCall.id} />
        </div>

        <div className="card detail-header-card">
          <div className="detail-header">
            <div>
              <h2>{selectedCall.fileName}</h2>
              <div className="detail-meta">
                <span>{selectedCall.result.language}</span>
                {selectedCall.result.durationSec && <span>{formatTime(selectedCall.result.durationSec)}</span>}
                <span style={{ color: selectedCall.result.insights?.sentiment === 'Positive' ? '#7cffc7' : selectedCall.result.insights?.sentiment === 'Negative' ? '#ff6b6b' : '#ffd166' }}>
                  {selectedCall.result.insights?.sentiment}
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
          <Link href="/help" className="tab help-tab">📖 Help</Link>
          {(['metrics', 'coaching', 'moments', 'predictions', 'transcript', 'summary'] as const).map(key => (
            <button key={key} className={`tab ${activeTab === key ? 'tab-active' : ''}`} onClick={() => setActiveTab(key)}>
              {key === 'metrics' ? 'Metrics' : key === 'coaching' ? 'Coaching' : key === 'moments' ? 'Key Moments' : key === 'predictions' ? 'Predictions' : key === 'transcript' ? 'Transcript' : 'Summary'}
            </button>
          ))}
        </div>

        <div className="card tab-content">
          {activeTab === 'metrics' && selectedCall.result.conversationMetrics && (
            <div className="metrics-view">
              <div className="section-header">
                <h3>Conversation Metrics</h3>
                <p className="section-desc">These metrics show how the conversation flowed between the agent and customer. <Link href="/help#metrics">Learn more →</Link></p>
              </div>
              
              <div className="metric-section">
                <h4>Talk Ratio Distribution</h4>
                <p className="metric-explain">This shows who spoke more during the call. Ideally, the agent should speak 40-50% of the time, giving the customer enough space to express their needs.</p>
                <TalkRatioBar agent={selectedCall.result.conversationMetrics.agentTalkRatio} customer={selectedCall.result.conversationMetrics.customerTalkRatio} silence={selectedCall.result.conversationMetrics.silenceRatio} />
                <p className="metric-insight">{selectedCall.result.conversationMetrics.agentTalkRatio > 0.6 ? '⚠️ Agent talking too much. Aim for 40-50% to let the customer express themselves.' : selectedCall.result.conversationMetrics.agentTalkRatio < 0.3 ? '⚠️ Agent should engage more actively in the conversation.' : '✅ Good talk balance! The agent is giving adequate space to the customer.'}</p>
              </div>
              
              <div className="metrics-grid-4">
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.totalQuestions}</div>
                  <div className="metric-label">Questions Asked</div>
                  <div className="metric-tip">Total questions the agent asked to understand the customer</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.openQuestions}</div>
                  <div className="metric-label">Open Questions</div>
                  <div className="metric-tip">Questions that encourage detailed responses (e.g., &ldquo;How do you feel?&rdquo;)</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.closedQuestions}</div>
                  <div className="metric-label">Closed Questions</div>
                  <div className="metric-tip">Yes/No questions (e.g., &ldquo;Is the pain constant?&rdquo;)</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.agentInterruptions + selectedCall.result.conversationMetrics.customerInterruptions}</div>
                  <div className="metric-label">Interruptions</div>
                  <div className="metric-tip">Times someone spoke over the other person</div>
                </div>
              </div>

              <div className="metrics-grid-4">
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.avgResponseTimeSec?.toFixed(1)}s</div>
                  <div className="metric-label">Avg Response Time</div>
                  <div className="metric-tip">How quickly the agent responds (1-3 seconds is ideal)</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.longestPauseSec?.toFixed(1)}s</div>
                  <div className="metric-label">Longest Pause</div>
                  <div className="metric-tip">Longest silence during the call (may indicate confusion)</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.wordsPerMinuteAgent}</div>
                  <div className="metric-label">Agent WPM</div>
                  <div className="metric-tip">Speaking speed (120-150 WPM is comfortable)</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{selectedCall.result.conversationMetrics.wordsPerMinuteCustomer}</div>
                  <div className="metric-label">Customer WPM</div>
                  <div className="metric-tip">Customer&apos;s speaking pace</div>
                </div>
              </div>

              {selectedCall.result.conversationSegments && selectedCall.result.conversationSegments.length > 0 && (
                <div className="segments-section">
                  <h4>Conversation Flow</h4>
                  <p className="metric-explain">Every good call follows a structure. This shows how each part of the conversation was handled.</p>
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
                  <p className="metric-explain">AI-detected personality and communication style of the customer. Use this to tailor future interactions.</p>
                  <div className="profile-grid">
                    <div className="profile-item"><span>Communication</span><strong>{selectedCall.result.customerProfile.communicationStyle}</strong></div>
                    <div className="profile-item"><span>Decision Style</span><strong>{selectedCall.result.customerProfile.decisionStyle}</strong></div>
                    <div className="profile-item"><span>Engagement</span><strong>{selectedCall.result.customerProfile.engagementLevel}</strong></div>
                    <div className="profile-item"><span>Price Sensitivity</span><strong style={{ color: getRiskColor(selectedCall.result.customerProfile.pricesSensitivity) }}>{selectedCall.result.customerProfile.pricesSensitivity}</strong></div>
                  </div>
                  {selectedCall.result.customerProfile.concerns?.length > 0 && (
                    <div className="profile-concerns"><strong>Key Concerns:</strong> {selectedCall.result.customerProfile.concerns.join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'coaching' && selectedCall.result.coaching && (
            <div className="coaching-view">
              <div className="section-header">
                <h3>Coaching Feedback</h3>
                <p className="section-desc">Detailed performance review with actionable improvement suggestions. <Link href="/help#coaching">Learn more →</Link></p>
              </div>

              <div className="coaching-header">
                <ScoreRing score={selectedCall.result.coaching.overallScore} size={100} />
                <div className="coaching-summary">
                  <h4>Overall Assessment</h4>
                  <p>{selectedCall.result.coaching.coachingSummary || 'No summary available'}</p>
                  <div className="score-interpretation">
                    {selectedCall.result.coaching.overallScore >= 80 ? '🌟 Excellent performance! Keep up the great work.' :
                     selectedCall.result.coaching.overallScore >= 60 ? '👍 Good call with room for improvement.' :
                     '⚠️ This call needs attention. Review the suggestions below.'}
                  </div>
                </div>
              </div>

              {/* Forced Sale Detection - Important Alert */}
              {selectedCall.result.coaching.forcedSale && (
                <div className={`forced-sale-card ${selectedCall.result.coaching.forcedSale.severity}`}>
                  <div className="forced-sale-header">
                    <span className="forced-sale-icon">{selectedCall.result.coaching.forcedSale.detected ? '⚠️' : '✅'}</span>
                    <div className="forced-sale-title">
                      <h4>Forced Sale Analysis</h4>
                      <span className={`severity-badge ${selectedCall.result.coaching.forcedSale.severity}`}>
                        {selectedCall.result.coaching.forcedSale.severity === 'none' ? 'No Issues' : 
                         selectedCall.result.coaching.forcedSale.severity === 'mild' ? 'Mild Pressure' :
                         selectedCall.result.coaching.forcedSale.severity === 'moderate' ? 'Moderate Pressure' : 'Severe Pressure'}
                      </span>
                    </div>
                  </div>
                  <p className="forced-sale-feedback">{selectedCall.result.coaching.forcedSale.feedback}</p>
                  {selectedCall.result.coaching.forcedSale.indicators && selectedCall.result.coaching.forcedSale.indicators.length > 0 && (
                    <div className="forced-sale-indicators">
                      <strong>Detected Indicators:</strong>
                      <ul>
                        {selectedCall.result.coaching.forcedSale.indicators.map((ind, i) => (
                          <li key={i}>{ind}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!selectedCall.result.coaching.forcedSale.detected && (
                    <p className="forced-sale-ok">✅ No forced sale tactics detected. The customer was given adequate decision-making space.</p>
                  )}
                </div>
              )}

              {selectedCall.result.coaching.categoryScores && (
                <div className="category-scores">
                  <h4>Category Breakdown</h4>
                  <p className="metric-explain">Each category is scored from 0-100. Green (80+) is excellent, yellow (60-79) is good, red (below 60) needs improvement.</p>
                  <div className="scores-grid">
                    {Object.entries(selectedCall.result.coaching.categoryScores).map(([key, score]) => (
                      <div key={key} className="score-item">
                        <div className="score-bar-container">
                          <div className="score-bar" style={{ width: `${score}%`, background: getScoreColor(score) }} />
                        </div>
                        <span className="score-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="score-num" style={{ color: getScoreColor(score) }}>{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="coaching-details">
                <div className="detail-section strengths">
                  <h5>✅ What Went Well</h5>
                  <p className="section-note">These are things the agent did excellently. Reinforce these behaviors.</p>
                  <ul>{(selectedCall.result.coaching.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="detail-section weaknesses">
                  <h5>⚠️ Areas for Improvement</h5>
                  <p className="section-note">Focus training on these areas to improve performance.</p>
                  <ul>{(selectedCall.result.coaching.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              </div>

              {selectedCall.result.coaching.missedOpportunities?.length > 0 && (
                <div className="detail-section missed">
                  <h5>💡 Missed Opportunities</h5>
                  <p className="section-note">Chances to help the customer better or close a sale that were not utilized.</p>
                  <ul>{selectedCall.result.coaching.missedOpportunities.map((m, i) => <li key={i}>{m}</li>)}</ul>
                </div>
              )}

              <div className="detail-section suggestions">
                <h5>📈 Specific Improvement Tips</h5>
                <p className="section-note">Actionable advice the agent can implement immediately.</p>
                <ul>{(selectedCall.result.coaching.improvementSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>

              {selectedCall.result.coaching.scriptRecommendations?.length > 0 && (
                <div className="detail-section scripts">
                  <h5>Recommended Scripts</h5>
                  <p className="section-note">Use these phrases in similar situations for better outcomes.</p>
                  <div className="script-cards">
                    {selectedCall.result.coaching.scriptRecommendations.map((s, i) => (
                      <div key={i} className="script-card">
                        <span>&ldquo;{s}&rdquo;</span>
                        <button className="copy-small" onClick={() => onCopy(s)}>Copy</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCall.result.coaching.redFlags?.filter(rf => rf && rf.trim() && !rf.toLowerCase().includes('none') && !rf.toLowerCase().includes('n/a')).length > 0 && (
                <div className="detail-section red-flags">
                  <h5>Red Flags - Immediate Attention Needed</h5>
                  <p className="section-note">Serious issues that require immediate review and correction.</p>
                  <ul>
                    {selectedCall.result.coaching.redFlags.filter(rf => rf && rf.trim() && !rf.toLowerCase().includes('none') && !rf.toLowerCase().includes('n/a')).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'moments' && (
            <div className="moments-view">
              <div className="section-header">
                <h3>Key Moments Timeline</h3>
                <p className="section-desc">Important moments during the call that reveal customer sentiment and opportunities. <Link href="/help#moments">Learn more →</Link></p>
              </div>
              
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
                  <p className="metric-explain">Tasks that need to be completed based on this call.</p>
                  <div className="action-grid">
                    {selectedCall.result.actionItems.forAgent?.length > 0 && (
                      <div className="action-card agent">
                        <h5>For Agent</h5>
                        <ul>{selectedCall.result.actionItems.forAgent.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                    )}
                    {selectedCall.result.actionItems.forManager?.length > 0 && (
                      <div className="action-card manager">
                        <h5>For Manager</h5>
                        <ul>{selectedCall.result.actionItems.forManager.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                    )}
                    {selectedCall.result.actionItems.forFollowUp?.length > 0 && (
                      <div className="action-card followup">
                        <h5>Follow-Up Required</h5>
                        <ul>{selectedCall.result.actionItems.forFollowUp.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'predictions' && selectedCall.result.predictions && (
            <div className="predictions-view">
              <div className="section-header">
                <h3>Predictive Analytics</h3>
                <p className="section-desc">AI predictions about the likely outcome of this interaction. <Link href="/help#predictions">Learn more →</Link></p>
              </div>
              
              <div className="predictions-grid">
                <div className="prediction-card">
                  <ScoreRing score={selectedCall.result.predictions.conversionProbability} size={90} />
                  <h4>Conversion Probability</h4>
                  <p>{selectedCall.result.predictions.conversionProbability >= 70 ? 'High likelihood of conversion' : selectedCall.result.predictions.conversionProbability >= 40 ? 'Moderate conversion potential' : 'Low conversion probability - needs follow-up'}</p>
                </div>
                <div className="prediction-card">
                  <div className={`risk-indicator ${selectedCall.result.predictions.churnRisk}`}></div>
                  <h4>Churn Risk</h4>
                  <p className={`risk-${selectedCall.result.predictions.churnRisk}`}>{selectedCall.result.predictions.churnRisk.toUpperCase()}</p>
                  <p className="pred-explain">{selectedCall.result.predictions.churnRisk === 'high' ? 'Customer may not return. Immediate action needed.' : selectedCall.result.predictions.churnRisk === 'medium' ? 'Some concerns exist. Follow up recommended.' : 'Customer seems satisfied and likely to return.'}</p>
                </div>
                <div className="prediction-card">
                  <div className={`risk-indicator ${selectedCall.result.predictions.escalationRisk}`}></div>
                  <h4>Escalation Risk</h4>
                  <p className={`risk-${selectedCall.result.predictions.escalationRisk}`}>{selectedCall.result.predictions.escalationRisk.toUpperCase()}</p>
                  <p className="pred-explain">{selectedCall.result.predictions.escalationRisk === 'high' ? 'May become a formal complaint. Address immediately.' : 'Low risk of escalation.'}</p>
                </div>
                <div className="prediction-card">
                  <div className={`risk-indicator ${selectedCall.result.predictions.satisfactionLikely}`}></div>
                  <h4>Satisfaction</h4>
                  <p className={`risk-${selectedCall.result.predictions.satisfactionLikely === 'high' ? 'low' : selectedCall.result.predictions.satisfactionLikely === 'low' ? 'high' : 'medium'}`}>{selectedCall.result.predictions.satisfactionLikely.toUpperCase()}</p>
                </div>
              </div>
              <div className="prediction-details">
                <div className="pred-item"><span>Follow-up Needed:</span><strong>{selectedCall.result.predictions.followUpNeeded ? '✅ Yes - Contact customer again' : '❌ No'}</strong></div>
                <div className="pred-item"><span>Urgency Level:</span><strong style={{ color: getRiskColor(selectedCall.result.predictions.urgencyLevel) }}>{selectedCall.result.predictions.urgencyLevel.toUpperCase()}</strong></div>
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <section className="result">
              <div className="section-header">
                <h3>Full Transcription</h3>
                <button className="copy" onClick={() => onCopy(selectedCall.result?.transcription || '')}>Copy</button>
              </div>
              <p className="section-desc">Complete word-for-word record of the conversation. Speaker labels indicate who said what.</p>
              <div className="transcript-content">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{selectedCall.result.transcription || 'No transcription'}</p>
              </div>
            </section>
          )}

          {activeTab === 'summary' && (
            <div>
              <section className="result">
                <div className="section-header">
                  <h3>Call Summary</h3>
                  <button className="copy" onClick={() => onCopy(selectedCall.result?.summary || '')}>Copy</button>
                </div>
                <p className="section-desc">Key points from the conversation in bullet format.</p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCall.result.summary || 'No summary'}</p>
              </section>
              <section className="result" style={{ marginTop: 16 }}>
                <h4>Minutes of Meeting (MOM)</h4>
                <p className="section-desc">Structured breakdown of participants, decisions, and action items.</p>
                <div className="grid-two">
                  <div><strong>Participants</strong><ul>{(selectedCall.result.mom?.participants ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul></div>
                  <div><strong>Decisions Made</strong><ul>{(selectedCall.result.mom?.decisions ?? []).length > 0 ? selectedCall.result.mom?.decisions.map((d, i) => <li key={i}>{d}</li>) : <li className="muted">No decisions recorded</li>}</ul></div>
                  <div><strong>Action Items</strong><ul>{(selectedCall.result.mom?.actionItems ?? []).length > 0 ? selectedCall.result.mom?.actionItems.map((a, i) => <li key={i}>{a}</li>) : <li className="muted">No action items</li>}</ul></div>
                  <div><strong>Next Steps</strong><ul>{(selectedCall.result.mom?.nextSteps ?? []).length > 0 ? selectedCall.result.mom?.nextSteps.map((n, i) => <li key={i}>{n}</li>) : <li className="muted">No next steps defined</li>}</ul></div>
                </div>
              </section>
              <section className="result" style={{ marginTop: 16 }}>
                <h4>Topics & Keywords</h4>
                <p className="section-desc">Main subjects discussed and important terms mentioned.</p>
                <div><strong>Topics:</strong></div>
                <div className="keyword-tags">{(selectedCall.result.insights?.topics ?? []).map((t, i) => <span key={i} className="keyword-tag topic">{t}</span>)}</div>
                <div style={{ marginTop: 12 }}><strong>Keywords:</strong></div>
                <div className="keyword-tags">{(selectedCall.result.insights?.keywords ?? []).map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}</div>
              </section>
            </div>
          )}
        </div>

        <div className="card">
          <div className="sectionTitle"><strong>Export Options</strong></div>
          <div className="export-buttons">
            <button className="export-btn" onClick={handleDownloadPDF}>Download PDF Report</button>
            <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-full.json`, JSON.stringify(selectedCall.result, null, 2))}>Export JSON Analysis</button>
            <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-transcript.txt`, selectedCall.result?.transcription || '', 'text/plain')}>Export Transcript</button>
            <button className="export-btn" onClick={() => download(`${selectedCall.fileName}-coaching.json`, JSON.stringify(selectedCall.result?.coaching, null, 2))}>Export Coaching</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


