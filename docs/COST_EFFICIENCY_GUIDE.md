# 💰 COST EFFICIENCY GUIDE
## Maximizing Profit Margins for Audiolyse

**Last Updated:** January 2026  
**Goal:** Maintain 70%+ gross margins while scaling

---

## 📊 CURRENT COST STRUCTURE

### Fixed Costs (Monthly)
| Service | Current | At Scale (1000 users) | Notes |
|---------|---------|----------------------|-------|
| Vercel | $0 | $20 | Free tier → Pro |
| Supabase | $0 | $25 | Free tier → Pro |
| Domain | ₹1,000/yr | ₹1,000/yr | Fixed |
| **Total Fixed** | **~₹0** | **~₹4,000** | Negligible |

### Variable Costs (Per Call Analysis)
| Cost Component | Per Call | At 10K calls/month |
|----------------|----------|-------------------|
| Gemini API (transcription + analysis) | ₹2-5 | ₹20,000-50,000 |
| Supabase Storage (10MB audio) | ₹0.15 | ₹1,500 |
| Supabase Database ops | ₹0.10 | ₹1,000 |
| Email (Resend) | ₹0.02 | ₹200 |
| **Total Per Call** | **₹2.5-5.5** | **₹22,700-52,700** |

### Revenue Per Call
| Tier | Price/Call | Gross Margin |
|------|-----------|--------------|
| Free | ₹0 | -100% (loss) |
| PAYG (₹5/credit) | ₹5 | 0-50% |
| Individual (₹499/100 calls) | ₹5 | 0-50% |
| Team (₹1999/600 calls) | ₹3.33 | -50% to +25% |
| Enterprise (₹4999/2000 calls) | ₹2.50 | -100% to 0% |

**⚠️ PROBLEM: Current pricing barely covers costs!**

---

## 🎯 COST OPTIMIZATION STRATEGIES

### Strategy 1: AI Cost Reduction (Save 40-60%)

#### 1.1 Use Gemini Flash for Basic Operations
```typescript
// lib/ai/model-selector.ts
const MODEL_CONFIG = {
  transcription: 'gemini-1.5-flash', // Cheaper, fast
  basicAnalysis: 'gemini-1.5-flash',
  detailedCoaching: 'gemini-1.5-pro', // Only for premium features
};

// Cost comparison:
// Gemini 1.5 Flash: $0.075/1M input tokens
// Gemini 1.5 Pro: $1.25/1M input tokens
// Savings: 94% on most operations!
```

#### 1.2 Implement Prompt Caching
```typescript
// Cache repeated prompts (system prompts, industry templates)
// Gemini context caching can save 75% on cached tokens

const CACHED_PROMPTS = {
  healthcare: { cacheId: 'healthcare-v1', expiresAt: '...' },
  sales: { cacheId: 'sales-v1', expiresAt: '...' },
};
```

#### 1.3 Optimize Token Usage
```typescript
// Before: Send full transcript + all instructions every time
// After: Smart chunking and summarization

function optimizeTranscript(transcript: string): string {
  // 1. Remove filler words ("um", "uh", "like")
  // 2. Compress repetitive sections
  // 3. Keep only speaker-relevant parts for coaching
  // Reduces tokens by 30-40%
}
```

#### 1.4 Batch Processing (Off-Peak)
```typescript
// Process non-urgent analysis during off-peak hours
// Google Cloud pricing varies by time
// Schedule batch jobs for 2-6 AM IST for potential discounts
```

**Expected Savings: ₹1-2 per call (40-60%)**

---

### Strategy 2: Storage Optimization (Save 50-70%)

#### 2.1 Audio Compression
```typescript
// Convert all uploads to Opus codec
// MP3 (10MB) → Opus (2-3MB) for same quality
// Savings: 70% storage costs

import { createFFmpeg } from '@ffmpeg/ffmpeg';

async function compressAudio(file: File): Promise<Blob> {
  const ffmpeg = createFFmpeg();
  await ffmpeg.load();
  // Convert to Opus at 48kbps (good for voice)
  await ffmpeg.run('-i', 'input', '-c:a', 'libopus', '-b:a', '48k', 'output.opus');
  return new Blob([ffmpeg.FS('readFile', 'output.opus')]);
}
```

#### 2.2 Tiered Storage Strategy
```typescript
// Hot storage: Recent 7 days (Supabase default)
// Cold storage: Older files (Supabase archive or delete)

const STORAGE_TIERS = {
  free: {
    keepAudio: false, // Don't store audio for free tier
    keepTranscript: true,
    retentionDays: 7,
  },
  paid: {
    keepAudio: true,
    archiveAfter: 30, // Move to cold storage
    deleteAudioAfter: 90, // Keep only transcript
  },
};
```

#### 2.3 Don't Store Audio for Free Tier
```typescript
// Free tier: Process audio → return results → discard audio
// Huge savings: 0 storage cost for free users

if (org.subscription_tier === 'free') {
  // Skip audio upload to storage
  // Only store analysis JSON
}
```

**Expected Savings: ₹0.10-0.15 per call (50-70%)**

---

### Strategy 3: Smart Free Tier Management

#### 3.1 Limit Free Tier Features
```typescript
const FREE_TIER_LIMITS = {
  maxFileSizeMb: 5, // Smaller files = less processing
  maxDurationMin: 5, // Short calls only
  analysisDepth: 'basic', // No detailed coaching
  noAudioStorage: true, // No replay
  noExport: true, // No PDF/JSON export
  noBulkUpload: true,
  dailyLimit: 3, // Reduce from 10 to 3
};
```

#### 3.2 Conversion-Focused Free Tier
```typescript
// Show premium features but lock them
// "Upgrade to see detailed coaching insights"
// "Your conversation had 5 key moments - upgrade to view"

// This costs nothing but drives conversions
```

#### 3.3 Time-Limited Full Access Trial
```typescript
// Instead of forever-free with limits:
// 7-day full access trial → Then limited free
// Users experience full value → More conversions
```

**Expected Impact: Reduce free tier costs by 60%, increase conversions by 40%**

---

### Strategy 4: Pricing Optimization

#### 4.1 Increase PAYG Price
```typescript
// Current: ₹5/credit (barely profitable)
// Recommended: ₹10-15/credit

// Justification:
// - Competitors charge $0.25-0.50/minute
// - ₹15 for 5-min call = ₹3/min = competitive
// - Maintains 60%+ margin
```

#### 4.2 Reduce Calls in Monthly Plans
```typescript
// Current pricing is too generous
const OPTIMIZED_LIMITS = {
  individual: {
    price: 499, // Same price
    calls: 50, // Was 100, now 50
    perCallCost: 9.98, // Better margin
  },
  team: {
    price: 1999,
    calls: 300, // Was 600, now 300
    perCallCost: 6.66, // Better margin
  },
  enterprise: {
    price: 4999,
    calls: 1000, // Was 2000, now 1000
    perCallCost: 5.00, // Better margin
  },
};
```

#### 4.3 Add Usage-Based Overage
```typescript
// When user exceeds limit, charge per-call rate
// Instead of blocking, upsell!

const OVERAGE_RATES = {
  individual: 15, // ₹15/extra call
  team: 10, // ₹10/extra call
  enterprise: 7, // ₹7/extra call
};
```

#### 4.4 Annual Pricing with Higher Discount
```typescript
// Encourage annual with 25% discount (not 20%)
// Cash flow benefit > margin hit
// Reduces churn (12-month commitment)
```

**Expected Impact: Increase average margin from 20% to 60%**

---

### Strategy 5: Infrastructure Efficiency

#### 5.1 Edge Functions for Heavy Lifting
```typescript
// Move AI processing to Vercel Edge or Supabase Edge Functions
// Benefits:
// - Faster cold starts
// - Better concurrency
// - Regional processing (lower latency)
```

#### 5.2 Aggressive Caching
```typescript
// Cache these API responses (SWR/React Query):
// - Organization data (5 min)
// - User profile (5 min)
// - Dashboard stats (1 min)
// - Call history list (30 sec)

// Reduces Supabase read operations by 80%
```

#### 5.3 Database Query Optimization
```sql
-- Add proper indexes (one-time)
CREATE INDEX CONCURRENTLY idx_calls_org_created 
ON call_analyses(organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_calls_score 
ON call_analyses(overall_score) WHERE overall_score IS NOT NULL;

-- Use materialized views for dashboards
CREATE MATERIALIZED VIEW org_stats AS
SELECT 
  organization_id,
  COUNT(*) as total_calls,
  AVG(overall_score) as avg_score,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_calls
FROM call_analyses
GROUP BY organization_id;

-- Refresh hourly (not on every dashboard load)
```

**Expected Savings: 30-40% on database costs**

---

## 💵 REVISED UNIT ECONOMICS

### Cost Per Call (After Optimization)
| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| AI Processing | ₹3.50 | ₹1.50 | 57% |
| Storage | ₹0.15 | ₹0.05 | 67% |
| Database | ₹0.10 | ₹0.05 | 50% |
| Email | ₹0.02 | ₹0.02 | 0% |
| **Total** | **₹3.77** | **₹1.62** | **57%** |

### Revenue Per Call (After Optimization)
| Tier | Old Price | New Price | New Cost | Margin |
|------|-----------|-----------|----------|--------|
| PAYG | ₹5 | ₹12 | ₹1.62 | **86%** |
| Individual | ₹5 | ₹10 | ₹1.62 | **84%** |
| Team | ₹3.33 | ₹6.66 | ₹1.62 | **76%** |
| Enterprise | ₹2.50 | ₹5.00 | ₹1.62 | **68%** |

**Target: Maintain 70%+ gross margin across all tiers**

---

## 📈 PROFIT MAXIMIZATION LEVERS

### Lever 1: Upsell on Limits
```typescript
// When user hits 80% of limit:
// 1. Show upgrade banner
// 2. Send email with comparison
// 3. Offer 1-month discount

// When user hits 100%:
// 1. Offer overage option
// 2. Show clear value of upgrade
// 3. Easy one-click upgrade
```

### Lever 2: Feature Gating
```typescript
// Premium features that cost nothing extra:
// - PDF Export (already built)
// - Detailed coaching (same AI, different prompt)
// - Historical trends (just queries)
// - Team comparisons (just queries)
// - Custom branding (CSS only)

// Gate these to drive upgrades, not because they cost more
```

### Lever 3: Expansion Revenue
```typescript
// Track and maximize:
// - Seat expansion (add team members)
// - Storage upgrades
// - API access add-on
// - Priority support add-on
// - Custom integrations
```

### Lever 4: Reduce Churn
```typescript
// Churn prevention saves more than acquisition
// Implement:
// - Usage monitoring alerts
// - Proactive outreach for declining usage
// - Annual plan incentives
// - Feature adoption tracking
// - Regular check-ins for enterprise
```

---

## 🔧 IMPLEMENTATION PRIORITY

### Week 1: Quick Wins (₹0 cost)
- [ ] Switch to Gemini Flash for all operations
- [ ] Reduce free tier daily limit (10 → 3)
- [ ] Reduce free tier file size (20MB → 5MB)
- [ ] Add overage pricing option
- [ ] Don't store audio for free tier

### Week 2-3: Medium Effort
- [ ] Implement audio compression (Opus)
- [ ] Add aggressive caching
- [ ] Optimize database queries
- [ ] Implement storage tiering

### Month 2: Pricing Changes
- [ ] Increase PAYG to ₹12/credit
- [ ] Reduce call limits in plans
- [ ] Add 25% annual discount
- [ ] Implement upgrade prompts

### Ongoing: Monitor & Optimize
- [ ] Weekly cost review
- [ ] Monthly pricing analysis
- [ ] Quarterly vendor negotiation

---

## 📊 MONITORING DASHBOARD

### Key Metrics to Track
```typescript
const COST_METRICS = {
  // Per-call metrics
  avgCostPerCall: 'Total costs / Total calls',
  avgRevenuePerCall: 'Total revenue / Total calls',
  grossMarginPerCall: '(Revenue - Cost) / Revenue',
  
  // Aggregate metrics
  monthlyGrossMargin: 'Target: 70%+',
  customerAcquisitionCost: 'Marketing spend / New customers',
  lifetimeValue: 'Avg revenue per customer * Avg lifetime',
  ltvCacRatio: 'Target: 3:1 or higher',
  
  // Efficiency metrics
  revenuePerEmployee: 'Track as you scale',
  infrastructureCostRatio: 'Infra costs / Revenue (Target: <10%)',
};
```

### Alert Thresholds
```typescript
const ALERTS = {
  grossMarginBelow60: 'CRITICAL: Review pricing',
  costPerCallAbove3: 'WARNING: Optimize AI usage',
  freeUserCostAbove1: 'WARNING: Tighten free tier',
  conversionBelow3Percent: 'WARNING: Review free tier value',
};
```

---

## 🎯 FINANCIAL PROJECTIONS

### Year 1 Target
| Metric | Target |
|--------|--------|
| Paid Users | 500 |
| Avg MRR/User | ₹800 |
| Monthly Revenue | ₹4,00,000 |
| Gross Margin | 70% |
| Monthly Profit | ₹2,80,000 |
| Annual Profit | ₹33,60,000 |

### Year 2 Target
| Metric | Target |
|--------|--------|
| Paid Users | 2,000 |
| Avg MRR/User | ₹1,000 |
| Monthly Revenue | ₹20,00,000 |
| Gross Margin | 75% |
| Monthly Profit | ₹15,00,000 |
| Annual Profit | ₹1,80,00,000 |

### Break-Even Analysis
```
Fixed Costs: ~₹50,000/month (team, tools)
Variable Cost per Call: ₹1.62
Avg Revenue per Call: ₹6

Contribution Margin: ₹4.38/call

Break-even calls/month: 50,000 / 4.38 = 11,416 calls
At 50 calls/user/month = 228 paid users

With 500 paid users = ₹1,09,500 profit/month
```

---

## ✅ ACTION ITEMS CHECKLIST

### Immediate (This Week)
- [ ] Switch all AI calls to Gemini Flash
- [ ] Update free tier limits
- [ ] Remove audio storage for free tier
- [ ] Add cost tracking to dashboard

### Short-term (This Month)
- [ ] Implement audio compression
- [ ] Add caching layer
- [ ] Create cost monitoring alerts
- [ ] Plan pricing changes

### Medium-term (This Quarter)
- [ ] Launch new pricing
- [ ] Implement overage billing
- [ ] Add upgrade prompts
- [ ] Negotiate vendor rates

---

*Review this document monthly. Adjust strategies based on actual metrics.*
