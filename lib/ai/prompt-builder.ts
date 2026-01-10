/**
 * AI Prompt Builder
 * 
 * Builds comprehensive, context-aware prompts for call analysis
 * by combining industry templates with organization-specific context.
 */

import { getIndustryPrompt, type IndustryPrompt, type IndustryType } from './industry-prompts';

export interface OrganizationContext {
  id: string;
  name: string;
  industry: string;
  aiSettings?: {
    context?: string;
    products?: string[];
    competitors?: string[];
    guidelines?: string;
    complianceScripts?: string[];
    customTerminology?: string[];
    scoringPreferences?: {
      strictness?: 'lenient' | 'moderate' | 'strict';
      focusAreas?: string[];
    };
    customerContext?: {
      typicalProfiles?: string[];
      commonIssues?: string[];
      preferredTone?: 'formal' | 'friendly' | 'professional';
    };
  };
}

export interface PromptConfig {
  organization?: OrganizationContext;
  callType?: 'sales' | 'support' | 'consultation' | 'follow_up' | 'general';
  language?: string;
  additionalInstructions?: string;
}

/**
 * Build the complete analysis prompt
 */
export function buildAnalysisPrompt(config: PromptConfig): string {
  const industryId = (config.organization?.industry?.toLowerCase().replace(/[^a-z_]/g, '_') || 'general') as IndustryType;
  const industryPrompt = getIndustryPrompt(industryId);
  const settings = config.organization?.aiSettings || {};
  
  // Build the prompt sections
  const sections: string[] = [];
  
  // 1. Base role and mindset
  sections.push(buildRolePreamble(settings.scoringPreferences?.strictness || 'strict'));
  
  // 2. Industry context
  sections.push(buildIndustrySection(industryPrompt));
  
  // 3. Organization context
  if (config.organization) {
    sections.push(buildOrganizationSection(config.organization));
  }
  
  // 4. Products and services
  if (settings.products?.length) {
    sections.push(buildProductsSection(settings.products));
  }
  
  // 5. Competitors
  if (settings.competitors?.length) {
    sections.push(buildCompetitorsSection(settings.competitors));
  }
  
  // 6. Compliance scripts
  if (settings.complianceScripts?.length) {
    sections.push(buildComplianceSection(settings.complianceScripts, industryPrompt));
  }
  
  // 7. Custom terminology
  const allTerminology = [
    ...industryPrompt.keyTerminology,
    ...(settings.customTerminology || []),
  ];
  sections.push(buildTerminologySection(allTerminology));
  
  // 8. Customer context
  if (settings.customerContext) {
    sections.push(buildCustomerContextSection(settings.customerContext));
  }
  
  // 9. Call type specific instructions
  if (config.callType && config.callType !== 'general') {
    sections.push(buildCallTypeSection(config.callType));
  }
  
  // 10. Language handling
  sections.push(buildLanguageSection(config.language));
  
  // 11. Evaluation criteria
  sections.push(buildEvaluationSection(industryPrompt, settings.scoringPreferences));
  
  // 12. Additional instructions
  if (config.additionalInstructions) {
    sections.push(`\n--- ADDITIONAL INSTRUCTIONS ---\n${config.additionalInstructions}\n`);
  }
  
  // 13. Guidelines from org settings
  if (settings.guidelines) {
    sections.push(`\n--- SPECIFIC GUIDELINES ---\n${settings.guidelines}\n`);
  }
  
  // 14. Output format
  sections.push(buildOutputFormat());
  
  // 15. Scoring guidelines
  sections.push(buildScoringGuidelines(settings.scoringPreferences?.strictness || 'strict'));
  
  return sections.join('\n');
}

function buildRolePreamble(strictness: 'lenient' | 'moderate' | 'strict'): string {
  const strictnessDescriptions = {
    lenient: 'fair and balanced',
    moderate: 'moderately critical',
    strict: 'EXTREMELY STRICT and CRITICAL',
  };
  
  return `
You are an ${strictnessDescriptions[strictness]} call quality analyst with very high standards. You analyze calls to help agents improve their performance and deliver better customer experiences.
`;
}

function buildIndustrySection(industry: IndustryPrompt): string {
  return `
--- INDUSTRY CONTEXT: ${industry.name} ---
${industry.context}

KEY EVALUATION CRITERIA FOR THIS INDUSTRY:
${industry.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

COMPLIANCE REQUIREMENTS:
${industry.complianceRequirements.map(c => `• ${c}`).join('\n')}

RED FLAGS TO WATCH FOR:
${industry.redFlagIndicators.map(r => `⚠️ ${r}`).join('\n')}

QUALITY MARKERS TO RECOGNIZE:
${industry.qualityMarkers.map(q => `✓ ${q}`).join('\n')}
`;
}

function buildOrganizationSection(org: OrganizationContext): string {
  const parts = [`\n--- ORGANIZATION: ${org.name} ---`];
  
  if (org.aiSettings?.context) {
    parts.push(`\nCOMPANY BACKGROUND:\n${org.aiSettings.context}`);
  }
  
  return parts.join('\n');
}

function buildProductsSection(products: string[]): string {
  return `
--- PRODUCTS & SERVICES ---
The company offers these products/services. Listen for mentions and evaluate how well the agent presents them:
${products.map(p => `• ${p}`).join('\n')}

Evaluate:
- Product knowledge accuracy
- Appropriate product matching to customer needs
- Cross-sell/upsell opportunities identified
- Feature explanation clarity
`;
}

function buildCompetitorsSection(competitors: string[]): string {
  return `
--- COMPETITOR AWARENESS ---
Known competitors to watch for in the conversation:
${competitors.map(c => `• ${c}`).join('\n')}

When competitors are mentioned, evaluate:
- Professional handling (no disparagement)
- Value differentiation articulation
- Comparison accuracy
- Competitive positioning effectiveness
`;
}

function buildComplianceSection(scripts: string[], industry: IndustryPrompt): string {
  const allCompliance = [
    ...industry.complianceRequirements,
    ...scripts,
  ];
  
  return `
--- COMPLIANCE REQUIREMENTS ---
The agent MUST adhere to these compliance requirements. Check if they were followed:
${allCompliance.map((s, i) => `${i + 1}. ${s}`).join('\n')}

COMPLIANCE SCORING:
- Verify each requirement was met
- Note any deviations or omissions
- Compliance score should reflect adherence to these specific requirements
- Any compliance failure is a RED FLAG
`;
}

function buildTerminologySection(terminology: string[]): string {
  const uniqueTerms = [...new Set(terminology)];
  return `
--- KEY TERMINOLOGY ---
Listen for and understand these industry/company-specific terms:
${uniqueTerms.slice(0, 30).join(', ')}

Note any misuse or misunderstanding of terminology in the analysis.
`;
}

function buildCustomerContextSection(context?: {
  typicalProfiles?: string[];
  commonIssues?: string[];
  preferredTone?: 'formal' | 'friendly' | 'professional';
}): string {
  const parts = ['\n--- CUSTOMER CONTEXT ---'];
  
  if (context?.typicalProfiles?.length) {
    parts.push(`\nTypical Customer Profiles:\n${context.typicalProfiles.map(p => `• ${p}`).join('\n')}`);
  }
  
  if (context?.commonIssues?.length) {
    parts.push(`\nCommon Customer Issues:\n${context.commonIssues.map(i => `• ${i}`).join('\n')}`);
  }
  
  if (context?.preferredTone) {
    parts.push(`\nPreferred Communication Tone: ${context.preferredTone}`);
  }
  
  return parts.join('\n');
}

function buildCallTypeSection(callType: 'sales' | 'support' | 'consultation' | 'follow_up'): string {
  const callTypeInstructions = {
    sales: `
--- SALES CALL ANALYSIS ---
Focus on:
- Discovery and needs assessment quality
- Value proposition articulation
- Objection handling effectiveness
- Closing technique appropriateness
- Pipeline advancement achieved
- Next steps clarity
`,
    support: `
--- SUPPORT CALL ANALYSIS ---
Focus on:
- Issue identification speed
- Problem resolution effectiveness
- Technical explanation clarity
- Escalation appropriateness
- Customer satisfaction achieved
- Follow-up commitment
`,
    consultation: `
--- CONSULTATION CALL ANALYSIS ---
Focus on:
- Needs understanding depth
- Advisory quality
- Recommendation appropriateness
- Trust building
- Expertise demonstration
- Action plan clarity
`,
    follow_up: `
--- FOLLOW-UP CALL ANALYSIS ---
Focus on:
- Context retention from previous interactions
- Progress update delivery
- Commitment follow-through
- Relationship maintenance
- Next steps agreement
- Value continuation
`,
  };
  
  return callTypeInstructions[callType];
}

function buildLanguageSection(language?: string): string {
  return `
--- LANGUAGE HANDLING ---
The audio may be in English, Hindi, Hinglish (Hindi-English mix), or ${language || 'other languages'}.

Instructions:
- Transcribe in the original language spoken
- Use speaker labels: A: for Agent, C: for Customer
- Note code-switching between languages
- Maintain meaning accuracy in analysis
- Identify sentiment across language variations
`;
}

function buildEvaluationSection(
  industry: IndustryPrompt, 
  preferences?: {
    strictness?: 'lenient' | 'moderate' | 'strict';
    focusAreas?: string[];
  }
): string {
  const focusAreas = preferences?.focusAreas?.length 
    ? preferences.focusAreas 
    : industry.evaluationCriteria.slice(0, 5);
  
  return `
--- EVALUATION FOCUS AREAS ---
Prioritize evaluation of:
${focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

Common objections in this industry to watch for:
${industry.commonObjections.map(o => `• ${o}`).join('\n')}

Assess how well these objections are handled if they arise.
`;
}

function buildOutputFormat(): string {
  return `
--- OUTPUT FORMAT ---
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
  "actionItems": { "forAgent": string[], "forManager": string[], "forFollowUp": string[] },
  "industrySpecific": { "complianceScore": number, "complianceNotes": string[], "industryBestPractices": { "followed": string[], "missed": string[] } }
}

IMPORTANT: For redFlags array - if there are no red flags, return an EMPTY ARRAY []. Do NOT return ["None detected"] or ["None"] or similar.
`;
}

function buildScoringGuidelines(strictness: 'lenient' | 'moderate' | 'strict'): string {
  const guidelines = {
    lenient: `
--- SCORING GUIDELINES (BALANCED) ---
- 90-100: EXCEPTIONAL - Outstanding performance with minimal issues
- 80-89: VERY GOOD - Strong performance with minor areas for improvement
- 70-79: GOOD - Solid performance meeting expectations
- 60-69: SATISFACTORY - Acceptable but with noticeable improvement areas
- 50-59: NEEDS IMPROVEMENT - Several issues requiring attention
- Below 50: POOR - Significant concerns requiring immediate action
`,
    moderate: `
--- SCORING GUIDELINES (MODERATE) ---
- 90-100: EXCEPTIONAL - Flawless execution, very rare
- 80-89: VERY GOOD - Minor issues only, mostly excellent
- 70-79: GOOD - Solid performance with some areas for improvement
- 60-69: AVERAGE - Did the job but nothing special
- 50-59: BELOW AVERAGE - Significant issues needing training
- Below 50: POOR - Serious concerns, immediate coaching needed
`,
    strict: `
--- SCORING GUIDELINES (STRICT) ---
- 90-100: EXCEPTIONAL - Flawless execution, exceeded expectations, built strong rapport, no missed opportunities. VERY RARE.
- 80-89: VERY GOOD - Minor issues only, mostly excellent
- 70-79: GOOD - Solid performance with some areas for improvement
- 60-69: AVERAGE - Did the job but nothing special, several improvement areas. THIS IS WHERE MOST CALLS SHOULD FALL.
- 50-59: BELOW AVERAGE - Significant issues that need training
- Below 50: POOR - Serious concerns, immediate coaching needed

CRITICAL EVALUATION MINDSET:
- BE HARSH. A score of 90+ should be EXCEPTIONAL and rare.
- Average performance = 60-70 score, NOT 80+.
- Always look for what the agent COULD have done better.
- If the agent missed ANY opportunity to help, upsell, or improve the experience, note it.
- Don't give the benefit of the doubt - judge based on what actually happened.
`,
  };
  
  return guidelines[strictness] + `

ANALYSIS REQUIREMENTS:
1. TRANSCRIPTION: Full verbatim transcription with speaker labels (A: for Agent, C: for Customer).
2. SUMMARY: 6-10 bullet points covering key discussion points.
3. CONVERSATION METRICS: Calculate talk ratios as percentages (e.g., 45 for 45%, NOT 0.45).
4. CONVERSATION SEGMENTS: Break call into distinct phases.
5. KEY MOMENTS: Identify 5-10 critical moments.
6. COACHING SCORES: Be consistent with the scoring guidelines above.
7. WEAKNESSES: Always find at least 2-3 areas for improvement, even in good calls.
8. MISSED OPPORTUNITIES: What could the agent have done better? Always find something.
9. RED FLAGS: Serious issues only. Leave array EMPTY [] if none exist.
10. FORCED SALE DETECTION: Check for high-pressure tactics, urgency manipulation.
11. PREDICTIONS: Be realistic, not optimistic.
12. ACTION ITEMS: Specific, actionable follow-ups.
13. INDUSTRY COMPLIANCE: Evaluate against industry-specific requirements.
`;
}

/**
 * Build a simple context string (backward compatible)
 */
export function buildSimpleContext(org: OrganizationContext): string {
  const parts: string[] = [];
  
  if (org.industry) {
    parts.push(`INDUSTRY CONTEXT: ${org.industry}`);
  }
  
  if (org.aiSettings?.context) {
    parts.push(`COMPANY CONTEXT: ${org.aiSettings.context}`);
  }
  
  if (org.aiSettings?.products?.length) {
    parts.push(`PRODUCTS/SERVICES: ${org.aiSettings.products.join(', ')}`);
  }
  
  if (org.aiSettings?.competitors?.length) {
    parts.push(`COMPETITORS: ${org.aiSettings.competitors.join(', ')}`);
  }
  
  if (org.aiSettings?.guidelines) {
    parts.push(`SPECIFIC GUIDELINES: ${org.aiSettings.guidelines}`);
  }
  
  return parts.join('\n\n');
}
