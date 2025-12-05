# LLM Project Context: CallTranscribe

**Role**: You are an expert Senior Full Stack Developer and AI Engineer onboarding to the `CallTranscribe` project.
**Goal**: Understand the architecture, data flow, and features to continue development using Gemini 3 or other models.

---

## 1. Project Overview
`CallTranscribe` is a Next.js 14 application that performs bulk audio analysis using Google Gemini 2.5 Pro. It ingests audio files, transcribes them, and performs deep behavioral analysis, coaching, and predictive modeling.

### Tech Stack
-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Global CSS (Tailwind-like utility classes + custom component styles in `app/globals.css`)
-   **AI**: `@google/generative-ai` (Gemini 2.5 Pro)
-   **Deployment**: Vercel (Edge/Serverless functions)

---

## 2. Core Architecture

### Frontend (`app/page.tsx`)
-   **State Management**: Uses `useState` for file lists, processing status, and results.
-   **Audio Persistence**: Implements a global `Audio()` ref to allow playback to continue across tab navigation. Includes a "Floating Audio Indicator" when the user navigates away from the player view.
-   **Data Retention**: Analysis results are kept in memory (`bulkResults` state) until the user explicitly clears them via "New Analysis".
-   **Components**:
    -   `ScoreRing`: SVG-based circular progress bar.
    -   `TalkRatioBar`: Visual distribution of Agent/Customer/Silence.
    -   `AudioPlayer`: Custom controls for the persistent audio instance.
    -   `FloatingAudioIndicator`: Sticky footer component for playback control.

### Backend (`app/api/transcribe/route.ts`)
-   **Runtime**: Node.js (needed for file buffer handling).
-   **Process**:
    1.  Receives `FormData` (audio file).
    2.  Checks file size (limit ~20MB).
    3.  Sends audio buffer + huge system prompt to Gemini 2.5 Pro.
    4.  **Consistency**: Uses `temperature: 0.1`, `topK: 20`, `topP: 0.85` for deterministic outputs.
    5.  **Normalization**: Heavily sanitizes the JSON response to ensure frontend stability (defaults `0` for missing numbers, `[]` for missing arrays).

### Key Data Structures (`ApiResult`)
The backend returns a strictly typed JSON object containing:
-   `transcription` & `summary`
-   `mom` (Minutes of Meeting)
-   `conversationMetrics` (Talk ratios, interruptions, WPM)
-   `insights` (Sentiment, topics)
-   `coaching` (8 category scores, strengths/weaknesses, **forcedSale** detection)
-   `keyMoments` (Timestamped events with sentiment)
-   `predictions` (Conversion probability, Churn risk)
-   `customerProfile` (Psychographic profiling)

---

## 3. Key Features & Logic

### Forced Sale Detection
-   **Logic**: The prompt specifically instructs the AI to detect pressure tactics (false urgency, ignoring "no").
-   **Schema**: Returns `{ detected: boolean, severity: 'none'|'mild'|'moderate'|'severe', indicators: string[], feedback: string }`.
-   **UI**: Displays specific warning cards in the "Coaching" tab and an alert banner on the Dashboard if high-severity cases are found.

### Bulk Processing
-   **Logic**: Sequential processing loop in frontend `handleBulkUpload` to manage API rate limits (implied by sequential `await`).
-   **UI**: Dashboard view aggregates stats (Avg Score, Red Flags) from all processed files.

### Help & Documentation
-   **Route**: `/help/page.tsx`
-   **Content**: Static guide explaining all metrics (layman terms).
-   **Integration**: Contextual links from the analysis dashboard point to specific anchors (e.g., `/help#metrics`).

---

## 4. Current State & Configuration
-   **Environment**: Requires `GOOGLE_GEMINI_API_KEY`.
-   **Styling**: Uses a dark/neon theme (`--bg: #0d0f1a`, `--accent: #7cffc7`).
-   **Linting**: Strict TypeScript checks.

## 5. Instructions for Future Development
1.  **Preserve Consistency**: Do not raise `temperature` above 0.2. The user values reproducibility.
2.  **Schema Integrity**: If adding new metrics, update `ApiResult` type in `page.tsx` AND the normalization logic in `route.ts`.
3.  **Audio Handling**: Always respect the global audio ref. Do not create new `Audio` instances for playback; reuse the existing ref to prevent overlapping audio.

