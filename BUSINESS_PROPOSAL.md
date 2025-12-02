# CallTranscribe - Medical Call Analysis Platform
## Business Proposal & Technical Design Document

---

## 1. Executive Summary

**Product**: AI-powered call analysis platform for medical/physiotherapy practices
**Target Client**: Medical companies, physiotherapy clinics, healthcare call centers
**Value Proposition**: Automated transcription, quality assurance, agent coaching, and compliance monitoring for patient-practitioner calls

---

## 2. Application Architecture

### 2.1 System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Upload    │  │  Dashboard  │  │   Reports   │  │   Admin     │        │
│  │   Portal    │  │   & Stats   │  │   Module    │  │   Panel     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Next.js API Routes)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth      │  │ Transcribe  │  │   Reports   │  │   Webhooks  │        │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │   Database   │ │  File Store  │ │   AI/ML      │
           │  (PostgreSQL)│ │  (S3/GCS)    │ │  (Gemini)    │
           └──────────────┘ └──────────────┘ └──────────────┘
```

### 2.2 Tech Stack Recommendation

| Layer | Technology | Reason |
|-------|------------|--------|
| **Frontend** | Next.js 14 + React | SEO, SSR, fast performance |
| **Backend** | Next.js API Routes / Node.js | Unified codebase, easy deployment |
| **Database** | PostgreSQL (Supabase/Neon) | Relational data, HIPAA-compliant options |
| **File Storage** | AWS S3 / Google Cloud Storage | Scalable, secure audio storage |
| **AI/ML** | Google Gemini 2.5 Pro | Multimodal (audio + text), cost-effective |
| **Auth** | Clerk / NextAuth.js | Role-based access, SSO support |
| **Hosting** | Vercel / AWS | Auto-scaling, edge deployment |
| **Queue** | Redis + BullMQ | Background job processing |
| **Monitoring** | Sentry + Datadog | Error tracking, performance |

---

## 3. Feature Roadmap

### Phase 1: MVP (Current + Essential) - 4-6 weeks

| Feature | Priority | Status |
|---------|----------|--------|
| Bulk audio upload | High | ✅ Done |
| Transcription (multilingual) | High | ✅ Done |
| AI Coaching & Scoring | High | ✅ Done |
| Call Summary & MOM | High | ✅ Done |
| Export (JSON/TXT) | Medium | ✅ Done |
| **User Authentication** | High | 🔲 Needed |
| **Role-Based Access Control** | High | 🔲 Needed |
| **Call Database Storage** | High | 🔲 Needed |
| **Agent Management** | High | 🔲 Needed |
| **Basic Dashboard Analytics** | High | 🔲 Needed |

### Phase 2: Core Platform - 6-8 weeks

| Feature | Description |
|---------|-------------|
| **Agent Profiles** | Create/manage agents, assign calls, track performance over time |
| **Team/Department Structure** | Organize agents by teams, supervisors, departments |
| **Historical Analytics** | Trends, score progression, performance graphs |
| **Search & Filters** | Search calls by date, agent, score, sentiment, keywords |
| **Call Tagging** | Custom tags for categorization (complaint, follow-up, new patient) |
| **Scheduled Reports** | Auto-email daily/weekly/monthly reports |
| **Notification System** | Alerts for red flags, low scores, compliance issues |
| **CRM Integration** | Connect with existing patient management systems |

### Phase 3: Advanced Features - 8-12 weeks

| Feature | Description |
|---------|-------------|
| **Real-time Call Monitoring** | Live transcription during calls |
| **Call Recording Integration** | Auto-ingest from phone systems (Twilio, Exotel) |
| **Compliance Checker** | Auto-flag HIPAA/medical compliance violations |
| **Custom Scoring Models** | Train scoring based on company's specific criteria |
| **AI Agent Assistant** | Real-time suggestions during calls |
| **Voice Analytics** | Tone, emotion, speech pace analysis |
| **Comparative Analysis** | Benchmark agents against top performers |
| **Training Module** | Auto-generated training based on weaknesses |
| **API Access** | Allow client to integrate with their systems |
| **White-label Option** | Custom branding for the client |

### Phase 4: Enterprise - Ongoing

| Feature | Description |
|---------|-------------|
| **Multi-tenant Architecture** | Support multiple clinics/branches |
| **SSO Integration** | SAML, LDAP, Active Directory |
| **Audit Logs** | Complete activity tracking for compliance |
| **Data Residency** | India-specific data storage (DPDP Act compliance) |
| **Mobile App** | iOS/Android for supervisors |
| **Predictive Analytics** | Predict patient churn, escalation risk |

---

## 4. User Workflow Design

### 4.1 User Roles

```
┌─────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   SUPER ADMIN (You/Technical Support)                       │
│       │                                                     │
│       ├── CLIENT ADMIN (Medical Company Owner)              │
│       │       │                                             │
│       │       ├── MANAGER/SUPERVISOR                        │
│       │       │       │                                     │
│       │       │       ├── TEAM LEAD                         │
│       │       │       │       │                             │
│       │       │       │       └── AGENT                     │
│       │       │       │                                     │
│       │       │       └── QA ANALYST                        │
│       │       │                                             │
│       │       └── REPORTS VIEWER (Read-only)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Permission Matrix

| Feature | Super Admin | Client Admin | Manager | Team Lead | Agent | QA |
|---------|-------------|--------------|---------|-----------|-------|-----|
| View All Calls | ✅ | ✅ | ✅ (team) | ✅ (team) | ❌ | ✅ |
| View Own Calls | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload Calls | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Scores | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Manage Agents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Export Data | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| System Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Billing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.3 Daily Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DAILY WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────┘

MORNING:
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Auto-import  │ ──► │   Queue for  │ ──► │   Process    │
  │ calls from   │     │   analysis   │     │   with AI    │
  │ phone system │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘

DAY:
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ QA reviews   │ ──► │  Flag issues │ ──► │  Supervisor  │
  │ auto-scored  │     │  & outliers  │     │  review      │
  │ calls        │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘

EVENING:
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Generate     │ ──► │  Send daily  │ ──► │  Schedule    │
  │ reports      │     │  summary     │     │  training    │
  └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 5. Cost Analysis (Monthly)

### 5.1 Infrastructure Costs

| Service | Provider | Estimated Cost (INR/month) |
|---------|----------|---------------------------|
| **Hosting** | Vercel Pro | ₹1,700 |
| **Database** | Supabase Pro (8GB) | ₹2,100 |
| **File Storage** | AWS S3 (100GB) | ₹200 |
| **CDN** | Cloudflare Pro | ₹1,700 |
| **Email** | SendGrid (10K emails) | ₹1,200 |
| **Monitoring** | Sentry (50K events) | ₹2,200 |
| **Domain + SSL** | Annual (amortized) | ₹100 |
| **SUBTOTAL** | | **₹9,200/month** |

### 5.2 AI/API Costs (Google Gemini)

**Gemini 2.5 Pro Pricing** (as of 2024):
- Input: $1.25 per 1M tokens
- Output: $5.00 per 1M tokens
- Audio: ~$0.00025 per second

| Call Volume | Avg Duration | Monthly AI Cost (INR) |
|-------------|--------------|----------------------|
| 500 calls | 5 min each | ₹3,000 - ₹5,000 |
| 1,000 calls | 5 min each | ₹6,000 - ₹10,000 |
| 2,500 calls | 5 min each | ₹15,000 - ₹25,000 |
| 5,000 calls | 5 min each | ₹30,000 - ₹50,000 |
| 10,000 calls | 5 min each | ₹60,000 - ₹1,00,000 |

### 5.3 Development Costs (One-Time)

| Phase | Scope | Time | Cost (INR) |
|-------|-------|------|------------|
| **Phase 1: MVP** | Auth, DB, Agent Mgmt, Dashboard | 4-6 weeks | ₹2,50,000 - ₹3,50,000 |
| **Phase 2: Core** | Analytics, Reports, Integrations | 6-8 weeks | ₹3,50,000 - ₹5,00,000 |
| **Phase 3: Advanced** | Real-time, Compliance, Training | 8-12 weeks | ₹5,00,000 - ₹8,00,000 |
| **Phase 4: Enterprise** | Multi-tenant, Mobile, Predictive | Ongoing | Custom quote |

**Total MVP to Production Ready**: ₹6,00,000 - ₹9,00,000

### 5.4 Maintenance & Support Costs (Monthly)

| Service | Description | Cost (INR/month) |
|---------|-------------|------------------|
| **Basic Support** | Bug fixes, security patches, email support | ₹15,000 - ₹25,000 |
| **Standard Support** | + Feature updates, priority support, SLA | ₹35,000 - ₹50,000 |
| **Premium Support** | + Dedicated manager, 24/7, custom features | ₹75,000 - ₹1,25,000 |

---

## 6. Pricing Strategy for Client

### Option A: Project-Based + Maintenance

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FIXED PROJECT PRICING                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   One-Time Development (Phase 1 + 2):         ₹6,00,000 - ₹8,00,000│
│                                                                     │
│   Monthly Maintenance:                        ₹25,000 - ₹40,000    │
│                                                                     │
│   AI Usage (pass-through):                    ₹5,000 - ₹50,000     │
│                                               (based on usage)      │
│                                                                     │
│   Infrastructure (pass-through):              ₹10,000 - ₹15,000    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Option B: SaaS Model (Per-Call Pricing)

| Plan | Calls/Month | Price/Month | Per-Call Rate |
|------|-------------|-------------|---------------|
| **Starter** | Up to 500 | ₹15,000 | ₹30/call |
| **Professional** | Up to 2,000 | ₹45,000 | ₹22.50/call |
| **Business** | Up to 5,000 | ₹90,000 | ₹18/call |
| **Enterprise** | Unlimited | Custom | Custom |

**Additional charges:**
- Setup fee: ₹50,000 (one-time)
- Custom integrations: ₹25,000 - ₹1,00,000 per integration
- Training: ₹10,000 per session

### Option C: Hybrid Model (Recommended)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED PRICING MODEL                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   YEAR 1:                                                           │
│   ─────────                                                         │
│   Setup + Development (Phase 1+2):            ₹5,00,000            │
│   Monthly Platform Fee:                       ₹30,000/month        │
│   Per-Call Processing:                        ₹15/call             │
│                                                                     │
│   Example: 1000 calls/month                                         │
│   = ₹30,000 + ₹15,000 = ₹45,000/month                              │
│   = ₹5,40,000/year + ₹5,00,000 setup                               │
│   = ₹10,40,000 Year 1 Total                                        │
│                                                                     │
│   ─────────────────────────────────────────────────────────────     │
│                                                                     │
│   YEAR 2+:                                                          │
│   ─────────                                                         │
│   Annual Platform Fee:                        ₹3,60,000/year       │
│   Per-Call Processing:                        ₹12/call             │
│   Priority Support Included                                         │
│                                                                     │
│   Example: 1000 calls/month                                         │
│   = ₹3,60,000 + ₹1,44,000 = ₹5,04,000/year                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Contract Terms (Recommended)

### 7.1 Payment Terms

| Milestone | Payment | When |
|-----------|---------|------|
| Contract Signing | 30% (₹1,50,000) | Day 0 |
| MVP Delivery | 30% (₹1,50,000) | Week 6 |
| Full Platform Launch | 30% (₹1,50,000) | Week 14 |
| Post-Launch (30 days) | 10% (₹50,000) | Week 18 |

### 7.2 SLA Commitments

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Response Time (Critical) | 2 hours |
| Response Time (Normal) | 24 hours |
| Bug Fix (Critical) | 24 hours |
| Bug Fix (Normal) | 5 business days |

### 7.3 What's Included

✅ Full source code ownership (after final payment)
✅ 3 months post-launch support
✅ Documentation & training
✅ Deployment & infrastructure setup
✅ Security audit (basic)
✅ DPDP Act compliance consultation

### 7.4 What's NOT Included

❌ Phone system integration (additional quote)
❌ Custom mobile app (additional quote)
❌ Third-party API costs (pass-through)
❌ Extended support beyond 3 months

---

## 8. ROI for Client

### Current State (Manual QA)
- QA Analyst salary: ₹30,000/month
- Calls reviewed manually: 50-100/day
- Time per call: 15-20 minutes
- Coverage: 10-20% of calls

### With CallTranscribe
- AI processes: 1000+ calls/day
- Time per call: 30 seconds
- Coverage: 100% of calls
- QA focuses on: Flagged calls only

### Cost Savings

| Metric | Manual | AI-Powered | Savings |
|--------|--------|------------|---------|
| QA Staff needed | 3-4 | 1 | ₹60,000-90,000/month |
| Calls analyzed | 20% | 100% | 5x coverage |
| Issue detection | Days | Real-time | Immediate |
| Training identification | Manual | Auto | Hours saved |

**Estimated Annual Savings**: ₹7,00,000 - ₹12,00,000

**ROI Timeline**: 8-12 months

---

## 9. Competitor Analysis

| Feature | CallTranscribe | CallMiner | Observe.AI | Enthu.AI |
|---------|---------------|-----------|------------|----------|
| Pricing | ₹15-30/call | $$$$ | $$$ | $$ |
| Hindi/Hinglish | ✅ Native | ⚠️ Limited | ⚠️ Limited | ✅ |
| Medical Focus | ✅ | ❌ | ❌ | ❌ |
| India Support | ✅ Local | ❌ US-based | ⚠️ | ✅ |
| Customization | ✅ Full | ❌ | ⚠️ | ⚠️ |
| Data Residency | ✅ India | ❌ | ❌ | ✅ |

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI accuracy issues | Regular prompt tuning, human QA override |
| Data privacy concerns | Encryption, DPDP compliance, audit logs |
| API cost spikes | Usage alerts, caching, rate limiting |
| Vendor lock-in | Abstract AI layer, support multiple providers |
| Scalability | Cloud-native architecture, auto-scaling |

---

## 11. Next Steps

1. **Discovery Call**: Understand exact requirements, call volumes, current systems
2. **Proposal Refinement**: Custom quote based on specific needs
3. **Contract & SOW**: Detailed scope of work, timelines, deliverables
4. **Kickoff**: Requirements gathering, design approval
5. **Development**: Agile sprints with weekly demos
6. **UAT & Launch**: User testing, training, go-live

---

## Contact

**Developer**: [Your Name]
**Email**: [your@email.com]
**Phone**: [Your Number]

---

*This proposal is valid for 30 days from the date of issue.*
*All prices are exclusive of GST (18%).*

