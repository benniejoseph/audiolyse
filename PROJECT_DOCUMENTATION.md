# CallTranscribe: AI-Powered Conversation Intelligence Platform

## Executive Summary
CallTranscribe is an advanced conversation intelligence platform designed to transform raw audio calls into actionable business insights. By leveraging Google's Gemini 1.5 Flash AI model, it provides automated quality assurance, sales coaching, and predictive analytics for support and sales teams.

The platform handles bulk audio processing, offers deep behavioral analysis, and detects critical risks like forced selling or customer churn indicators, all within a modern, secure web interface.

---

## 🚀 Key Capabilities

### 1. Bulk Processing Engine
- **Multi-File Analysis**: Upload and analyze dozens of calls simultaneously.
- **Dashboard View**: Get a high-level view of team performance, identifying top performers and at-risk calls at a glance.
- **Export capabilities**: Download full reports, transcripts, or coaching summaries in JSON/Text formats.

### 2. Deep Conversation Analytics
- **Talk/Listen Ratios**: Visual breakdown of agent vs. customer speaking time and silence.
- **Pace Analysis**: WPM (Words Per Minute) tracking to ensure clear communication.
- **Interruption Tracking**: Identifies who is dominating the conversation.
- **Question Analysis**: Distinguishes between Open (discovery) and Closed (confirmation) questions.

### 3. AI Coaching & Quality Assurance
- **Automated Scoring (0-100)**: Objective scoring across 8 categories:
  - Opening & Greeting
  - Discovery & Needs Analysis
  - Solution Presentation
  - Objection Handling
  - Closing & Next Steps
  - Empathy & Tone
  - Clarity
  - Compliance
- **Forced Sale Detection**: A critical compliance feature that flags manipulative sales tactics (Mild, Moderate, Severe) and protects brand reputation.
- **Script Recommendations**: AI-generated "better phrasing" for specific situations encountered in the call.

### 4. Predictive Intelligence
- **Conversion Probability**: Likelihood of the deal closing based on conversation cues.
- **Churn Risk**: Early warning system for customers likely to leave.
- **Escalation Prediction**: Identifies interactions likely to result in formal complaints.

---

## 🛠 Feature Deep Dive

### The Dashboard
- **Aggregate Metrics**: View average team scores, conversion rates, and red flag counts.
- **Status Tracking**: Real-time progress of file processing.
- **Forced Sale Alerts**: Immediate visual warnings for compliance violations.

### The Analysis View
The detailed analysis is split into focused tabs:

#### 📊 Metrics Tab
- **Visual Timeline**: See the call phases (Greeting -> Discovery -> Closing).
- **Customer Profile**: AI-inferred personality type (e.g., "Analytical," "Price-Sensitive") to help agents tailor future follow-ups.
- **Flow Analysis**: Segment-by-segment quality ratings.

#### 🎯 Coaching Tab
- **Strengths & Weaknesses**: Bulleted lists of what went well and what didn't.
- **Missed Opportunities**: Sales or service moments the agent failed to capitalize on.
- **Actionable Feedback**: Specific advice for improvement, not just generic tips.

#### ⚡ Key Moments Tab
- **Sentiment Timeline**: A chronological feed of key events (Complaints, Compliments, Pricing Discussions).
- **Importance Tagging**: Events are rated High/Medium/Low priority.
- **Action Items**: Auto-generated to-do lists for Agents, Managers, and Follow-up.

#### 📝 Transcript & Summary
- **Full Transcription**: Speaker-labeled text of the entire conversation.
- **Smart Summary**: Executive brief of the call.
- **MOM (Minutes of Meeting)**: Structured extraction of participants, decisions, and next steps.

---

## 💻 User Experience Features
- **Persistent Audio Player**: Listen to the call while navigating different analysis tabs. The player floats when you scroll or move pages.
- **Data Retention**: Analysis results persist during the session until explicitly cleared.
- **Contextual Help**: Built-in "How to Read Analysis" guide explaining every metric for non-technical users.
- **Consistency Engine**: Tuned AI parameters ensure that analyzing the same call twice yields consistent, reproducible results.

---

## 🔒 Technical Specifications
- **AI Model**: Google Gemini 1.5 Flash (Multimodal).
- **Architecture**: Next.js 14 (React Server Components) for high performance.
- **Security**: Audio processed in-memory (streams) without permanent storage on intermediate servers.
- **Deployment**: Edge-optimized via Vercel.
- **Audio Support**: Native support for MP3, WAV, M4A, AAC, MPEG, and more.

---

## 💼 Business Value
1.  **Reduce QA Costs**: Automate the monitoring of 100% of calls instead of a random 2% sample.
2.  **Accelerate Onboarding**: New agents learn faster with instant, objective feedback after every mock or real call.
3.  **Revenue Intelligence**: Understand *why* deals are lost and identifying the "winning behaviors" of top performers.
4.  **Risk Mitigation**: Catch compliance issues and forced sales tactics before they lead to lawsuits or refunds.

