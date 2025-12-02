import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processAudioForAnalysis, checkFileSize } from './audioUtils';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

// We will also fallback to a build-time embedded key if user provided one in code comments.
// NOTE: For production, always use environment variables in Vercel. The user asked to use a fixed key; we'll allow fallback.
const HARDCODED_FALLBACK = "AIzaSyAITrV75kNkzbOdHTjWM7-ms7tC2lw-C7A";

const gemini = new GoogleGenerativeAI(API_KEY || HARDCODED_FALLBACK);

// We will instruct the model to return strict JSON instead of using a response schema

export const runtime = 'nodejs';

// Increase timeout for audio processing
export const maxDuration = 120; // 2 minutes

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio');
    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const originalMimeType = audio.type || 'audio/mpeg';
    const originalBuffer = Buffer.from(arrayBuffer);

    console.log(`[Transcribe] Processing: ${audio.name}, Size: ${Math.round(originalBuffer.length / 1024)}KB, Type: ${originalMimeType}`);

    // Check file size (Gemini limit is ~20MB for inline data)
    const sizeCheck = checkFileSize(originalBuffer, 20);
    if (!sizeCheck.ok) {
      return NextResponse.json({ 
        error: `File too large (${sizeCheck.sizeMB.toFixed(1)}MB). Maximum size is 20MB. Please compress the audio file.` 
      }, { status: 400 });
    }

    // Normalize MIME type for Gemini
    const processedAudio = processAudioForAnalysis(originalBuffer, originalMimeType, audio.name);
    
    console.log(`[Transcribe] Audio ready - Format: ${processedAudio.mimeType}, Size: ${Math.round(processedAudio.buffer.length / 1024)}KB`);

    // Create a model instance with enhanced reasoning
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const systemPrompt = `
You are an expert call quality analyst and sales/support coach. The audio contains a two-party conversation between a patient/customer and a support agent, physiotherapy practitioner, or sales representative. The audio may be in English, Hindi, or other Indian languages (Hinglish mixed allowed).

First, think step-by-step thoroughly about the full audio to extract all necessary information. Then respond ONLY with strict JSON in this shape:
{
  "language": string,
  "durationSec": number | null,
  "transcription": string,
  "summary": string,
  "mom": {
    "participants": string[],
    "decisions": string[],
    "actionItems": string[],
    "nextSteps": string[]
  },
  "insights": {"sentiment": string, "topics": string[], "keywords": string[]},
  "coaching": {
    "overallScore": number,
    "strengths": string[],
    "weaknesses": string[],
    "missedOpportunities": string[],
    "customerHandling": {
      "score": number,
      "feedback": string
    },
    "communicationQuality": {
      "score": number,
      "feedback": string
    },
    "pitchEffectiveness": {
      "score": number,
      "feedback": string
    },
    "objectionHandling": {
      "score": number,
      "feedback": string
    },
    "improvementSuggestions": string[],
    "scriptRecommendations": string[],
    "redFlags": string[],
    "coachingSummary": string
  }
}

Requirements:
1) Provide Summary, Transcript, MOM (if applicable), Insights, and detailed Coaching analysis. Analyze the entire audio. If MOM is not applicable, set arrays empty.
2) Transcript must be comprehensive and natural with punctuation. Use generic speakers if uncertain.
3) Summary: 6–10 crisp bullets covering symptoms, assessments, recommendations, concerns, outcomes.
4) Insights: overall sentiment (Positive/Neutral/Negative), and top 3–6 topics and keywords.
5) COACHING ANALYSIS (Critical - be thorough and constructive):
   - overallScore: 1-100 rating of call quality
   - strengths: What the agent did well (2-5 points)
   - weaknesses: What went wrong or could be improved (2-5 points)
   - missedOpportunities: Sales/support opportunities the agent missed
   - customerHandling: Score 1-100 + feedback on empathy, patience, listening
   - communicationQuality: Score 1-100 + feedback on clarity, tone, professionalism
   - pitchEffectiveness: Score 1-100 + feedback on value proposition, persuasion (if sales)
   - objectionHandling: Score 1-100 + feedback on addressing concerns
   - improvementSuggestions: Specific actionable tips to improve (3-6 suggestions)
   - scriptRecommendations: Better phrases/scripts the agent should use
   - redFlags: Any serious issues (rude behavior, misinformation, compliance issues)
   - coachingSummary: 2-3 sentence overall coaching feedback
6) If any field is unknown, return empty string/array. Do not include extra keys.
`;

    // Use the processed (converted/compressed) audio
    const audioBase64 = processedAudio.buffer.toString('base64');
    const finalMimeType = processedAudio.mimeType;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: finalMimeType,
              data: audioBase64,
            },
          },
        ],
      },
    ];

    const generationConfig = {
      temperature: 0.25,
      topK: 32,
      topP: 0.95,
      responseMimeType: 'application/json'
    };

    // Retry up to 1 time if summary appears empty (balance quality vs latency)
    let text: string = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await model.generateContent({ contents, generationConfig });
      text = resp.response.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.summary === 'string' && parsed.summary.trim().length > 10) {
          break;
        }
      } catch {}
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'Model returned non-JSON', raw: text }, { status: 502 });
    }

    const d: any = data || {};
    const normalized = {
      language: typeof d.language === 'string' ? d.language : 'unknown',
      durationSec: typeof d.durationSec === 'number' ? d.durationSec : undefined,
      transcription: typeof d.transcription === 'string' ? d.transcription : '',
      summary: typeof d.summary === 'string' ? d.summary : '',
      mom: {
        participants: Array.isArray(d?.mom?.participants) ? d.mom.participants : [],
        decisions: Array.isArray(d?.mom?.decisions) ? d.mom.decisions : [],
        actionItems: Array.isArray(d?.mom?.actionItems) ? d.mom.actionItems : [],
        nextSteps: Array.isArray(d?.mom?.nextSteps) ? d.mom.nextSteps : [],
      },
      insights: {
        sentiment: typeof d?.insights?.sentiment === 'string' ? d.insights.sentiment : '',
        topics: Array.isArray(d?.insights?.topics) ? d.insights.topics : [],
        keywords: Array.isArray(d?.insights?.keywords) ? d.insights.keywords : [],
      },
      coaching: {
        overallScore: typeof d?.coaching?.overallScore === 'number' ? d.coaching.overallScore : 0,
        strengths: Array.isArray(d?.coaching?.strengths) ? d.coaching.strengths : [],
        weaknesses: Array.isArray(d?.coaching?.weaknesses) ? d.coaching.weaknesses : [],
        missedOpportunities: Array.isArray(d?.coaching?.missedOpportunities) ? d.coaching.missedOpportunities : [],
        customerHandling: {
          score: typeof d?.coaching?.customerHandling?.score === 'number' ? d.coaching.customerHandling.score : 0,
          feedback: typeof d?.coaching?.customerHandling?.feedback === 'string' ? d.coaching.customerHandling.feedback : '',
        },
        communicationQuality: {
          score: typeof d?.coaching?.communicationQuality?.score === 'number' ? d.coaching.communicationQuality.score : 0,
          feedback: typeof d?.coaching?.communicationQuality?.feedback === 'string' ? d.coaching.communicationQuality.feedback : '',
        },
        pitchEffectiveness: {
          score: typeof d?.coaching?.pitchEffectiveness?.score === 'number' ? d.coaching.pitchEffectiveness.score : 0,
          feedback: typeof d?.coaching?.pitchEffectiveness?.feedback === 'string' ? d.coaching.pitchEffectiveness.feedback : '',
        },
        objectionHandling: {
          score: typeof d?.coaching?.objectionHandling?.score === 'number' ? d.coaching.objectionHandling.score : 0,
          feedback: typeof d?.coaching?.objectionHandling?.feedback === 'string' ? d.coaching.objectionHandling.feedback : '',
        },
        improvementSuggestions: Array.isArray(d?.coaching?.improvementSuggestions) ? d.coaching.improvementSuggestions : [],
        scriptRecommendations: Array.isArray(d?.coaching?.scriptRecommendations) ? d.coaching.scriptRecommendations : [],
        redFlags: Array.isArray(d?.coaching?.redFlags) ? d.coaching.redFlags : [],
        coachingSummary: typeof d?.coaching?.coachingSummary === 'string' ? d.coaching.coachingSummary : '',
      },
    };

    return NextResponse.json(normalized);
  } catch (e: any) {
    // Log full error details for troubleshooting during development
    console.error('Transcribe API error:', e);
    return NextResponse.json({
      error: e?.message || 'Unexpected error',
      stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined,
    }, { status: 500 });
  }
}


