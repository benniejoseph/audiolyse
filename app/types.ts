// Types for Call Transcription and Analysis

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

export type MOM = {
  participants: string[];
  decisions: string[];
  actionItems: string[];
  nextSteps: string[];
};

export type Insights = {
  sentiment?: string;
  topics?: string[];
  keywords?: string[];
};

export type ApiResult = {
  transcription: string;
  summary: string;
  mom: MOM;
  language: string;
  durationSec?: number;
  insights?: Insights;
  coaching?: Coaching;
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
  commonStrengths: string[];
  commonWeaknesses: string[];
  topImprovementAreas: string[];
  redFlagCount: number;
};


