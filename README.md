# CallTranscribe

Bulk call transcription, analysis, and AI-powered coaching platform. Upload multiple call recordings to get detailed transcriptions, summaries, meeting minutes, and personalized coaching feedback on agent performance.

## Features

### 🎯 Bulk Call Analysis
- Upload and analyze multiple audio files simultaneously
- Process calls sequentially with real-time progress tracking
- View aggregate insights across all analyzed calls

### 📊 AI Coaching & Review
- **Overall Score**: 1-100 rating of call quality
- **Performance Metrics**:
  - Customer Handling (empathy, patience, listening)
  - Communication Quality (clarity, tone, professionalism)
  - Pitch Effectiveness (value proposition, persuasion)
  - Objection Handling (addressing concerns)
- **Strengths & Weaknesses**: What went well and what needs improvement
- **Missed Opportunities**: Sales/support chances the agent didn't capitalize on
- **Improvement Suggestions**: Specific actionable tips
- **Script Recommendations**: Better phrases and scripts to use
- **Red Flags**: Serious issues (rudeness, misinformation, compliance)

### 📝 Transcription & Analysis
- Full transcription with speaker identification
- Multilingual support: English, Hindi, and Hinglish
- Automatic language detection
- Call summary with key points
- Minutes of Meeting (MOM) extraction

### 💡 Insights Dashboard
- Sentiment analysis across all calls
- Common team strengths and weaknesses
- Training recommendations based on patterns
- Red flag tracking

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set the Gemini API key:

- In local dev, create `.env`:

```env
GOOGLE_GEMINI_API_KEY=YOUR_KEY_HERE
```

- On Vercel, add an Environment Variable `GOOGLE_GEMINI_API_KEY` with your key.

3. Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

- Push this repo to GitHub.
- Import the repo in Vercel.
- Set the env var `GOOGLE_GEMINI_API_KEY`.
- Deploy.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js
- **AI Model**: Google Gemini 2.5 Pro
- **Language**: TypeScript
- **Styling**: Custom CSS with glassmorphism design

## File Overview

- `app/page.tsx`: Main UI with bulk upload, dashboard, and detail views
- `app/api/transcribe/route.ts`: API endpoint that processes audio with Gemini
- `app/types.ts`: TypeScript type definitions
- `app/globals.css`: Styles with modern dark theme

## API Response Structure

```typescript
{
  language: string;
  durationSec?: number;
  transcription: string;
  summary: string;
  mom: {
    participants: string[];
    decisions: string[];
    actionItems: string[];
    nextSteps: string[];
  };
  insights: {
    sentiment: string;
    topics: string[];
    keywords: string[];
  };
  coaching: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    missedOpportunities: string[];
    customerHandling: { score: number; feedback: string };
    communicationQuality: { score: number; feedback: string };
    pitchEffectiveness: { score: number; feedback: string };
    objectionHandling: { score: number; feedback: string };
    improvementSuggestions: string[];
    scriptRecommendations: string[];
    redFlags: string[];
    coachingSummary: string;
  };
}
```

## Export Options

- **Full Analysis (JSON)**: Complete results for a single call
- **Transcript (TXT)**: Plain text transcription
- **Coaching Report (JSON)**: Detailed coaching feedback
- **Bulk Export**: All results and aggregate summary

## Notes / Limits

- For large files, browser upload size and Vercel limits may apply. Consider compressing audio to AAC/MP3 ~64–96 kbps.
- Calls are processed sequentially to avoid rate limiting.
- If Gemini returns non-JSON, the API responds with an error containing raw text for debug.

## License

MIT
