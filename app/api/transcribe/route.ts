import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processAudioForAnalysis, checkFileSize } from './audioUtils';

// Debug logging for env vars (masked)
const k1 = process.env.GOOGLE_GEMINI_API_KEY;
const k2 = process.env.GEMINI_API_KEY;
const k3 = process.env.GOOGLE_API_KEY;

console.log('[Debug] Env Vars Check:', {
  GOOGLE_GEMINI_API_KEY: k1 ? `Present (${k1.length} chars)` : 'Missing',
  GEMINI_API_KEY: k2 ? `Present (${k2.length} chars)` : 'Missing',
  GOOGLE_API_KEY: k3 ? `Present (${k3.length} chars)` : 'Missing',
});

const API_KEY = k1 || k2 || k3;

export const runtime = 'nodejs';
export const maxDuration = 120;

// List of models to try in order of preference/speed/cost
const MODEL_FALLBACKS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-001',
  'gemini-1.5-pro',
  'gemini-1.5-pro-001',
  'gemini-pro-vision', 
];

export async function POST(req: NextRequest) {
  try {
    // 1. Validate API Configuration
    if (!API_KEY) {
      console.error('[Error] No API Key found in environment variables.');
      return NextResponse.json({ 
        error: 'Server Misconfigured: Missing GOOGLE_GEMINI_API_KEY environment variable. Debug info logged to server console.' 
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

    console.log(`[Transcribe] Processing: ${audio.name}, Size: ${Math.round(originalBuffer.length / 1024)}KB, Type: ${originalMimeType}`);

    // 3. Size Check
    const sizeCheck = checkFileSize(originalBuffer, 20);
    if (!sizeCheck.ok) {
      return NextResponse.json({ 
        error: `File too large (${sizeCheck.sizeMB.toFixed(1)}MB). Maximum size is 20MB.` 
      }, { status: 400 });
    }

    const processedAudio = processAudioForAnalysis(originalBuffer, originalMimeType, audio.name);
    console.log(`[Transcribe] Audio ready - Format: ${processedAudio.mimeType}, Size: ${Math.round(processedAudio.buffer.length / 1024)}KB`);

    const systemPrompt = `
You are an expert call quality analyst, conversation intelligence specialist, and sales/support coach. Analyze this audio call between a patient/customer and a support agent, physiotherapy practitioner, or sales representative. The audio may be in English, Hindi, or Hinglish.

Perform DEEP ANALYSIS and respond ONLY with strict JSON in this exact shape:
{
  "language": string,
  "durationSec": number,
  "transcription": string,
  "summary": string,
  
  "mom": {
    "participants": string[],
    "decisions": string[],
    "actionItems": string[],
    "nextSteps": string[]
  },
  
  "insights": {
    "sentiment": "Positive" | "Neutral" | "Negative",
    "sentimentScore": number,
    "topics": string[],
    "keywords": string[]
  },
  
  "conversationMetrics": {
    "agentTalkRatio": number,
    "customerTalkRatio": number,
    "silenceRatio": number,
    "totalQuestions": number,
    "openQuestions": number,
    "closedQuestions": number,
    "agentInterruptions": number,
    "customerInterruptions": number,
    "avgResponseTimeSec": number,
    "longestPauseSec": number,
    "wordsPerMinuteAgent": number,
    "wordsPerMinuteCustomer": number
  },
  
  "conversationSegments": [
    {
      "name": string,
      "startTime": string,
      "endTime": string,
      "durationSec": number,
      "quality": "excellent" | "good" | "average" | "poor",
      "notes": string
    }
  ],
  
  "keyMoments": [
    {
      "timestamp": string,
      "type": "complaint" | "compliment" | "objection" | "competitor_mention" | "pricing_discussion" | "commitment" | "breakthrough" | "escalation_risk" | "pain_point" | "positive_signal",
      "speaker": "agent" | "customer",
      "text": string,
      "sentiment": "positive" | "neutral" | "negative",
      "importance": "high" | "medium" | "low"
    }
  ],
  
  "coaching": {
    "overallScore": number,
    "categoryScores": {
      "opening": number,
      "discovery": number,
      "solutionPresentation": number,
      "objectionHandling": number,
      "closing": number,
      "empathy": number,
      "clarity": number,
      "compliance": number
    },
    "strengths": string[],
    "weaknesses": string[],
    "missedOpportunities": string[],
    "customerHandling": { "score": number, "feedback": string },
    "communicationQuality": { "score": number, "feedback": string },
    "pitchEffectiveness": { "score": number, "feedback": string },
    "objectionHandling": { "score": number, "feedback": string },
    "forcedSale": {
      "detected": boolean,
      "severity": "none" | "mild" | "moderate" | "severe",
      "indicators": string[],
      "feedback": string
    },
    "improvementSuggestions": string[],
    "scriptRecommendations": string[],
    "redFlags": string[],
    "coachingSummary": string
  },
  
  "predictions": {
    "conversionProbability": number,
    "churnRisk": "high" | "medium" | "low",
    "escalationRisk": "high" | "medium" | "low",
    "satisfactionLikely": "high" | "medium" | "low",
    "followUpNeeded": boolean,
    "urgencyLevel": "high" | "medium" | "low"
  },
  
  "customerProfile": {
    "communicationStyle": "detailed" | "brief" | "emotional" | "analytical",
    "decisionStyle": "quick" | "deliberate" | "needs_reassurance" | "price_focused",
    "engagementLevel": "high" | "medium" | "low",
    "pricesSensitivity": "high" | "medium" | "low",
    "concerns": string[],
    "preferences": string[]
  },
  
  "actionItems": {
    "forAgent": string[],
    "forManager": string[],
    "forFollowUp": string[]
  }
}

ANALYSIS REQUIREMENTS:

1. TRANSCRIPTION: Full, natural transcription with speaker labels (Agent/Customer or names if mentioned). Include punctuation.

2. SUMMARY: 6-10 crisp bullet points covering: problem presented, discovery made, solutions offered, objections raised, outcomes, next steps.

3. CONVERSATION METRICS (Calculate precisely):
   - agentTalkRatio: % of time agent speaks (target: 40-50%)
   - customerTalkRatio: % of time customer speaks
   - silenceRatio: % of silence/pauses
   - Questions: Count open-ended vs closed questions
   - Interruptions: Count times each party interrupts
   - Response time: Average seconds before responding
   - Speech rate: Estimate words per minute

4. CONVERSATION SEGMENTS: Break the call into phases:
   - Greeting/Opening
   - Discovery/Problem Identification  
   - Solution/Recommendation
   - Objection Handling (if any)
   - Closing/Next Steps
   Rate each segment's quality.

5. KEY MOMENTS: Identify 5-10 critical moments including:
   - Complaints or frustrations expressed
   - Compliments or positive feedback
   - Competitor mentions
   - Pricing/cost discussions
   - Objections raised
   - Commitments made
   - Breakthrough moments (customer understanding)
   - Escalation risks
   Include timestamp (MM:SS format), exact quote, and sentiment.

6. COACHING SCORES (1-100 for each):
   - Opening: Greeting quality, rapport building
   - Discovery: Questions asked, understanding needs
   - Solution: Clarity, relevance, value proposition
   - Objection Handling: Addressing concerns effectively
   - Closing: Clear next steps, call to action
   - Empathy: Understanding, patience, acknowledgment
   - Clarity: Clear communication, no jargon
   - Compliance: Following guidelines, proper disclosures

10. FORCED SALE DETECTION (CRITICAL):
   Analyze if the agent pressured or forced the customer into a sale/decision. Look for:
   - Agent not accepting "no" or "I need to think about it"
   - Creating false urgency ("offer expires today", "last chance")
   - Ignoring customer's budget constraints or objections
   - Not giving customer time to think or consult others
   - Manipulative language or guilt-tripping
   - Agent dominating conversation without listening
   - Pushing add-ons or upgrades after customer said no
   - Not respecting customer's explicit refusal
   - Using fear tactics or exaggerated consequences
   
   Severity levels:
   - "none": Customer was given full autonomy, no pressure detected
   - "mild": Minor pressure tactics but customer still had choice
   - "moderate": Noticeable pressure that may have influenced decision
   - "severe": Clear forced sale tactics that violated customer's autonomy

7. PREDICTIONS (be realistic):
   - Conversion probability: 0-100% likelihood of desired outcome
   - Churn risk: Will customer leave/not return?
   - Escalation risk: Will this become a complaint?
   - Satisfaction: How satisfied is the customer?

8. CUSTOMER PROFILE: Infer from conversation:
   - How they communicate
   - How they make decisions
   - Price sensitivity signals
   - Main concerns and preferences

9. ACTION ITEMS: Specific follow-ups needed

If any field cannot be determined, use reasonable defaults (0 for numbers, "unknown" for strings, empty arrays for lists).
`;

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
      temperature: 0.1,
      topK: 20,
      topP: 0.85,
      responseMimeType: 'application/json'
    };

    let text = '';
    let usedModel = '';
    let lastError: any = null;

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
        lastError = e;
      }
    }

    if (!text && lastError) {
      throw lastError; 
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'Model returned non-JSON', raw: text }, { status: 502 });
    }

    const d: any = data || {};
    
    // Normalize with all enhanced fields
    const normalized = {
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
        agentTalkRatio: d?.conversationMetrics?.agentTalkRatio || 0,
        customerTalkRatio: d?.conversationMetrics?.customerTalkRatio || 0,
        silenceRatio: d?.conversationMetrics?.silenceRatio || 0,
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
        redFlags: d?.coaching?.redFlags || [],
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

    return NextResponse.json(normalized);
  } catch (e: any) {
    console.error('Transcribe API error:', e);
    
    // Better error format
    const errorMessage = e?.message || 'Unexpected error';
    const isModelNotFoundError = errorMessage.includes('404') && errorMessage.includes('models/');
    
    if (isModelNotFoundError) {
       return NextResponse.json({
         error: 'AI Model configuration error. The server could not find a compatible Gemini model (Flash/Pro) for your API Key.',
         details: errorMessage
       }, { status: 500 });
    }

    return NextResponse.json({
      error: errorMessage,
      stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined,
    }, { status: 500 });
  }
}
