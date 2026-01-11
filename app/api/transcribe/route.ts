import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processAudioForAnalysis, checkFileSize } from './audioUtils';
import { createClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier, type AISettings } from '@/lib/types/database';
import { buildAnalysisPrompt, type OrganizationContext } from '@/lib/ai/prompt-builder';

// Debug logging for env vars (masked)
const k1 = process.env.GOOGLE_GEMINI_API_KEY;
const k2 = process.env.GEMINI_API_KEY;
const k3 = process.env.GOOGLE_API_KEY;

const API_KEY = k1 || k2 || k3;

export const runtime = 'nodejs';
export const maxDuration = 120;

// Cost-optimized: Use Flash models first (94% cheaper than Pro)
const MODEL_FALLBACKS = [
  'gemini-1.5-flash',          // 1. Most cost-effective for most tasks
  'gemini-flash-latest',       // 2. Latest flash version
  'gemini-2.0-flash',          // 3. Newer flash
  'gemini-1.5-flash-001',      // 4. Specific stable version
  'gemini-2.0-flash-001',      // 5. Specific 2.0 version
  // Pro models only as last resort (expensive)
  'gemini-1.5-pro',            // 6. Pro fallback (avoid if possible)
];

export async function POST(req: NextRequest) {
  try {
    // 0. Authenticate User
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // 0.1 Fetch Organization Context & Settings
    let subscriptionTier: SubscriptionTier = 'free';
    let organizationId: string | null = null;
    let organizationContext: OrganizationContext | undefined;
    
    try {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        organizationId = membership.organization_id;
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, industry, ai_settings, subscription_tier')
          .eq('id', membership.organization_id)
          .single();

        if (org) {
          subscriptionTier = (org.subscription_tier as SubscriptionTier) || 'free';
          
          // Build organization context for prompt builder
          organizationContext = {
            id: org.id,
            name: org.name,
            industry: org.industry || 'general',
            aiSettings: org.ai_settings as AISettings | undefined,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch org context for transcription:', e);
      // Continue without context if fetch fails
    }
    
    // Get tier-specific limits
    const tierLimits = SUBSCRIPTION_LIMITS[subscriptionTier];

    // 1. Validate API Configuration
    if (!API_KEY) {
      return NextResponse.json({ 
        error: 'Server Misconfigured: Missing GOOGLE_GEMINI_API_KEY environment variable.' 
      }, { status: 500 });
    }

    const gemini = new GoogleGenerativeAI(API_KEY);
    
    // 2. Parse Form Data
    const form = await req.formData();
    const audio = form.get('audio');
    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const originalMimeType = audio.type || 'audio/mpeg';
    const originalBuffer = Buffer.from(arrayBuffer);

    console.log(`[Transcribe] Processing: ${audio.name}, Size: ${Math.round(originalBuffer.length / 1024)}KB, Type: ${originalMimeType}, Tier: ${subscriptionTier}`);

    // Use tier-specific file size limit
    const maxFileSizeMb = tierLimits.maxFileSizeMb;
    const sizeCheck = checkFileSize(originalBuffer, maxFileSizeMb);
    if (!sizeCheck.ok) {
      const upgradeHint = subscriptionTier === 'free' 
        ? ' Upgrade to a paid plan for larger file support.' 
        : '';
      return NextResponse.json({ 
        error: `File too large (${sizeCheck.sizeMB.toFixed(1)}MB). Maximum size for ${subscriptionTier} tier is ${maxFileSizeMb}MB.${upgradeHint}` 
      }, { status: 400 });
    }

    const processedAudio = processAudioForAnalysis(originalBuffer, originalMimeType, audio.name);
    
    // 4. Try Models sequentially
    const errors: string[] = [];
    let text = '';
    let usedModel = '';

    // Build industry-specific, context-aware prompt
    const systemPrompt = buildAnalysisPrompt({
      organization: organizationContext,
      callType: 'general', // Could be passed from form in future
      language: 'English, Hindi, or Hinglish',
    });
    
    console.log(`[Transcribe] Using industry: ${organizationContext?.industry || 'general'}, org: ${organizationContext?.name || 'N/A'}`);

    const audioBase64 = processedAudio.buffer.toString('base64');
    const finalMimeType = processedAudio.mimeType;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          { inlineData: { mimeType: finalMimeType, data: audioBase64 } },
        ],
      },
    ];

    const generationConfig = {
      temperature: 0.0, // Absolute zero for maximum consistency
      topK: 1,          // Greedy decoding (pick only the most likely token)
      topP: 0.95,
      responseMimeType: 'application/json'
    };

    for (const modelName of MODEL_FALLBACKS) {
      try {
        console.log(`[Transcribe] Attempting with model: ${modelName}`);
        const model = gemini.getGenerativeModel({ model: modelName });
      const resp = await model.generateContent({ contents, generationConfig });
      text = resp.response.text();
        usedModel = modelName;
        console.log(`[Transcribe] Success with model: ${modelName}`);
          break;
      } catch (e: any) {
        console.warn(`[Transcribe] Failed with ${modelName}:`, e.message);
        errors.push(`${modelName}: ${e.message}`);
      }
    }

    if (!text) {
      return NextResponse.json({
        error: 'All AI models failed to respond.',
        debug_errors: errors
      }, { status: 500 });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'Model returned non-JSON', raw: text }, { status: 502 });
    }

    const d: any = data || {};
    const normalized = normalizeData(d, usedModel);

    return NextResponse.json(normalized);
  } catch (e: any) {
    console.error('Transcribe API error:', e);
    return NextResponse.json({
      error: e?.message || 'Unexpected error',
      stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined,
    }, { status: 500 });
  }
}

function normalizeData(d: any, usedModel: string) {
    return {
      modelUsed: usedModel,
      language: d.language || 'unknown',
      durationSec: d.durationSec || 0,
      transcription: d.transcription || '',
      summary: d.summary || '',
      
      mom: {
        participants: d?.mom?.participants || [],
        decisions: d?.mom?.decisions || [],
        actionItems: d?.mom?.actionItems || [],
        nextSteps: d?.mom?.nextSteps || [],
      },
      
      insights: {
        sentiment: d?.insights?.sentiment || 'Neutral',
        sentimentScore: d?.insights?.sentimentScore || 50,
        topics: d?.insights?.topics || [],
        keywords: d?.insights?.keywords || [],
      },
      
      conversationMetrics: {
        // Normalize ratios: if > 1, assume it's a percentage and convert to decimal
        agentTalkRatio: (() => {
          const val = d?.conversationMetrics?.agentTalkRatio || 0;
          return val > 1 ? val / 100 : val;
        })(),
        customerTalkRatio: (() => {
          const val = d?.conversationMetrics?.customerTalkRatio || 0;
          return val > 1 ? val / 100 : val;
        })(),
        silenceRatio: (() => {
          const val = d?.conversationMetrics?.silenceRatio || 0;
          return val > 1 ? val / 100 : val;
        })(),
        totalQuestions: d?.conversationMetrics?.totalQuestions || 0,
        openQuestions: d?.conversationMetrics?.openQuestions || 0,
        closedQuestions: d?.conversationMetrics?.closedQuestions || 0,
        agentInterruptions: d?.conversationMetrics?.agentInterruptions || 0,
        customerInterruptions: d?.conversationMetrics?.customerInterruptions || 0,
        avgResponseTimeSec: d?.conversationMetrics?.avgResponseTimeSec || 0,
        longestPauseSec: d?.conversationMetrics?.longestPauseSec || 0,
        wordsPerMinuteAgent: d?.conversationMetrics?.wordsPerMinuteAgent || 0,
        wordsPerMinuteCustomer: d?.conversationMetrics?.wordsPerMinuteCustomer || 0,
      },
      
      conversationSegments: Array.isArray(d?.conversationSegments) 
        ? d.conversationSegments.map((s: any) => ({
            name: s.name || '',
            startTime: s.startTime || '0:00',
            endTime: s.endTime || '0:00',
            durationSec: s.durationSec || 0,
            quality: s.quality || 'average',
            notes: s.notes || '',
          }))
        : [],
      
      keyMoments: Array.isArray(d?.keyMoments)
        ? d.keyMoments.map((m: any) => ({
            timestamp: m.timestamp || '0:00',
            type: m.type || 'pain_point',
            speaker: m.speaker || 'customer',
            text: m.text || '',
            sentiment: m.sentiment || 'neutral',
            importance: m.importance || 'medium',
          }))
        : [],
      
      coaching: {
        overallScore: d?.coaching?.overallScore || 0,
        categoryScores: {
          opening: d?.coaching?.categoryScores?.opening || 0,
          discovery: d?.coaching?.categoryScores?.discovery || 0,
          solutionPresentation: d?.coaching?.categoryScores?.solutionPresentation || 0,
          objectionHandling: d?.coaching?.categoryScores?.objectionHandling || 0,
          closing: d?.coaching?.categoryScores?.closing || 0,
          empathy: d?.coaching?.categoryScores?.empathy || 0,
          clarity: d?.coaching?.categoryScores?.clarity || 0,
          compliance: d?.coaching?.categoryScores?.compliance || 0,
        },
        strengths: d?.coaching?.strengths || [],
        weaknesses: d?.coaching?.weaknesses || [],
        missedOpportunities: d?.coaching?.missedOpportunities || [],
        customerHandling: {
          score: d?.coaching?.customerHandling?.score || 0,
          feedback: d?.coaching?.customerHandling?.feedback || '',
        },
        communicationQuality: {
          score: d?.coaching?.communicationQuality?.score || 0,
          feedback: d?.coaching?.communicationQuality?.feedback || '',
        },
        pitchEffectiveness: {
          score: d?.coaching?.pitchEffectiveness?.score || 0,
          feedback: d?.coaching?.pitchEffectiveness?.feedback || '',
        },
        objectionHandling: {
          score: d?.coaching?.objectionHandling?.score || 0,
          feedback: d?.coaching?.objectionHandling?.feedback || '',
        },
        forcedSale: {
          detected: d?.coaching?.forcedSale?.detected || false,
          severity: d?.coaching?.forcedSale?.severity || 'none',
          indicators: d?.coaching?.forcedSale?.indicators || [],
          feedback: d?.coaching?.forcedSale?.feedback || 'No forced sale tactics detected.',
        },
        improvementSuggestions: d?.coaching?.improvementSuggestions || [],
        scriptRecommendations: d?.coaching?.scriptRecommendations || [],
        // Filter out empty/placeholder red flags
        redFlags: (d?.coaching?.redFlags || []).filter((rf: string) => 
          rf && 
          rf.trim() !== '' && 
          rf.toLowerCase() !== 'none' && 
          rf.toLowerCase() !== 'none detected' && 
          rf.toLowerCase() !== 'none detected.' &&
          rf.toLowerCase() !== 'n/a' &&
          rf.toLowerCase() !== 'no red flags' &&
          rf.toLowerCase() !== 'no red flags detected' &&
          rf.toLowerCase() !== 'no red flags detected.'
        ),
        coachingSummary: d?.coaching?.coachingSummary || '',
      },
      
      predictions: {
        conversionProbability: d?.predictions?.conversionProbability || 0,
        churnRisk: d?.predictions?.churnRisk || 'medium',
        escalationRisk: d?.predictions?.escalationRisk || 'low',
        satisfactionLikely: d?.predictions?.satisfactionLikely || 'medium',
        followUpNeeded: d?.predictions?.followUpNeeded || false,
        urgencyLevel: d?.predictions?.urgencyLevel || 'medium',
      },
      
      customerProfile: {
        communicationStyle: d?.customerProfile?.communicationStyle || 'brief',
        decisionStyle: d?.customerProfile?.decisionStyle || 'deliberate',
        engagementLevel: d?.customerProfile?.engagementLevel || 'medium',
        pricesSensitivity: d?.customerProfile?.pricesSensitivity || 'medium',
        concerns: d?.customerProfile?.concerns || [],
        preferences: d?.customerProfile?.preferences || [],
      },
      
      actionItems: {
        forAgent: d?.actionItems?.forAgent || [],
        forManager: d?.actionItems?.forManager || [],
        forFollowUp: d?.actionItems?.forFollowUp || [],
      },
    };
}
