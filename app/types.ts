// Types for Enhanced Call Transcription and Analysis

export type CoachingMetric = {
  score: number;
  feedback: string;
};

export type CategoryScores = {
  opening: number;
  discovery: number;
  solutionPresentation: number;
  objectionHandling: number;
  closing: number;
  empathy: number;
  clarity: number;
  compliance: number;
};

export type Coaching = {
  overallScore: number;
  categoryScores: CategoryScores;
  strengths: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  customerHandling: CoachingMetric;
  communicationQuality: CoachingMetric;
  pitchEffectiveness: CoachingMetric;
  objectionHandling: CoachingMetric;
  improvementSuggestions: string[];
  scriptRecommendations: string[];
  redFlags: string[];
  coachingSummary: string;
};

export type MOM = {
  participants: string[];
  decisions: string[];
  actionItems: string[];
  nextSteps: string[];
};

export type Insights = {
  sentiment: string;
  sentimentScore?: number;
  topics: string[];
  keywords: string[];
};

export type ConversationMetrics = {
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
};

export type ConversationSegment = {
  name: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  quality: 'excellent' | 'good' | 'average' | 'poor';
  notes: string;
};

export type KeyMomentType = 
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

export type KeyMoment = {
  timestamp: string;
  type: KeyMomentType;
  speaker: 'agent' | 'customer';
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'high' | 'medium' | 'low';
};

export type Predictions = {
  conversionProbability: number;
  churnRisk: 'high' | 'medium' | 'low';
  escalationRisk: 'high' | 'medium' | 'low';
  satisfactionLikely: 'high' | 'medium' | 'low';
  followUpNeeded: boolean;
  urgencyLevel: 'high' | 'medium' | 'low';
};

export type CustomerProfile = {
  communicationStyle: 'detailed' | 'brief' | 'emotional' | 'analytical';
  decisionStyle: 'quick' | 'deliberate' | 'needs_reassurance' | 'price_focused';
  engagementLevel: 'high' | 'medium' | 'low';
  pricesSensitivity: 'high' | 'medium' | 'low';
  concerns: string[];
  preferences: string[];
};

export type ActionItems = {
  forAgent: string[];
  forManager: string[];
  forFollowUp: string[];
};

export type ApiResult = {
  transcription: string;
  summary: string;
  mom: MOM;
  language: string;
  durationSec?: number;
  insights: Insights;
  conversationMetrics?: ConversationMetrics;
  conversationSegments?: ConversationSegment[];
  keyMoments?: KeyMoment[];
  coaching?: Coaching;
  predictions?: Predictions;
  customerProfile?: CustomerProfile;
  actionItems?: ActionItems;
};

export type BulkCallResult = {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: ApiResult;
  error?: string;
  processedAt?: Date;
};

export type BulkAnalysisSummary = {
  totalCalls: number;
  completedCalls: number;
  averageScore: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  avgTalkRatio: number;
  avgQuestions: number;
  commonStrengths: string[];
  commonWeaknesses: string[];
  topImprovementAreas: string[];
  redFlagCount: number;
  keyMomentsSummary: {
    complaints: number;
    compliments: number;
    objections: number;
    competitorMentions: number;
  };
};

// Helper function to get moment type icon
export const getMomentIcon = (type: KeyMomentType): string => {
  const icons: Record<KeyMomentType, string> = {
    complaint: '😤',
    compliment: '😊',
    objection: '🤔',
    competitor_mention: '🏢',
    pricing_discussion: '💰',
    commitment: '🤝',
    breakthrough: '💡',
    escalation_risk: '⚠️',
    pain_point: '😟',
    positive_signal: '✨',
  };
  return icons[type] || '📍';
};

// Helper function to get moment type label
export const getMomentLabel = (type: KeyMomentType): string => {
  const labels: Record<KeyMomentType, string> = {
    complaint: 'Complaint',
    compliment: 'Compliment',
    objection: 'Objection',
    competitor_mention: 'Competitor Mention',
    pricing_discussion: 'Pricing Discussion',
    commitment: 'Commitment',
    breakthrough: 'Breakthrough',
    escalation_risk: 'Escalation Risk',
    pain_point: 'Pain Point',
    positive_signal: 'Positive Signal',
  };
  return labels[type] || type;
};

// Helper function to get quality color
export const getQualityColor = (quality: string): string => {
  const colors: Record<string, string> = {
    excellent: '#7cffc7',
    good: '#a8e6cf',
    average: '#ffd166',
    poor: '#ff6b6b',
  };
  return colors[quality] || '#888';
};

// Helper function to get risk color
export const getRiskColor = (risk: string): string => {
  const colors: Record<string, string> = {
    high: '#ff6b6b',
    medium: '#ffd166',
    low: '#7cffc7',
  };
  return colors[risk] || '#888';
};
