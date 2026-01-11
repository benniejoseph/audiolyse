# 🚀 AUDIOLYSE IMPLEMENTATION ROADMAP
## Complete Development Checklist - Priority Phases
### Cost-Efficient Approach for Maximum Profit Margins

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Total Estimated Duration:** 6-9 months  
**Team Size Recommendation:** 3-5 developers + 1 legal consultant

---

## 📊 EXECUTIVE SUMMARY

| Phase | Focus | Duration | Estimated Cost | ROI Impact |
|-------|-------|----------|----------------|------------|
| **Phase 0** | Legal & Compliance Shield | 2 weeks | ₹50K-1L | Risk Mitigation |
| **Phase 1** | Critical Fixes | 3 weeks | ₹1-2L | Unblock Revenue |
| **Phase 2** | Core Platform | 6 weeks | ₹3-5L | 2x User Value |
| **Phase 3** | Enterprise Ready | 8 weeks | ₹5-8L | 5x Revenue Potential |
| **Phase 4** | Competitive Features | 8 weeks | ₹5-8L | Market Leader |
| **Phase 5** | Scale & Optimize | Ongoing | ₹2-3L/month | Profit Maximization |

**Total Initial Investment:** ₹15-25L over 6 months  
**Expected Revenue at Scale:** ₹50L-1Cr/year within 18 months

---

## 💰 COST EFFICIENCY PRINCIPLES

### Build vs Buy Decisions

| Category | Build In-House | Use Third-Party | Recommendation |
|----------|---------------|-----------------|----------------|
| **Auth/SSO** | ₹5L+ | Supabase (Free) | ✅ Use Supabase |
| **Email** | ₹2L+ | Resend (₹0-500/mo) | ✅ Use Resend |
| **Storage** | ₹3L+ | Supabase Storage | ✅ Use Supabase |
| **AI/LLM** | ₹10L+ | Gemini API (Pay-per-use) | ✅ Use Gemini |
| **Analytics** | ₹5L+ | PostHog (Free tier) | ✅ Use PostHog |
| **Error Tracking** | ₹2L+ | Sentry (Free tier) | ✅ Use Sentry |
| **CRM Integration** | ₹3L+ | Pipedream/n8n | ✅ Use n8n (self-host) |
| **PDF Generation** | ₹1L+ | jsPDF (Free) | ✅ Already using |
| **Payments** | N/A | Razorpay (2% fee) | ✅ Already using |

### Cost Savings Already Achieved
- Supabase vs Custom Backend: **₹10L+ saved**
- Gemini vs OpenAI: **40% cost reduction**
- Vercel vs Custom Hosting: **₹5L+ saved**
- Next.js vs Custom Framework: **₹15L+ saved**

---

# 🛡️ PHASE 0: LEGAL & COMPLIANCE SHIELD
## Duration: 2 Weeks | Priority: CRITICAL | Cost: ₹50K-1L

> ⚠️ **DO THIS FIRST** - Legal protection before scaling prevents catastrophic losses

### 0.1 DPDP Act 2024 Compliance (India)

- [ ] **0.1.1** Create Data Protection Policy document
  - Template available: MeitY guidelines
  - Cost: ₹0 (DIY with template)
  - Time: 2 days

- [ ] **0.1.2** Implement Consent Management
  ```
  Priority: CRITICAL
  Files to modify:
  - app/(dashboard)/analyze/page.tsx (enhance consent checkbox)
  - Create: lib/consent/manager.ts
  - Create: app/api/consent/route.ts
  Database: Add consent_records table
  ```
  - [ ] Granular consent options (transcription, storage, AI analysis)
  - [ ] Consent timestamp and version tracking
  - [ ] Consent withdrawal mechanism
  - [ ] Re-consent flow for policy changes

- [ ] **0.1.3** Data Principal Rights Implementation
  ```sql
  -- Add to migrations
  CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    request_type VARCHAR(50), -- 'access', 'rectification', 'erasure', 'portability'
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    response_data JSONB
  );
  ```
  - [ ] Right to Access (data export)
  - [ ] Right to Correction
  - [ ] Right to Erasure (delete account must work!)
  - [ ] Right to Portability (JSON/CSV export)

- [ ] **0.1.4** Create Privacy Dashboard Page
  - [ ] View all stored data
  - [ ] Download personal data
  - [ ] Delete account (functional!)
  - [ ] Manage consents
  - Route: `/settings/privacy`

- [ ] **0.1.5** Data Retention Policy Enforcement
  ```typescript
  // Create: lib/retention/policy.ts
  const RETENTION_POLICIES = {
    free: { days: 7, autoDelete: true },
    individual: { days: 30, autoDelete: true },
    team: { days: 90, autoDelete: false },
    enterprise: { days: 365, autoDelete: false },
  };
  ```
  - [ ] Automated deletion cron job
  - [ ] Retention warning emails (7 days before)
  - [ ] Manual override for legal holds

### 0.2 HIPAA Alignment (US Healthcare Clients)

- [ ] **0.2.1** Create Business Associate Agreement (BAA) Template
  ```
  Location: /public/legal/baa-template.pdf
  Content: Standard BAA with Audiolyse specifics
  Cost: ₹10-20K (lawyer review) or use HHS template
  ```

- [ ] **0.2.2** BAA Signing Workflow
  - [ ] DocuSign/SignNow integration (or manual upload)
  - [ ] BAA status tracking per organization
  - [ ] Block PHI processing without signed BAA
  ```sql
  ALTER TABLE organizations ADD COLUMN baa_signed_at TIMESTAMPTZ;
  ALTER TABLE organizations ADD COLUMN baa_document_url TEXT;
  ```

- [ ] **0.2.3** PHI Safeguards Implementation
  - [ ] PHI detection in transcripts (regex + AI)
  - [ ] Automatic PHI masking option
  - [ ] Minimum necessary access controls
  - [ ] PHI access audit logging

- [ ] **0.2.4** HIPAA Training Acknowledgment
  - [ ] In-app training module (5 slides)
  - [ ] Acknowledgment checkbox for healthcare orgs
  - [ ] Annual re-certification reminder

### 0.3 Terms of Service & Policies Update

- [ ] **0.3.1** Update Terms of Service
  - [ ] AI disclaimer (not medical advice)
  - [ ] Data processing terms
  - [ ] Limitation of liability
  - [ ] Indemnification clause
  - [ ] Arbitration clause (cost-efficient dispute resolution)
  - Route: `/terms` - already exists, enhance

- [ ] **0.3.2** Update Privacy Policy
  - [ ] DPDP Act compliance language
  - [ ] Data processing purposes
  - [ ] Third-party processors list
  - [ ] Cross-border transfer disclosure
  - [ ] Cookie policy details
  - Route: `/privacy` - already exists, enhance

- [ ] **0.3.3** Create Acceptable Use Policy
  - [ ] Prohibited content types
  - [ ] Recording consent requirements
  - [ ] API usage limits
  - Route: `/acceptable-use` (new)

- [ ] **0.3.4** Create Service Level Agreement (SLA)
  - [ ] Uptime commitment (99.5% realistic)
  - [ ] Support response times
  - [ ] Data backup guarantees
  - Route: `/sla` (new)

- [ ] **0.3.5** Version Control for Legal Docs
  ```sql
  CREATE TABLE legal_document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(50), -- 'terms', 'privacy', 'aup', 'sla'
    version VARCHAR(20),
    content TEXT,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### 0.4 Audit Trail Foundation

- [ ] **0.4.1** Comprehensive Audit Log Table
  ```sql
  CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Index for fast queries
  CREATE INDEX idx_audit_org_date ON audit_logs(organization_id, created_at DESC);
  ```

- [ ] **0.4.2** Audit Logging Middleware
  ```typescript
  // Create: middleware/audit.ts
  // Log: login, logout, data access, exports, deletions, settings changes
  ```

- [ ] **0.4.3** Audit Log Viewer (Admin)
  - [ ] Filterable by user, action, date
  - [ ] Export to CSV
  - Route: `/admin/audit-logs`

### 0.5 Security Baseline

- [ ] **0.5.1** Fix Delete Account Functionality
  ```typescript
  // app/api/account/delete/route.ts
  // CRITICAL: Currently button does nothing!
  // Must: Delete profile, org membership, anonymize call data
  ```

- [ ] **0.5.2** Session Management
  - [ ] Session timeout (configurable)
  - [ ] Force logout all devices
  - [ ] Login history view

- [ ] **0.5.3** Password Policy Enforcement
  ```typescript
  const PASSWORD_POLICY = {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: false, // Keep simple for UX
    maxAge: 90, // days, optional for enterprise
  };
  ```

### 0.6 Phase 0 Deliverables Checklist

| Deliverable | Status | Blocker For |
|-------------|--------|-------------|
| Consent management system | ⬜ | DPDP compliance |
| Working delete account | ⬜ | Legal requirement |
| BAA template | ⬜ | Healthcare sales |
| Updated Terms/Privacy | ⬜ | All users |
| Audit logging | ⬜ | Enterprise sales |
| Data export feature | ⬜ | DPDP compliance |

---

# 🔧 PHASE 1: CRITICAL FIXES
## Duration: 3 Weeks | Priority: HIGH | Cost: ₹1-2L

> 🎯 **Goal:** Fix broken features that block revenue and user adoption

### 1.1 Fix Broken Features

- [ ] **1.1.1** Fix Team Invitation Email Delivery
  ```
  Current: "Email delivery not configured"
  Solution: Integrate Resend (free tier: 100 emails/day)
  
  Files:
  - Create: lib/email/client.ts
  - Create: lib/email/templates/invitation.tsx
  - Modify: app/(dashboard)/team/page.tsx
  
  Cost: ₹0 (Resend free tier)
  ```

- [ ] **1.1.2** Implement Email Templates
  ```typescript
  // Templates needed:
  - team-invitation.tsx
  - welcome.tsx
  - password-reset.tsx
  - analysis-complete.tsx
  - subscription-receipt.tsx
  - usage-warning.tsx
  - account-deletion.tsx
  ```

- [ ] **1.1.3** Fix Call Assignment Notifications
  - [ ] Email notification to assignee
  - [ ] In-app notification
  - [ ] Dashboard highlight for assigned calls

### 1.2 Audio File Storage (Critical Gap)

- [ ] **1.2.1** Supabase Storage Setup
  ```sql
  -- Storage bucket for audio files
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('call-recordings', 'call-recordings', false);
  
  -- RLS Policy
  CREATE POLICY "Users can access own org recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-recordings' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
  ```

- [ ] **1.2.2** Audio Upload Flow
  ```typescript
  // Modify: app/(dashboard)/analyze/page.tsx
  // After successful analysis:
  // 1. Upload audio to Supabase Storage
  // 2. Store file_path in call_analyses
  // 3. Enable replay from history
  ```

- [ ] **1.2.3** Audio Playback in History
  - [ ] Fetch audio from storage
  - [ ] Streaming playback
  - [ ] Download option (if plan allows)

- [ ] **1.2.4** Storage Quota Enforcement
  ```typescript
  // Before upload, check:
  const usedStorage = org.storage_used_mb;
  const limit = SUBSCRIPTION_LIMITS[org.tier].storageMb;
  if (usedStorage + fileSizeMb > limit) {
    throw new Error('Storage limit exceeded');
  }
  ```

### 1.3 Subscription & Payment Fixes

- [ ] **1.3.1** Fix PAYG Credit Price Mismatch
  ```
  Issue: Pricing page shows ₹5/credit, credits page uses ₹15
  Fix: Centralize in lib/types/database.ts
  ```

- [ ] **1.3.2** Add Annual Billing Option
  ```typescript
  // 20% discount for annual
  const ANNUAL_DISCOUNT = 0.20;
  
  // New pricing structure
  SUBSCRIPTION_LIMITS.individual.price = {
    INR: { monthly: 499, annual: 4790 }, // 499*12*0.8
    USD: { monthly: 6, annual: 58 },
  };
  ```

- [ ] **1.3.3** Subscription Renewal Logic
  ```typescript
  // Create: lib/subscription/renewal.ts
  // Cron job to run daily:
  // 1. Find expiring subscriptions (next 7 days)
  // 2. Send renewal reminder emails
  // 3. Attempt auto-renewal if saved card
  // 4. Downgrade to free if payment fails after grace period
  ```

- [ ] **1.3.4** Payment Receipt Storage
  ```sql
  CREATE TABLE payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    payment_id VARCHAR(255) UNIQUE,
    order_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    receipt_number VARCHAR(50),
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **1.3.5** Invoice Generation
  - [ ] Auto-generate invoice PDF on payment
  - [ ] Store in Supabase Storage
  - [ ] Email to billing contact
  - [ ] Display in billing settings

### 1.4 Enterprise Lead Capture

- [ ] **1.4.1** Replace alert() with Proper Modal
  ```tsx
  // Current: alert('Contact sales@audiolyse.com')
  // Replace with:
  <EnterpriseContactModal
    onSubmit={handleEnterpriseInquiry}
    fields={['company', 'size', 'useCase', 'phone', 'email']}
  />
  ```

- [ ] **1.4.2** Enterprise Lead Database
  ```sql
  CREATE TABLE enterprise_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company_size VARCHAR(50),
    use_case TEXT,
    industry VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **1.4.3** Lead Notification Webhook
  - [ ] Slack notification on new lead
  - [ ] Email to sales team
  - [ ] CRM sync (later phase)

### 1.5 Error Handling & Recovery

- [ ] **1.5.1** Analysis Failure Recovery
  ```typescript
  // If database save fails after analysis:
  // 1. Store result in localStorage
  // 2. Show retry button
  // 3. Allow manual export even if save failed
  ```

- [ ] **1.5.2** Session Expiry Handling
  - [ ] Detect session expiry before upload
  - [ ] Auto-refresh token if possible
  - [ ] Clear warning before starting long upload

- [ ] **1.5.3** Offline Detection
  ```typescript
  // Add to layout:
  useEffect(() => {
    window.addEventListener('offline', () => {
      showToast('You are offline. Changes may not be saved.', 'warning');
    });
  }, []);
  ```

### 1.6 Phase 1 Deliverables Checklist

| Deliverable | Status | Revenue Impact |
|-------------|--------|----------------|
| Working email invitations | ⬜ | Team tier adoption |
| Audio file storage | ⬜ | Core value proposition |
| Annual billing | ⬜ | +20% revenue per user |
| Enterprise lead form | ⬜ | Enterprise pipeline |
| Invoice generation | ⬜ | Legal requirement |
| Analysis retry/recovery | ⬜ | User trust |

---

# 🏗️ PHASE 2: CORE PLATFORM ENHANCEMENT
## Duration: 6 Weeks | Priority: HIGH | Cost: ₹3-5L

> 🎯 **Goal:** Make the platform genuinely useful and sticky

### 2.1 AI Context Integration

- [ ] **2.1.1** Dynamic Prompt Builder
  ```typescript
  // Create: lib/ai/prompt-builder.ts
  function buildAnalysisPrompt(
    basePrompt: string,
    orgContext: OrgAISettings,
    industryTemplate: IndustryPrompt,
    customerHistory?: CustomerContext
  ): string {
    // Inject context into system prompt
  }
  ```

- [ ] **2.1.2** Industry-Specific Prompts
  ```typescript
  // Create: lib/ai/industry-prompts.ts
  const INDUSTRY_PROMPTS = {
    healthcare: {
      focusAreas: ['patient_safety', 'empathy', 'consent_verification'],
      terminology: ['symptoms', 'diagnosis', 'treatment', 'medication'],
      redFlags: ['medical_advice_given', 'diagnosis_attempt', 'urgency_missed'],
      scoreWeights: { empathy: 1.5, compliance: 1.5, closing: 0.5 },
    },
    insurance: { /* ... */ },
    real_estate: { /* ... */ },
    education: { /* ... */ },
  };
  ```

- [ ] **2.1.3** Enhanced Settings AI Context
  - [ ] Product catalog with prices
  - [ ] Competitor list with differentiators
  - [ ] FAQ/objection handling
  - [ ] Compliance scripts (must-say phrases)
  - [ ] Prohibited phrases (never-say)

- [ ] **2.1.4** Context Usage in Analysis
  ```typescript
  // In /api/transcribe/route.ts
  // Fetch org settings and inject into Gemini prompt
  const orgSettings = await getOrgAISettings(organizationId);
  const industryPrompt = INDUSTRY_PROMPTS[org.industry];
  const fullPrompt = buildAnalysisPrompt(BASE_PROMPT, orgSettings, industryPrompt);
  ```

### 2.2 Customer Memory System

- [ ] **2.2.1** Customer Profiles Table
  ```sql
  CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    identifier VARCHAR(255), -- phone/email/name
    identifier_type VARCHAR(20), -- 'phone', 'email', 'name'
    full_name VARCHAR(255),
    company VARCHAR(255),
    communication_style JSONB,
    preferences JSONB,
    concerns TEXT[],
    call_count INTEGER DEFAULT 0,
    total_talk_time_sec INTEGER DEFAULT 0,
    avg_sentiment_score DECIMAL(3,2),
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, identifier, identifier_type)
  );
  ```

- [ ] **2.2.2** Link Calls to Customers
  ```sql
  ALTER TABLE call_analyses ADD COLUMN customer_id UUID REFERENCES customer_profiles(id);
  ```

- [ ] **2.2.3** Customer Extraction from Calls
  ```typescript
  // After analysis, attempt to identify customer:
  // 1. Extract name from transcript
  // 2. Match against existing profiles
  // 3. Create new profile if not found
  // 4. Update profile with new insights
  ```

- [ ] **2.2.4** Customer Timeline View
  - [ ] All calls with this customer
  - [ ] Sentiment trend over time
  - [ ] Key topics discussed
  - [ ] Action items across calls
  - Route: `/customers/[id]`

### 2.3 Dashboard Enhancement

- [ ] **2.3.1** Widget System
  ```typescript
  // Create: components/dashboard/widgets/
  - ScoreTrendWidget.tsx
  - RecentCallsWidget.tsx
  - TeamPerformanceWidget.tsx
  - AlertsWidget.tsx
  - QuickActionsWidget.tsx
  - UsageWidget.tsx
  ```

- [ ] **2.3.2** Dashboard Customization
  ```sql
  ALTER TABLE profiles ADD COLUMN dashboard_layout JSONB;
  -- Store widget positions and visibility
  ```

- [ ] **2.3.3** Quick Actions Bar
  - [ ] Upload new call
  - [ ] View recent analysis
  - [ ] Team leaderboard toggle
  - [ ] Search calls

- [ ] **2.3.4** Smart Insights Panel
  ```typescript
  // AI-generated daily insights:
  - "Your team's average score improved 5% this week"
  - "3 calls flagged for review"
  - "Top performer: John (85 avg score)"
  ```

### 2.4 History & Search Enhancement

- [ ] **2.4.1** Natural Language Search
  ```typescript
  // Use Gemini to parse search queries:
  // "show me calls where customer mentioned competitor"
  // "find low score calls from last week"
  // Convert to Supabase query
  ```

- [ ] **2.4.2** Advanced Filters
  - [ ] Date range picker
  - [ ] Score range slider
  - [ ] Sentiment filter
  - [ ] Agent filter
  - [ ] Customer filter
  - [ ] Red flag filter
  - [ ] Assigned/unassigned

- [ ] **2.4.3** Bulk Actions
  - [ ] Select multiple calls
  - [ ] Bulk assign
  - [ ] Bulk export (PDF/CSV)
  - [ ] Bulk delete

- [ ] **2.4.4** Saved Filters
  ```sql
  CREATE TABLE saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    name VARCHAR(100),
    filter_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### 2.5 Notification System

- [ ] **2.5.1** In-App Notification Center
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    type VARCHAR(50), -- 'assignment', 'mention', 'alert', 'system'
    title VARCHAR(255),
    message TEXT,
    link VARCHAR(255),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **2.5.2** Notification Preferences
  ```typescript
  // Per-user settings:
  notificationPreferences: {
    email: {
      callAssigned: true,
      dailyDigest: true,
      weeklyReport: true,
      redFlagAlerts: true,
    },
    inApp: {
      callAssigned: true,
      analysisComplete: true,
      teamMention: true,
    }
  }
  ```

- [ ] **2.5.3** Real-time Notifications
  ```typescript
  // Use Supabase Realtime:
  supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, handleNewNotification)
    .subscribe();
  ```

### 2.6 Mobile Responsiveness

- [ ] **2.6.1** Responsive Audit
  - [ ] Test all pages on mobile viewport
  - [ ] Fix table overflow issues
  - [ ] Optimize modal dialogs
  - [ ] Touch-friendly buttons (44px min)

- [ ] **2.6.2** Mobile-Specific Components
  ```typescript
  // Create mobile-optimized versions:
  - MobileNav.tsx (bottom tab bar)
  - MobileCallCard.tsx
  - MobileAudioPlayer.tsx
  ```

- [ ] **2.6.3** PWA Setup
  ```json
  // public/manifest.json
  {
    "name": "Audiolyse",
    "short_name": "Audiolyse",
    "start_url": "/dashboard",
    "display": "standalone",
    "theme_color": "#00d9ff",
    "background_color": "#0a0a0f"
  }
  ```

### 2.7 Performance Optimization

- [ ] **2.7.1** Implement Caching
  ```typescript
  // Use SWR/React Query for client-side caching
  // Add Redis for API caching (optional, cost consideration)
  
  // For now, use Supabase's built-in caching:
  const { data } = await supabase
    .from('calls')
    .select('*')
    .limit(50)
    .order('created_at', { ascending: false });
  ```

- [ ] **2.7.2** Lazy Loading
  ```typescript
  // Dynamic imports for heavy components:
  const AnalysisDetail = dynamic(() => import('./AnalysisDetail'), {
    loading: () => <AnalysisSkeleton />,
  });
  ```

- [ ] **2.7.3** Image/Asset Optimization
  - [ ] Use Next.js Image component
  - [ ] Compress all static assets
  - [ ] Lazy load below-fold content

- [ ] **2.7.4** Bundle Analysis
  ```bash
  # Add to package.json scripts:
  "analyze": "ANALYZE=true next build"
  # Target: <500KB initial bundle
  ```

### 2.8 Phase 2 Deliverables Checklist

| Deliverable | Status | User Impact |
|-------------|--------|-------------|
| Industry-specific AI | ⬜ | 30% better insights |
| Customer memory | ⬜ | Relationship continuity |
| Dashboard widgets | ⬜ | Personalized experience |
| Advanced search | ⬜ | Find any call fast |
| Notification system | ⬜ | Stay informed |
| Mobile responsive | ⬜ | Use anywhere |

---

# 🏢 PHASE 3: ENTERPRISE READY
## Duration: 8 Weeks | Priority: MEDIUM-HIGH | Cost: ₹5-8L

> 🎯 **Goal:** Unlock enterprise deals with required features

### 3.1 Authentication & Security

- [ ] **3.1.1** Multi-Factor Authentication (MFA)
  ```typescript
  // Supabase supports TOTP MFA out of the box
  // Enable in Supabase Dashboard → Auth → MFA
  
  // UI for MFA setup:
  // Create: app/settings/security/mfa/page.tsx
  ```

- [ ] **3.1.2** SSO Integration (SAML/OIDC)
  ```typescript
  // Supabase Enterprise has SSO
  // For cost efficiency, use Auth0 or WorkOS free tier
  
  // Alternative: Manual SAML integration
  // Cost: ₹50K for WorkOS or Auth0 paid tier
  ```

- [ ] **3.1.3** SCIM Provisioning (Enterprise)
  ```
  For Phase 5 - requires paid identity provider
  Cost savings: Implement manual CSV import for now
  ```

- [ ] **3.1.4** Session Management
  - [ ] View active sessions
  - [ ] Revoke specific sessions
  - [ ] Set session timeout per org
  - [ ] Force logout all devices

- [ ] **3.1.5** Login History & Alerts
  ```sql
  CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    success BOOLEAN,
    failure_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **3.1.6** Suspicious Activity Detection
  ```typescript
  // Flag and alert on:
  // - Login from new location
  // - Multiple failed attempts
  // - Unusual access patterns
  // - Bulk data export
  ```

### 3.2 Team Hierarchy & Permissions

- [ ] **3.2.1** Enhanced Role System
  ```typescript
  const ROLES = {
    owner: {
      permissions: ['*'],
      canManage: ['admin', 'manager', 'member', 'viewer'],
    },
    admin: {
      permissions: ['manage_team', 'manage_settings', 'view_all', 'analyze', 'export'],
      canManage: ['manager', 'member', 'viewer'],
    },
    manager: {
      permissions: ['view_team', 'analyze', 'export', 'assign'],
      canManage: ['member', 'viewer'],
    },
    member: {
      permissions: ['view_own', 'analyze'],
      canManage: [],
    },
    viewer: {
      permissions: ['view_assigned'],
      canManage: [],
    },
  };
  ```

- [ ] **3.2.2** Permission Middleware
  ```typescript
  // Create: middleware/permissions.ts
  export function requirePermission(permission: string) {
    return async (req: NextRequest) => {
      const user = await getUser(req);
      const role = await getUserRole(user.id);
      if (!ROLES[role].permissions.includes(permission) && 
          !ROLES[role].permissions.includes('*')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    };
  }
  ```

- [ ] **3.2.3** Team Hierarchy View
  ```typescript
  // Visual org chart showing reporting structure
  // Use react-organizational-chart (free)
  ```

- [ ] **3.2.4** Department/Team Groups
  ```sql
  -- Already have teams table, implement UI:
  -- Create: app/(dashboard)/teams/page.tsx
  -- Features: Create team, add members, team-specific views
  ```

### 3.3 Manager Analytics Dashboard

- [ ] **3.3.1** Team Performance View
  ```typescript
  // Metrics per team member:
  - Call volume
  - Average score
  - Score trend
  - Top strengths/weaknesses
  - Improvement over time
  ```

- [ ] **3.3.2** Comparison Matrix
  ```typescript
  // Side-by-side agent comparison:
  - Select 2-5 agents
  - Compare across all metrics
  - Highlight best/worst in each category
  ```

- [ ] **3.3.3** Alert Configuration
  ```sql
  CREATE TABLE manager_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID REFERENCES profiles(id),
    alert_type VARCHAR(50), -- 'low_score', 'red_flag', 'volume_drop'
    threshold JSONB,
    notify_via TEXT[], -- ['email', 'in_app', 'slack']
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **3.3.4** Coaching Tracker
  ```sql
  CREATE TABLE coaching_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID REFERENCES profiles(id),
    agent_id UUID REFERENCES profiles(id),
    call_analysis_id UUID REFERENCES call_analyses(id),
    notes TEXT,
    action_items TEXT[],
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **3.3.5** 1:1 Meeting Notes
  - [ ] Schedule 1:1 with calendar
  - [ ] Pre-populate with recent call insights
  - [ ] Track action items
  - [ ] Follow-up reminders

### 3.4 CRM Integration (Cost-Efficient)

- [ ] **3.4.1** Generic Webhook System
  ```typescript
  // Instead of building specific integrations:
  // Create webhook on call analysis complete
  // Users can connect to Zapier/Make/n8n
  
  CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    url TEXT NOT NULL,
    events TEXT[], -- ['analysis.complete', 'assignment.created']
    secret VARCHAR(64),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **3.4.2** Zapier App (Low-Code)
  ```
  Cost: ₹0 to build basic triggers
  Effort: 2-3 days
  Benefit: Connect to 5000+ apps
  ```

- [ ] **3.4.3** Native HubSpot Integration (Priority)
  ```typescript
  // HubSpot is free CRM, many Indian SMBs use it
  // Use HubSpot API to:
  // 1. Push call notes to contact timeline
  // 2. Create tasks for follow-ups
  // 3. Update deal stage based on call outcome
  
  // Cost: Free (HubSpot API is free)
  ```

- [ ] **3.4.4** CSV Import/Export
  ```typescript
  // For CRMs without API:
  // 1. Export calls as CSV
  // 2. Import customer data from CSV
  // 3. Bulk operations
  ```

### 3.5 Advanced Reporting

- [ ] **3.5.1** Report Builder
  ```typescript
  // Simple report builder:
  // 1. Select metrics
  // 2. Choose date range
  // 3. Filter by team/agent
  // 4. Generate PDF/Excel
  
  // Use existing jsPDF, add Excel with xlsx library
  ```

- [ ] **3.5.2** Scheduled Reports
  ```sql
  CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(100),
    config JSONB, -- metrics, filters, format
    schedule VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    recipients TEXT[],
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **3.5.3** Executive Dashboard
  - [ ] High-level KPIs
  - [ ] Trend charts
  - [ ] Export to PowerPoint
  - Route: `/reports/executive`

### 3.6 Data Management

- [ ] **3.6.1** Bulk Import
  ```typescript
  // Import existing call data:
  // 1. Upload CSV with metadata
  // 2. Map columns to fields
  // 3. Batch process
  ```

- [ ] **3.6.2** Data Export (Compliance)
  ```typescript
  // Full data export for:
  // 1. DPDP compliance
  // 2. Switching providers
  // 3. Internal analysis
  
  // Format: JSON + CSV options
  ```

- [ ] **3.6.3** Data Retention Controls
  - [ ] Per-org retention settings
  - [ ] Legal hold capability
  - [ ] Automated deletion reports

### 3.7 Phase 3 Deliverables Checklist

| Deliverable | Status | Enterprise Impact |
|-------------|--------|-------------------|
| MFA | ⬜ | Security requirement |
| SSO/SAML | ⬜ | Enterprise blocker |
| Role-based permissions | ⬜ | Security & compliance |
| Manager dashboard | ⬜ | Decision makers need this |
| CRM webhook | ⬜ | Integration requirement |
| Scheduled reports | ⬜ | Automation expectation |

---

# 🚀 PHASE 4: COMPETITIVE FEATURES
## Duration: 8 Weeks | Priority: MEDIUM | Cost: ₹5-8L

> 🎯 **Goal:** Differentiate from competition and increase stickiness

### 4.1 Real-Time Analysis (Competitive Advantage)

- [ ] **4.1.1** Streaming Transcription Architecture
  ```typescript
  // Option A: WebSocket-based (complex, expensive)
  // Option B: Polling-based progress (simpler, cheaper)
  
  // Recommended: Start with Option B
  // Show real-time progress updates during analysis
  // Implement actual streaming in Phase 5
  ```

- [ ] **4.1.2** Live Progress Updates
  ```typescript
  // During analysis, show:
  // 1. Upload progress
  // 2. Transcription status
  // 3. AI analysis progress
  // 4. Partial results as available
  
  // Use Server-Sent Events (SSE) - simpler than WebSocket
  ```

- [ ] **4.1.3** Estimated Time to Complete
  ```typescript
  // Based on file size and historical processing times
  function estimateProcessingTime(fileSizeMb: number): number {
    const baseTime = 10; // seconds
    const perMbTime = 3; // seconds per MB
    return baseTime + (fileSizeMb * perMbTime);
  }
  ```

### 4.2 AI Coaching Assistant

- [ ] **4.2.1** Chat Interface for Call Analysis
  ```typescript
  // After analysis, allow users to ask questions:
  // "Why did I get a low score on objection handling?"
  // "What should I have said when customer mentioned price?"
  // "Show me similar successful calls"
  
  // Use Gemini with analysis context as system prompt
  ```

- [ ] **4.2.2** Suggested Questions
  ```typescript
  const SUGGESTED_QUESTIONS = [
    "How can I improve my score?",
    "What did I do well?",
    "Show me the key moments",
    "What should I follow up on?",
    "Compare this to my best call",
  ];
  ```

- [ ] **4.2.3** Citation/Source Display
  ```typescript
  // When AI makes a claim, show the transcript excerpt
  // "You interrupted the customer 3 times"
  // → [View in transcript: 2:34, 5:12, 8:45]
  ```

### 4.3 Gamification System

- [ ] **4.3.1** Points System
  ```sql
  CREATE TABLE user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    points_type VARCHAR(50), -- 'call_analyzed', 'high_score', 'streak'
    points INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  CREATE TABLE user_levels (
    user_id UUID PRIMARY KEY REFERENCES profiles(id),
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **4.3.2** Badges/Achievements
  ```typescript
  const BADGES = {
    first_call: { name: 'First Step', points: 10 },
    ten_calls: { name: 'Getting Started', points: 50 },
    hundred_calls: { name: 'Centurion', points: 200 },
    perfect_score: { name: 'Perfection', points: 100 },
    week_streak: { name: 'Consistent', points: 75 },
    top_performer: { name: 'Team Star', points: 150 },
  };
  ```

- [ ] **4.3.3** Leaderboards
  ```typescript
  // Weekly/Monthly leaderboards
  // Filter by: Team, Organization, Global
  // Metrics: Score, Call volume, Improvement
  ```

- [ ] **4.3.4** Challenges
  ```sql
  CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(100),
    description TEXT,
    goal_type VARCHAR(50), -- 'calls', 'avg_score', 'improvement'
    goal_value INTEGER,
    start_date DATE,
    end_date DATE,
    reward_points INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### 4.4 Knowledge Base & Training

- [ ] **4.4.1** Script Library
  ```sql
  CREATE TABLE script_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    category VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    tags TEXT[],
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **4.4.2** Objection Handling Playbook
  ```typescript
  // Structure:
  - Objection name
  - Common variations
  - Recommended response
  - Examples from successful calls
  - Do's and Don'ts
  ```

- [ ] **4.4.3** Best Practices from High-Scorers
  ```typescript
  // AI-generated insights from top 10% calls:
  // "Top performers ask 40% more open questions"
  // "High scorers pause 2-3 seconds before responding"
  ```

- [ ] **4.4.4** Training Video Links
  ```sql
  CREATE TABLE training_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    title VARCHAR(255),
    type VARCHAR(50), -- 'video', 'document', 'link'
    url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

### 4.5 Advanced Analytics

- [ ] **4.5.1** Conversion Correlation
  ```typescript
  // If integrated with CRM, track:
  // - Which call behaviors correlate with closed deals
  // - Optimal talk ratio for conversion
  // - Best time of day for successful calls
  ```

- [ ] **4.5.2** A/B Testing for Scripts
  ```typescript
  // Track which scripts lead to better outcomes
  // Requires outcome tracking (Phase 5 with CRM)
  ```

- [ ] **4.5.3** Predictive Insights
  ```typescript
  // "Based on similar calls, this deal has 65% chance of closing"
  // "Recommended next action: Send proposal within 48 hours"
  ```

### 4.6 Phase 4 Deliverables Checklist

| Deliverable | Status | Competitive Impact |
|-------------|--------|-------------------|
| Real-time progress | ⬜ | Modern UX expectation |
| AI coaching chat | ⬜ | Key differentiator |
| Gamification | ⬜ | Agent engagement |
| Script library | ⬜ | Knowledge management |
| Leaderboards | ⬜ | Competition & motivation |

---

# 📈 PHASE 5: SCALE & OPTIMIZE
## Duration: Ongoing | Priority: CONTINUOUS | Cost: ₹2-3L/month

> 🎯 **Goal:** Maximize profit margins and prepare for scale

### 5.1 Cost Optimization

- [ ] **5.1.1** AI Cost Reduction
  ```typescript
  // Strategies:
  // 1. Prompt caching for similar calls
  // 2. Tiered models (Gemini Flash for basic, Pro for detailed)
  // 3. Batch processing during off-peak hours
  // 4. Skip re-analysis for unchanged sections
  ```

- [ ] **5.1.2** Storage Optimization
  ```typescript
  // 1. Compress audio files (Opus codec)
  // 2. Delete raw audio after analysis (keep transcript)
  // 3. Tiered storage (hot/cold)
  // 4. Aggressive retention for free tier
  ```

- [ ] **5.1.3** Infrastructure Monitoring
  ```typescript
  // Track costs:
  // - Supabase usage
  // - Gemini API calls
  // - Vercel bandwidth
  // - Email sends
  
  // Alert when costs spike
  ```

### 5.2 Revenue Optimization

- [ ] **5.2.1** Usage Analytics for Upselling
  ```typescript
  // Identify users who should upgrade:
  // - Hitting free tier limits
  // - High engagement but low tier
  // - Team invite attempts on Individual plan
  ```

- [ ] **5.2.2** Expansion Revenue Tracking
  ```sql
  CREATE TABLE mrr_tracking (
    month DATE,
    organization_id UUID,
    tier SubscriptionTier,
    mrr DECIMAL(10,2),
    arr DECIMAL(10,2),
    is_expansion BOOLEAN, -- upgraded from previous month
    is_contraction BOOLEAN,
    is_churn BOOLEAN
  );
  ```

- [ ] **5.2.3** Churn Prevention
  ```typescript
  // Identify at-risk accounts:
  // - Declining usage
  // - No login in 14 days
  // - Support tickets unresolved
  
  // Trigger: Personal outreach email
  ```

### 5.3 Automation

- [ ] **5.3.1** Automated Onboarding Emails
  ```typescript
  // Day 0: Welcome + Quick start
  // Day 1: First call analysis guide
  // Day 3: Team invite prompt
  // Day 7: Feature highlight
  // Day 14: Upgrade prompt if on free
  ```

- [ ] **5.3.2** Automated Reports
  ```typescript
  // Weekly digest for managers:
  // - Team performance summary
  // - Top calls to review
  // - Coaching recommendations
  ```

- [ ] **5.3.3** Automated QA Sampling
  ```typescript
  // Randomly flag 5% of calls for manager review
  // Ensures consistent quality across team
  ```

### 5.4 Scalability

- [ ] **5.4.1** Database Optimization
  ```sql
  -- Add indexes for common queries
  CREATE INDEX idx_calls_org_date ON call_analyses(organization_id, created_at DESC);
  CREATE INDEX idx_calls_score ON call_analyses(overall_score);
  CREATE INDEX idx_calls_user ON call_analyses(uploaded_by);
  ```

- [ ] **5.4.2** Background Job Queue
  ```typescript
  // For long-running tasks:
  // - Use Supabase Edge Functions with Deno
  // - Or Vercel Cron for scheduled jobs
  // - Or external queue (BullMQ) if needed
  ```

- [ ] **5.4.3** CDN for Static Assets
  ```typescript
  // Vercel handles this automatically
  // Ensure all static assets have proper cache headers
  ```

### 5.5 Monitoring & Observability

- [ ] **5.5.1** Error Tracking
  ```typescript
  // Integrate Sentry (free tier: 5K events/month)
  // Track: JS errors, API errors, slow queries
  ```

- [ ] **5.5.2** Performance Monitoring
  ```typescript
  // Use Vercel Analytics (included)
  // Track: Web Vitals, API latency, cold starts
  ```

- [ ] **5.5.3** Business Metrics Dashboard
  ```typescript
  // Build internal dashboard:
  // - Daily signups
  // - Daily active users
  // - Calls analyzed
  // - Revenue
  // - Churn
  ```

### 5.6 Phase 5 Deliverables Checklist

| Deliverable | Status | Business Impact |
|-------------|--------|-----------------|
| Cost monitoring | ⬜ | Protect margins |
| Churn prevention | ⬜ | Reduce revenue loss |
| Automated onboarding | ⬜ | Better activation |
| Performance monitoring | ⬜ | User experience |
| Revenue tracking | ⬜ | Business intelligence |

---

# 📋 MASTER CHECKLIST

## Legal & Compliance (Phase 0)
- [ ] DPDP Act consent management
- [ ] Data subject rights dashboard
- [ ] Working delete account
- [ ] BAA template for healthcare
- [ ] Updated Terms of Service
- [ ] Updated Privacy Policy
- [ ] Audit logging system
- [ ] Data retention enforcement

## Critical Fixes (Phase 1)
- [ ] Email delivery (invitations, notifications)
- [ ] Audio file storage
- [ ] Annual billing option
- [ ] Enterprise lead capture
- [ ] Invoice generation
- [ ] Error recovery mechanism

## Core Platform (Phase 2)
- [ ] Industry-specific AI prompts
- [ ] Customer memory system
- [ ] Dashboard customization
- [ ] Advanced search/filters
- [ ] Notification center
- [ ] Mobile responsive
- [ ] PWA support

## Enterprise Ready (Phase 3)
- [ ] Multi-factor authentication
- [ ] SSO integration
- [ ] Role-based permissions
- [ ] Manager analytics dashboard
- [ ] CRM webhook integration
- [ ] Scheduled reports
- [ ] Bulk import/export

## Competitive Features (Phase 4)
- [ ] Real-time analysis progress
- [ ] AI coaching chat
- [ ] Gamification (points, badges)
- [ ] Leaderboards
- [ ] Script library
- [ ] Training resources

## Scale & Optimize (Phase 5)
- [ ] AI cost optimization
- [ ] Storage optimization
- [ ] Automated onboarding
- [ ] Churn prevention
- [ ] Revenue tracking
- [ ] Error monitoring

---

# 💵 BUDGET SUMMARY

| Phase | Duration | Dev Cost | Tools/Services | Total |
|-------|----------|----------|----------------|-------|
| Phase 0 | 2 weeks | ₹50K | ₹10K (legal review) | ₹60K |
| Phase 1 | 3 weeks | ₹1.5L | ₹5K (Resend) | ₹1.55L |
| Phase 2 | 6 weeks | ₹3L | ₹10K | ₹3.1L |
| Phase 3 | 8 weeks | ₹5L | ₹50K (SSO provider) | ₹5.5L |
| Phase 4 | 8 weeks | ₹5L | ₹10K | ₹5.1L |
| Phase 5 | Ongoing | ₹2L/mo | ₹50K/mo | ₹2.5L/mo |

**Initial Investment (Phases 0-4):** ₹15-20L  
**Monthly Operating Cost:** ₹2.5-3L  
**Break-even:** ~100 paid users at average ₹1000/month

---

# 🎯 SUCCESS METRICS

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Legal compliance complete | 100% | Phase 0 |
| Email delivery working | <5% bounce | Phase 1 |
| Audio replay enabled | 100% calls | Phase 1 |
| Enterprise inquiries | 10/month | Phase 3 |
| Paid user conversion | 5% of signups | Phase 2 |
| Net Revenue Retention | >100% | Phase 5 |
| Customer Satisfaction | NPS >40 | Phase 4 |

---

*Document maintained by: Product Team*  
*Next review: Monthly*
