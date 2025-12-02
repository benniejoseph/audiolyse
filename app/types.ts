// Types for Call Transcription and Enhanced Analysis

// Coaching Metrics
export type CoachingMetric = {
  score: number;
  feedback: string;
};

export type Coaching = {
  overallScore: number;
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

// MOM (Minutes of Meeting)
export type MOM = {
  participants: string[];
  decisions: string[];
  actionItems: string[];
  nextSteps: string[];
};

// Basic Insights
export type Insights = {
  sentiment?: string;
  topics?: string[];
  keywords?: string[];
};

// NEW: Conversation Structure Segment
export type ConversationSegment = {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  quality: string;
  summary: string;
};

// NEW: Key Moment Detection
export type KeyMoment = {
  timestamp: string;
  type: 'complaint' | 'compliment' | 'objection' | 'commitment' | 'competitor_mention' | 'pricing_discussion' | 'escalation_risk' | 'breakthrough' | 'pain_point' | 'question';
  text: string;
  sentiment: string;
  importance: 'high' | 'medium' | 'low';
};

// NEW: Conversation Metrics
export type ConversationMetrics = {
  talkRatios: {
    agent: number;
    customer: number;
    silence: number;
  };
  questionAnalysis: {
    totalQuestions: number;
    openQuestions: number;
    closedQuestions: number;
    discoveryQuestions: number;
    clarifyingQuestions: number;
  };
  interruptions: {
    byAgent: number;
    byCustomer: number;
    total: number;
  };
  pacing: {
    agentWordsPerMinute: number;
    customerWordsPerMinute: number;
    avgResponseTime: number;
    longestPause: number;
  };
  engagement: {
    activeListeningScore: number;
    rapportScore: number;
    energyLevel: string;
  };
};

// NEW: Predictive Scores
export type PredictiveScores = {
  conversionProbability: number;
  churnRisk: 'high' | 'medium' | 'low';
  escalationRisk: 'high' | 'medium' | 'low';
  treatmentAdherence: 'high' | 'medium' | 'low';
  satisfactionPrediction: number;
  followUpLikelihood: number;
};

// NEW: Patient/Customer Insights
export type CustomerInsights = {
  communicationStyle: string;
  decisionMakingStyle: string;
  priceSensitivity: 'high' | 'medium' | 'low';
  urgencyLevel: 'high' | 'medium' | 'low';
  emotionalState: string;
  knowledgeLevel: string;
  concernAreas: string[];
};

// NEW: Compliance Check
export type ComplianceCheck = {
  overallCompliant: boolean;
  scriptAdherence: number;
  properGreeting: boolean;
  properClosing: boolean;
  disclosuresMade: boolean;
  noMisrepresentation: boolean;
  sensitiveInfoHandling: boolean;
  issues: string[];
};

// NEW: Action Items
export type ActionItems = {
  forAgent: string[];
  forManager: string[];
  forFollowUp: string[];
  urgent: string[];
};

// Main API Result with all enhancements
export type ApiResult = {
  // Basic Info
  transcription: string;
  summary: string;
  language: string;
  durationSec?: number;
  
  // Existing
  mom: MOM;
  insights?: Insights;
  coaching?: Coaching;
  
  // NEW: Enhanced Analytics
  conversationStructure?: {
    segments: ConversationSegment[];
    overallFlow: string;
  };
  keyMoments?: KeyMoment[];
  metrics?: ConversationMetrics;
  predictiveScores?: PredictiveScores;
  customerInsights?: CustomerInsights;
  compliance?: ComplianceCheck;
  actionItems?: ActionItems;
  
  // NEW: Healthcare Specific
  healthcareMetrics?: {
    symptomsCaptured: string[];
    treatmentDiscussed: string[];
    medicationsMentioned: string[];
    followUpScheduled: boolean;
    patientEducationScore: number;
    painLevelMentioned?: number;
    complianceIndicators: string[];
  };
};

// Bulk Analysis Types
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
  commonStrengths: string[];
  commonWeaknesses: string[];
  topImprovementAreas: string[];
  redFlagCount: number;
  // NEW: Enhanced Summary
  avgTalkRatio?: number;
  avgConversionProbability?: number;
  totalKeyMoments?: number;
  commonComplaintTypes?: string[];
  topPerformingMetrics?: string[];
  trainingNeeds?: string[];
};
