/**
 * Centralized type definitions for CallTranscribe
 * Single source of truth for all types used across the application
 */

// ============ COACHING TYPES ============

export interface CoachingMetric {
  score: number;
  feedback: string;
}

export interface CategoryScores {
  opening: number;
  discovery: number;
  solutionPresentation: number;
  objectionHandling: number;
  closing: number;
  empathy: number;
  clarity: number;
  compliance: number;
}

export interface ForcedSale {
  detected: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  indicators: string[];
  feedback: string;
}

export interface Coaching {
  overallScore: number;
  categoryScores?: CategoryScores;
  strengths: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  customerHandling: CoachingMetric;
  communicationQuality: CoachingMetric;
  pitchEffectiveness: CoachingMetric;
  objectionHandling: CoachingMetric;
  forcedSale?: ForcedSale;
  improvementSuggestions: string[];
  scriptRecommendations: string[];
  redFlags: string[];
  coachingSummary: string;
}

// ============ MEETING TYPES ============

export interface MOM {
  participants: string[];
  decisions: string[];
  actionItems: string[];
  nextSteps: string[];
}

// ============ INSIGHTS TYPES ============

export interface Insights {
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore?: number;
  topics?: string[];
  keywords?: string[];
}

// ============ METRICS TYPES ============

export interface ConversationMetrics {
  agentTalkRatio: number;
  customerTalkRatio: number;
  silenceRatio: number;
  totalQuestions: number;
  openQuestions: number;
  closedQuestions: number;
  agentInterruptions: number;
  customerInterruptions: number;
  avgResponseTimeSec: number;
  longestPauseSec: number;
  wordsPerMinuteAgent: number;
  wordsPerMinuteCustomer: number;
}

export interface ConversationSegment {
  name: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  quality: 'excellent' | 'good' | 'average' | 'poor';
  notes: string;
}

// ============ KEY MOMENTS TYPES ============

export type MomentType = 
  | 'complaint' 
  | 'compliment' 
  | 'objection' 
  | 'competitor_mention' 
  | 'pricing_discussion' 
  | 'commitment' 
  | 'breakthrough' 
  | 'escalation_risk' 
  | 'pain_point' 
  | 'positive_signal';

export type MomentImportance = 'high' | 'medium' | 'low';
export type MomentSentiment = 'positive' | 'neutral' | 'negative';

export interface KeyMoment {
  timestamp: string;
  type: MomentType;
  speaker: 'agent' | 'customer';
  text: string;
  sentiment: MomentSentiment;
  importance: MomentImportance;
}

// ============ PREDICTIONS TYPES ============

export type RiskLevel = 'high' | 'medium' | 'low';

export interface Predictions {
  conversionProbability: number;
  churnRisk: RiskLevel;
  escalationRisk: RiskLevel;
  satisfactionLikely: RiskLevel;
  followUpNeeded: boolean;
  urgencyLevel: RiskLevel;
}

// ============ CUSTOMER PROFILE TYPES ============

export type CommunicationStyle = 'detailed' | 'brief' | 'emotional' | 'analytical';
export type DecisionStyle = 'quick' | 'deliberate' | 'needs_reassurance' | 'price_focused';

export interface CustomerProfile {
  communicationStyle: CommunicationStyle;
  decisionStyle: DecisionStyle;
  engagementLevel: RiskLevel;
  pricesSensitivity: RiskLevel;
  concerns: string[];
  preferences: string[];
}

// ============ ACTION ITEMS TYPES ============

export interface ActionItems {
  forAgent: string[];
  forManager: string[];
  forFollowUp: string[];
}

// ============ MAIN API RESULT ============

export interface ApiResult {
  // Metadata
  modelUsed?: string;
  language: string;
  durationSec?: number;
  
  // Core content
  transcription: string;
  summary: string;
  
  // Structured data
  mom: MOM;
  insights?: Insights;
  coaching?: Coaching;
  conversationMetrics?: ConversationMetrics;
  conversationSegments?: ConversationSegment[];
  keyMoments?: KeyMoment[];
  predictions?: Predictions;
  customerProfile?: CustomerProfile;
  actionItems?: ActionItems;
}

// ============ BULK ANALYSIS TYPES ============

export type CallStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface BulkCallResult {
  id: string;
  fileName: string;
  fileSize: number;
  status: CallStatus;
  result?: ApiResult;
  error?: string;
  audioUrl?: string;
}

export interface BulkAnalysisSummary {
  totalCalls: number;
  completedCalls: number;
  averageScore: number;
  avgConversion: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonStrengths: string[];
  commonWeaknesses: string[];
  redFlagCount: number;
  forcedSaleCount: number;
}

// ============ FILE HANDLING TYPES ============

export interface FileWithId {
  id: string;
  file: File;
}

export interface ProcessedAudio {
  buffer: Buffer;
  mimeType: string;
  originalFormat: string;
}

// ============ UI STATE TYPES ============

export type ViewMode = 'upload' | 'dashboard' | 'detail';
export type ActiveTab = 'metrics' | 'coaching' | 'moments' | 'transcript' | 'summary' | 'predictions';
