import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processAudioForAnalysis, checkFileSize } from './audioUtils';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { getUserAndOrg } from '@/app/utils/supabaseServer';

// Debug logging for env vars (masked)
const k1 = process.env.GOOGLE_GEMINI_API_KEY;
const k2 = process.env.GEMINI_API_KEY;
const k3 = process.env.GOOGLE_API_KEY;

const API_KEY = k1 || k2 || k3;

export const runtime = 'nodejs';
export const maxDuration = 120;

// Optimized list based on user's available models (2.0/2.5/Latest)
const MODEL_FALLBACKS = [
  'gemini-flash-latest',       // 1. Valid alias in user's list
  'gemini-2.0-flash',          // 2. High performance stable
  'gemini-2.5-flash',          // 3. Newer stable
  'gemini-2.0-flash-001',      // 4. Specific version
  'gemini-pro-latest',         // 5. Pro fallback
  'gemini-2.5-pro',            // 6. 2.5 Pro
];

export async function POST(req: NextRequest) {
  try {
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

    // Rate limit (per user or IP)
    if (supabaseAdmin) {
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
      const { user_id } = await getUserAndOrg();
      const identifier = user_id || ip || 'anonymous';
      const endpoint = 'transcribe';
      const { data: existing } = await supabaseAdmin
        .from('rate_limit_tracking')
        .select('id, request_count, window_start')
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .order('window_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      const now = new Date();
      const windowMs = 60 * 60 * 1000;
      const maxReq = 30;
      const windowStart = existing?.window_start ? new Date(existing.window_start) : null;

      if (existing && windowStart && now.getTime() - windowStart.getTime() < windowMs) {
        if ((existing.request_count || 0) >= maxReq) {
          return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
        }
        await supabaseAdmin
          .from('rate_limit_tracking')
          .update({ request_count: (existing.request_count || 0) + 1 })
          .eq('id', existing.id);
      } else {
        await supabaseAdmin
          .from('rate_limit_tracking')
          .insert({ identifier, endpoint, request_count: 1, window_start: now.toISOString() });
      }
    }

    console.log(`[Transcribe] Processing: ${audio.name}, Size: ${Math.round(originalBuffer.length / 1024)}KB, Type: ${originalMimeType}`);

    const sizeCheck = checkFileSize(originalBuffer, 20);
    if (!sizeCheck.ok) {
      return NextResponse.json({ 
        error: `File too large (${sizeCheck.sizeMB.toFixed(1)}MB). Maximum size is 20MB.` 
      }, { status: 400 });
    }

    const processedAudio = processAudioForAnalysis(originalBuffer, originalMimeType, audio.name);

    // Optional: persist raw audio to Supabase Storage
    let storagePath: string | null = null;
    let audioUrl: string | null = null;
    if (supabaseAdmin) {
      try {
        const ext = audio.name.split('.').pop() || 'audio';
        const fileKey = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        storagePath = `uploads/${fileKey}`;
        const { error: uploadErr } = await supabaseAdmin.storage
          .from('call-recordings')
          .upload(storagePath, originalBuffer, {
            contentType: processedAudio.mimeType,
            upsert: false,
          });
        if (!uploadErr) {
          const { data: publicUrl } = supabaseAdmin.storage
            .from('call-recordings')
            .getPublicUrl(storagePath);
          audioUrl = publicUrl?.publicUrl || null;
        }
      } catch {}
    }
    
    // 4. Try Models sequentially
    const errors: string[] = [];
    let text = '';
    let usedModel = '';

    const systemPrompt = `
You are an EXTREMELY STRICT and CRITICAL call quality analyst. You have very high standards and are known for being tough but fair. You analyze calls for a medical/healthcare company where quality matters greatly.

Analyze this audio call between a patient/customer and a support agent. The audio may be in English, Hindi, or Hinglish.

CRITICAL EVALUATION MINDSET:
- BE HARSH. A score of 90+ should be EXCEPTIONAL and rare.
- Average performance = 60-70 score, NOT 80+.
- Always look for what the agent COULD have done better.
- If the agent missed ANY opportunity to help, upsell, or improve the experience, note it.
- Don't give the benefit of the doubt - judge based on what actually happened.
- A "good enough" call is NOT excellent. Distinguish mediocrity from excellence.
- If the agent didn't actively probe for needs, that's a weakness.
- If the agent didn't offer additional services/solutions, that's a missed opportunity.
- If the agent rushed the customer or didn't build rapport, penalize it.

Respond ONLY with strict JSON in this exact shape:
{
  "language": string,
  "durationSec": number,
  "transcription": string,
  "summary": string,
  "mom": { "participants": string[], "decisions": string[], "actionItems": string[], "nextSteps": string[] },
  "insights": { "sentiment": "Positive" | "Neutral" | "Negative", "sentimentScore": number, "topics": string[], "keywords": string[] },
  "conversationMetrics": { "agentTalkRatio": number, "customerTalkRatio": number, "silenceRatio": number, "totalQuestions": number, "openQuestions": number, "closedQuestions": number, "agentInterruptions": number, "customerInterruptions": number, "avgResponseTimeSec": number, "longestPauseSec": number, "wordsPerMinuteAgent": number, "wordsPerMinuteCustomer": number },
  "conversationSegments": [ { "name": string, "startTime": string, "endTime": string, "durationSec": number, "quality": "excellent" | "good" | "average" | "poor", "notes": string } ],
  "keyMoments": [ { "timestamp": string, "type": "complaint" | "compliment" | "objection" | "competitor_mention" | "pricing_discussion" | "commitment" | "breakthrough" | "escalation_risk" | "pain_point" | "positive_signal", "speaker": "agent" | "customer", "text": string, "sentiment": "positive" | "neutral" | "negative", "importance": "high" | "medium" | "low" } ],
  "coaching": { "overallScore": number, "categoryScores": { "opening": number, "discovery": number, "solutionPresentation": number, "objectionHandling": number, "closing": number, "empathy": number, "clarity": number, "compliance": number }, "strengths": string[], "weaknesses": string[], "missedOpportunities": string[], "customerHandling": { "score": number, "feedback": string }, "communicationQuality": { "score": number, "feedback": string }, "pitchEffectiveness": { "score": number, "feedback": string }, "objectionHandling": { "score": number, "feedback": string }, "forcedSale": { "detected": boolean, "severity": "none" | "mild" | "moderate" | "severe", "indicators": string[], "feedback": string }, "improvementSuggestions": string[], "scriptRecommendations": string[], "redFlags": string[], "coachingSummary": string },
  "predictions": { "conversionProbability": number, "churnRisk": "high" | "medium" | "low", "escalationRisk": "high" | "medium" | "low", "satisfactionLikely": "high" | "medium" | "low", "followUpNeeded": boolean, "urgencyLevel": "high" | "medium" | "low" },
  "customerProfile": { "communicationStyle": "detailed" | "brief" | "emotional" | "analytical", "decisionStyle": "quick" | "deliberate" | "needs_reassurance" | "price_focused", "engagementLevel": "high" | "medium" | "low", "pricesSensitivity": "high" | "medium" | "low", "concerns": string[], "preferences": string[] },
  "actionItems": { "forAgent": string[], "forManager": string[], "forFollowUp": string[] }
}

STRICT SCORING GUIDELINES:
- 90-100: EXCEPTIONAL - Flawless execution, exceeded expectations, built strong rapport, no missed opportunities
- 80-89: VERY GOOD - Minor issues only, mostly excellent
- 70-79: GOOD - Solid performance with some areas for improvement
- 60-69: AVERAGE - Did the job but nothing special, several improvement areas
- 50-59: BELOW AVERAGE - Significant issues that need training
- Below 50: POOR - Serious concerns, immediate coaching needed

ANALYSIS REQUIREMENTS:
1. TRANSCRIPTION: Full verbatim transcription with speaker labels (A: for Agent, C: for Customer).
2. SUMMARY: 6-10 bullet points covering key discussion points.
3. CONVERSATION METRICS: Calculate talk ratios as percentages (e.g., 45 for 45%, NOT 0.45).
4. CONVERSATION SEGMENTS: Break call into distinct phases.
5. KEY MOMENTS: Identify 5-10 critical moments.
6. COACHING SCORES: Be STRICT. Average calls get 60-70, not 80+.
7. WEAKNESSES: Always find at least 2-3 areas for improvement, even in good calls.
8. MISSED OPPORTUNITIES: What could the agent have done better? Always find something.
9. RED FLAGS: Serious issues only. Leave array EMPTY [] if none exist. Do NOT include "None detected" as an item.
10. FORCED SALE DETECTION: Check for high-pressure tactics, urgency manipulation, not respecting customer's pace.
11. PREDICTIONS: Be realistic, not optimistic.
12. ACTION ITEMS: Specific, actionable follow-ups.

IMPORTANT: For redFlags array - if there are no red flags, return an EMPTY ARRAY []. Do NOT return ["None detected"] or ["None"] or similar.
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
      if (supabaseAdmin) {
        const { organization_id, user_id } = await getUserAndOrg();
        if (organization_id && user_id) {
          await supabaseAdmin.from('audit_logs').insert({
            organization_id,
            user_id,
            action: 'call_analysis_failed',
            resource_type: 'call_analyses',
            metadata: { file_name: audio.name, errors },
          });
        }
      }
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

    // Persist analysis + audit + usage logs
    if (supabaseAdmin) {
      const { organization_id, user_id } = await getUserAndOrg();
      if (organization_id && user_id) {
        const overallScore = normalized?.coaching?.overallScore ?? null;
        const sentiment = normalized?.insights?.sentiment ?? null;
        const durationSec = normalized?.durationSec ?? null;

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('call_analyses')
          .insert({
            organization_id,
            uploaded_by: user_id,
            file_name: audio.name,
            file_size_bytes: originalBuffer.length,
            file_path: storagePath,
            audio_url: audioUrl,
            duration_sec: durationSec,
            language: normalized?.language || null,
            transcription: normalized?.transcription || null,
            summary: normalized?.summary || null,
            overall_score: overallScore,
            sentiment,
            analysis_json: normalized,
            status: 'completed',
          })
          .select('id')
          .single();

        const callId = inserted?.id || null;

        await supabaseAdmin.from('audit_logs').insert({
          organization_id,
          user_id,
          action: 'call_analysis_created',
          resource_type: 'call_analyses',
          resource_id: callId,
          metadata: { file_name: audio.name, model: usedModel },
        });

        await supabaseAdmin.from('usage_logs').insert({
          organization_id,
          user_id,
          action: 'call_analyzed',
          call_analysis_id: callId,
          metadata: { duration_sec: durationSec, file_size_bytes: originalBuffer.length },
        });

        if (insertErr) {
          console.error('Supabase insert error:', insertErr);
        }
      }
    }

    return NextResponse.json({ ...normalized, audioUrl });
  } catch (e: any) {
    console.error('Transcribe API error:', e);
    if (supabaseAdmin) {
      const { organization_id, user_id } = await getUserAndOrg();
      if (organization_id && user_id) {
        await supabaseAdmin.from('audit_logs').insert({
          organization_id,
          user_id,
          action: 'call_analysis_error',
          resource_type: 'call_analyses',
          metadata: { message: e?.message, stack: e?.stack },
        });
      }
    }
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
