'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { generateCallAnalysisPDF, generateBulkAnalysisPDF } from '@/app/utils/pdfGenerator';
import type { Organization } from '@/lib/types/database';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';
import { uploadAudioFile, isAudioStorageEnabled, updateStorageUsage, checkStorageQuota } from '@/lib/storage/audio';

// Simple toast notification function
import { useToast, ToastProvider } from '@/components/Toast';
import { UploadCloud, FileAudio, X, AlertCircle, File, Music, Video, Activity, TrendingUp, AlertOctagon, CheckCircle2, Loader2, ArrowLeft, Download, Phone, Zap, FileText, Database } from 'lucide-react';
import CallDetailView from '@/components/analysis/CallDetailView';



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
  <div className="card" style={{ padding: '24px' }}>
    <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>Score Interpretation</h4>
    <div style={{ display: 'grid', gap: '8px' }}>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
        <span style={{ color: 'var(--text-secondary)' }}>90-100: Exceptional</span>
      </div>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)', opacity: 0.7 }}></span>
        <span style={{ color: 'var(--text-secondary)' }}>80-89: Very Good</span>
      </div>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span>
        <span style={{ color: 'var(--text-secondary)' }}>70-79: Good</span>
      </div>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)', opacity: 0.7 }}></span>
        <span style={{ color: 'var(--text-secondary)' }}>60-69: Average</span>
      </div>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></span>
        <span style={{ color: 'var(--text-secondary)' }}>0-59: Needs Work</span>
      </div>
    </div>
    <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
      AI scoring is strict. 70-80 is good performance.
    </p>
  </div>
);

function AnalyzePageContent() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkCallResult[]>([]);
  const [selectedCall, setSelectedCall] = useState<BulkCallResult | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'coaching' | 'moments' | 'transcript' | 'summary' | 'predictions'>('metrics');
  const [viewMode, setViewMode] = useState<'upload' | 'dashboard' | 'detail'>('upload');
  
  // Auth & organization state
  const [org, setOrg] = useState<Organization | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const logAccess = async (call: BulkCallResult) => {
    if (!org || !call.dbId) return;
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: 'call_analysis',
          resource_id: call.dbId,
          action: 'viewed_after_upload',
          organization_id: org.id,
          metadata: { file_name: call.fileName }
        })
      });
    } catch (e) {
      console.error('Failed to log access', e);
    }
  };

  useEffect(() => {
    if (viewMode === 'detail' && selectedCall) {
      logAccess(selectedCall);
    }
  }, [viewMode, selectedCall]);
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

  // Save analysis result to database (and optionally upload audio)
  const saveAnalysis = async (result: BulkCallResult, originalFile?: File) => {
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
      
      let audioFilePath: string | undefined;
      let audioFileUrl: string | undefined;
      
      // Upload audio to storage if enabled for this tier and file is provided
      const tier = org.subscription_tier as SubscriptionTier;
      if (originalFile && isAudioStorageEnabled(tier)) {
        try {
          // Check storage quota
          const fileSizeMb = originalFile.size / (1024 * 1024);
          const quotaCheck = await checkStorageQuota(org.id, tier, fileSizeMb);
          
          if (quotaCheck.allowed) {
            console.log('Uploading audio to storage...');
            const uploadResult = await uploadAudioFile({
              file: originalFile,
              organizationId: org.id,
              userId: userId,
            });
            
            if (uploadResult.success) {
              audioFilePath = uploadResult.path;
              audioFileUrl = uploadResult.url;
              console.log('Audio uploaded successfully:', audioFilePath);
              
              // Update storage usage
              await updateStorageUsage(org.id, fileSizeMb);
            } else {
              console.warn('Audio upload failed:', uploadResult.error);
              // Continue with save even if upload fails
            }
          } else {
            console.warn(`Storage quota exceeded: ${quotaCheck.currentUsed.toFixed(1)}MB / ${quotaCheck.limit}MB`);
            showToast(`Audio not saved: Storage limit reached (${quotaCheck.currentUsed.toFixed(1)}/${quotaCheck.limit} MB used)`, 'warning');
          }
        } catch (uploadError) {
          console.error('Error uploading audio:', uploadError);
          // Continue with save even if upload fails
        }
      }
      
      // Use API endpoint that bypasses RLS with service role key
      const response = await fetch('/api/analysis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: org.id,
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
          file_path: audioFilePath,
          audio_url: audioFileUrl,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API error saving analysis:', responseData);
        throw new Error(responseData.error || `HTTP ${response.status}: ${responseData.details || 'Unknown error'}`);
      }
      
      if (!responseData.id) {
        console.error('No ID returned from API');
        throw new Error('Failed to save analysis: No ID returned');
      }
      
      console.log('Analysis saved with ID:', responseData.id);
      
      // Refresh org to get updated usage/credits
      try {
        const orgResponse = await fetch('/api/organization/me');
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          if (orgData.success && orgData.organization) {
            setOrg(orgData.organization as Organization);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing org data:', refreshError);
      }
      
      return responseData.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
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
        
        // Save to database (and upload audio for paid tiers)
        const completedResult: BulkCallResult = {
          ...initialResults[i],
          status: 'completed',
          result,
        };
        
        console.log(`Saving analysis ${i + 1}/${files.length} to database...`);
        const dbId = await saveAnalysis(completedResult, file);
        
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
      
      // Save to database (and upload audio for paid tiers)
      const dbId = await saveAnalysis(completedResult, file);
      
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
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getRiskColor = (risk: string) => risk === 'high' ? 'var(--danger)' : risk === 'medium' ? 'var(--warning)' : 'var(--success)';
  const getSeverityColor = (severity: string) => severity === 'severe' ? 'var(--danger)' : severity === 'moderate' ? 'var(--warning-dark)' : severity === 'mild' ? 'var(--warning)' : 'var(--success)';
  
  const getMomentIcon = (type: string) => {
    // Return empty string - no emojis
    return '';
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
        {/* Upload Zone */}
        <div
          className={`card ${dragOver ? 'drag-over' : ''} ${limitReached ? 'disabled' : ''}`}
          style={{
            border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border-light)',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: limitReached ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            background: dragOver ? 'var(--accent-light)' : 'var(--card)',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}
          onDragOver={(e) => { e.preventDefault(); if (!limitReached) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={limitReached ? undefined : handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            marginBottom: '1rem'
          }}>
            <UploadCloud size={32} />
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text)' }}>
            Drop audio files here
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            or click to browse from your computer
          </p>
          
          <input
            id="file-upload"
            type="file"
            accept="audio/*,video/mpeg,.mp3,.wav,.m4a,.mpeg,.mpga,.ogg,.webm"
            multiple
            onChange={handleFileSelect}
            disabled={limitReached}
            style={{ display: 'none' }}
          />
          
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)'
          }}>
            Supports: MP3, WAV, M4A, MPEG, OGG, WebM
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="selected-files" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileAudio size={20} className="text-muted" />
              Selected Files ({files.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {files.map((file, index) => (
                <div key={index} className="card" style={{ 
                  padding: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)'
                  }}>
                    <FileAudio size={20} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                  </div>
                  
                  <button 
                    onClick={() => removeFile(index)}
                    className="btn-ghost"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '8px',
                      color: 'var(--text-muted)'
                    }}
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
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
            
            <div className="medical-consent-box" style={{ 
              margin: '1.5rem 0', 
              padding: '1rem', 
              background: 'rgba(0, 217, 255, 0.05)', 
              border: '1px solid rgba(0, 217, 255, 0.2)', 
              borderRadius: '8px' 
            }}>
              <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={consentChecked} 
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  style={{ marginTop: '4px' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                  <strong>Patient Consent Confirmation:</strong> I certify that I have obtained necessary patient/customer consent to record and analyze these conversations for quality assurance purposes, in compliance with applicable medical privacy laws (HIPAA/DPDP).
                </span>
              </label>
            </div>

            <button 
              className="cta-button"
              onClick={processFiles}
              disabled={!canAnalyze || files.length === 0 || !consentChecked}
              style={{ 
                width: '100%',
                justifyContent: 'center',
                fontSize: '1.1rem',
                padding: '1rem',
                borderRadius: '12px',
                marginTop: '1rem',
                opacity: (!canAnalyze || files.length === 0 || !consentChecked) ? 0.6 : 1,
                cursor: (!canAnalyze || files.length === 0 || !consentChecked) ? 'not-allowed' : 'pointer',
                background: (!canAnalyze || files.length === 0 || !consentChecked) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                color: (!canAnalyze || files.length === 0 || !consentChecked) ? 'var(--text-muted)' : '#00120f',
                boxShadow: (!canAnalyze || files.length === 0 || !consentChecked) ? 'none' : '0 4px 12px var(--accent-light)',
                border: 'none',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <UploadCloud size={20} />
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
      <div className="analyze-page fade-in">
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <button 
              className="btn-ghost" 
              onClick={() => { setViewMode('upload'); setBulkResults([]); setFiles([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', paddingLeft: 0, color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={16} /> Back to Upload
            </button>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Analysis Results
            </h1>
          </div>
          
          {canExportPDF && summary && (
            <button className="cta-button" onClick={handleDownloadBulkPDF} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
              <Download size={18} /> Export Report
            </button>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
                <Phone size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{summary.totalAnalyzed}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analyzed</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: getScoreColor(summary.avgScore) }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: getScoreColor(summary.avgScore) }}>{summary.avgScore.toFixed(0)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Score</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{summary.highScorers}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performers</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <AlertOctagon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{summary.needsAttention}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Needs Focus</div>
              </div>
            </div>
          </div>
        )}

        {/* Retry All Failed Button */}
        {bulkResults.some(r => r.status === 'error') && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button className="btn-secondary" onClick={retryAllFailed} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Loader2 size={16} /> Retry All Failed ({bulkResults.filter(r => r.status === 'error').length})
            </button>
          </div>
        )}

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {bulkResults.map((call, index) => (
            <div 
              key={call.id} 
              className={`card ${call.status === 'completed' ? 'hover-elevate' : ''}`}
              style={{ 
                padding: '1.25rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                border: '1px solid var(--border-light)',
                cursor: call.status === 'completed' ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: call.status === 'pending' ? 0.7 : 1
              }}
              onClick={() => call.status === 'completed' && (setSelectedCall(call), setViewMode('detail'))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: call.status === 'completed' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: call.status === 'completed' ? 'var(--accent)' : 'var(--text-muted)'
                }}>
                  {call.status === 'processing' ? <Loader2 size={20} className="spin" /> : <FileAudio size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{call.fileName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(call.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {call.status === 'error' && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {call.error?.substring(0, 30)}...
                  </span>
                )}

                {call.status === 'processing' && (
                  <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontStyle: 'italic' }}>Analyzing...</span>
                )}

                {call.status === 'completed' && call.result?.coaching?.overallScore && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(call.result.coaching.overallScore) }}>
                      {call.result.coaching.overallScore}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                  </div>
                )}
                
                {call.status === 'error' && (
                  <button 
                    className="btn-ghost"
                    onClick={(e) => { e.stopPropagation(); retryAnalysis(index); }}
                    style={{ padding: '0.5rem' }}
                  >
                    🔄
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Common Issues */}
        {summary && summary.commonWeaknesses.length > 0 && (
          <div className="card" style={{ padding: '2rem', borderLeft: '4px solid var(--warning)', background: 'var(--warning-light)' }}>
            <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--warning-dark)' }}>
              <Zap size={24} /> Common Areas for Improvement
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {summary.commonWeaknesses.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--warning)', marginTop: '2px' }}>•</span>
                  <span style={{ color: 'var(--text)' }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DETAIL VIEW - REDESIGNED
  if (viewMode === 'detail' && selectedCall?.result) {
    return <CallDetailView call={selectedCall} onBack={() => setViewMode('dashboard')} />;
  }

  return null;
}



export default function AnalyzePage() {
  return (
    <ToastProvider>
      <AnalyzePageContent />
    </ToastProvider>
  );
}
