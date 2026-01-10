# ⚖️ LEGAL COMPLIANCE CHECKLIST
## Audiolyse - Complete Legal Protection Guide

**Last Updated:** January 2026  
**Review Frequency:** Quarterly  
**Legal Advisor Contact:** [To be filled]

---

## 🚨 COMPLIANCE PRIORITY MATRIX

| Regulation | Jurisdiction | Risk Level | Fine/Penalty | Status |
|------------|--------------|------------|--------------|--------|
| DPDP Act 2024 | India | 🔴 Critical | Up to ₹250 Cr | ⬜ Pending |
| HIPAA | USA (Healthcare) | 🔴 Critical | $50K-$1.5M per violation | ⬜ Pending |
| GDPR | EU | 🟠 High | 4% global revenue | ⬜ Partial |
| IT Act 2000 | India | 🟠 High | Variable | ⬜ Partial |
| Consumer Protection Act | India | 🟡 Medium | Variable | ⬜ Partial |
| EU AI Act 2025 | EU | 🟡 Medium | €35M or 7% revenue | ⬜ Not Started |

---

## 📋 SECTION 1: DPDP ACT 2024 (INDIA) - CRITICAL

### 1.1 Consent Management

| Requirement | Implementation | Status | Priority |
|-------------|----------------|--------|----------|
| Clear, informed consent before processing | Consent checkbox with detailed explanation | ⬜ | P0 |
| Granular consent options | Separate consent for: storage, AI analysis, sharing | ⬜ | P0 |
| Consent withdrawal mechanism | One-click consent revoke in settings | ⬜ | P0 |
| Re-consent for purpose change | Notify and re-consent if processing changes | ⬜ | P1 |
| Consent record keeping | Store timestamp, version, IP for each consent | ⬜ | P0 |
| No consent bundling | Cannot force consent for non-essential features | ⬜ | P0 |

**Implementation Checklist:**

```sql
-- Database: consent_records table
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  consent_type VARCHAR(50) NOT NULL, 
  -- 'audio_upload', 'ai_analysis', 'data_storage', 'marketing'
  consent_version VARCHAR(20) NOT NULL,
  consented BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX idx_consent_user ON consent_records(user_id, consent_type);
```

- [ ] **1.1.1** Create `lib/consent/types.ts` - Define consent types
- [ ] **1.1.2** Create `lib/consent/manager.ts` - Consent handling logic
- [ ] **1.1.3** Create `components/consent/ConsentModal.tsx` - UI component
- [ ] **1.1.4** Modify `app/(dashboard)/analyze/page.tsx` - Granular consent
- [ ] **1.1.5** Create `app/settings/privacy/page.tsx` - Consent management UI
- [ ] **1.1.6** Create `app/api/consent/route.ts` - API endpoints

### 1.2 Data Principal Rights

| Right | Implementation | Status | Deadline |
|-------|----------------|--------|----------|
| Right to Access | Download all personal data | ⬜ | P0 |
| Right to Correction | Edit profile, request data correction | ⬜ | P0 |
| Right to Erasure | Delete account and all data | ⬜ | P0 |
| Right to Data Portability | Export in machine-readable format | ⬜ | P0 |
| Right to Grievance Redressal | Complaint mechanism | ⬜ | P1 |

**Implementation Checklist:**

- [ ] **1.2.1** Fix Delete Account Button (CRITICAL - Currently broken!)
  ```typescript
  // app/api/account/delete/route.ts
  export async function POST(request: Request) {
    // 1. Verify user identity
    // 2. Export data before deletion (optional)
    // 3. Delete from: profiles, organization_members, call_analyses
    // 4. Anonymize audit logs (keep for compliance)
    // 5. Send confirmation email
    // 6. Log deletion for compliance
  }
  ```

- [ ] **1.2.2** Create Data Export Feature
  ```typescript
  // app/api/account/export/route.ts
  // Export: profile, calls, transcripts, settings
  // Format: JSON primary, CSV optional
  // Delivery: Email download link (24hr expiry)
  ```

- [ ] **1.2.3** Create Privacy Dashboard
  ```
  Route: /settings/privacy
  Features:
  - View all stored data categories
  - Download personal data
  - Manage consent preferences
  - Request data correction
  - Delete account
  - View data retention timeline
  ```

- [ ] **1.2.4** Grievance Redressal Mechanism
  ```
  Route: /support/grievance
  - Complaint submission form
  - Tracking number generation
  - 30-day resolution SLA
  - Email: grievance@audiolyse.com
  ```

### 1.3 Data Localization & Transfer

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data stored in India for Indian users | ✅ | Supabase ap-south-1 |
| Cross-border transfer disclosure | ⬜ | Update Privacy Policy |
| Adequate protection for transfers | ⬜ | Standard contractual clauses |

**Action Items:**
- [ ] **1.3.1** Verify Supabase region is ap-south-1 (Mumbai)
- [ ] **1.3.2** Document all third-party processors and their locations
- [ ] **1.3.3** Update Privacy Policy with transfer details
- [ ] **1.3.4** Implement region selector for multi-region (future)

### 1.4 Data Protection Officer

| Requirement | Status | Notes |
|-------------|--------|-------|
| Designate DPO (if processing significant data) | ⬜ | Required if >X users |
| Publish DPO contact details | ⬜ | Privacy Policy |
| DPO independence | ⬜ | Reporting structure |

**Action Items:**
- [ ] **1.4.1** Determine if DPO is required (based on data volume)
- [ ] **1.4.2** Designate DPO or external DPO service
- [ ] **1.4.3** Create DPO contact: dpo@audiolyse.com
- [ ] **1.4.4** Update Privacy Policy with DPO details

### 1.5 Breach Notification

| Requirement | Timeline | Status |
|-------------|----------|--------|
| Notify Data Protection Board | 72 hours | ⬜ |
| Notify affected users | Without delay | ⬜ |
| Document breach internally | Immediately | ⬜ |

**Implementation Checklist:**
- [ ] **1.5.1** Create Incident Response Plan document
- [ ] **1.5.2** Create breach notification email templates
- [ ] **1.5.3** Establish breach assessment criteria
- [ ] **1.5.4** Create internal breach reporting form
- [ ] **1.5.5** Test breach notification workflow

---

## 📋 SECTION 2: HIPAA COMPLIANCE (US HEALTHCARE)

### 2.1 Business Associate Agreement (BAA)

| Requirement | Status | Priority |
|-------------|--------|----------|
| BAA template available | ⬜ | P0 |
| Digital signing workflow | ⬜ | P1 |
| BAA tracking per organization | ⬜ | P0 |
| Block PHI processing without BAA | ⬜ | P0 |

**Implementation Checklist:**

- [ ] **2.1.1** Create BAA Template
  ```
  Location: /public/legal/baa-template.pdf
  Content:
  - Permitted uses and disclosures
  - Safeguards requirements
  - Reporting obligations
  - Termination procedures
  - Subcontractor requirements
  
  Cost: ₹20-50K for legal review
  Alternative: Use HHS model BAA (free)
  ```

- [ ] **2.1.2** Database Schema for BAA Tracking
  ```sql
  ALTER TABLE organizations ADD COLUMN hipaa_covered_entity BOOLEAN DEFAULT false;
  ALTER TABLE organizations ADD COLUMN baa_signed_at TIMESTAMPTZ;
  ALTER TABLE organizations ADD COLUMN baa_document_url TEXT;
  ALTER TABLE organizations ADD COLUMN baa_signatory_name VARCHAR(255);
  ALTER TABLE organizations ADD COLUMN baa_signatory_email VARCHAR(255);
  ```

- [ ] **2.1.3** BAA Signing Workflow
  ```
  Options (cost-efficient):
  1. DocuSign free tier (3 documents/month)
  2. Manual PDF upload + checkbox confirmation
  3. Dropbox Sign (free for basic)
  
  Recommended: Manual upload for MVP
  ```

- [ ] **2.1.4** Healthcare Organization Detection
  ```typescript
  // During onboarding, if industry === 'healthcare':
  // 1. Show HIPAA requirements notice
  // 2. Require BAA signature
  // 3. Enable PHI safeguards
  // 4. Restrict data retention options
  ```

### 2.2 Technical Safeguards

| Safeguard | Implementation | Status |
|-----------|----------------|--------|
| Access controls | Role-based permissions | ⬜ |
| Audit controls | Comprehensive logging | ⬜ |
| Integrity controls | Data validation | ✅ Partial |
| Transmission security | TLS 1.3 | ✅ |
| Encryption at rest | Supabase encryption | ✅ |

**Implementation Checklist:**

- [ ] **2.2.1** PHI Access Logging
  ```sql
  CREATE TABLE phi_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    resource_type VARCHAR(50), -- 'call_analysis', 'transcript', 'audio'
    resource_id UUID,
    action VARCHAR(50), -- 'view', 'download', 'export', 'share'
    ip_address INET,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **2.2.2** Automatic Session Timeout
  ```typescript
  // Healthcare orgs: 15-minute timeout
  // Default: 60-minute timeout
  const SESSION_TIMEOUT = org.hipaa_covered_entity ? 15 * 60 : 60 * 60;
  ```

- [ ] **2.2.3** PHI Detection and Masking
  ```typescript
  // Detect and optionally mask:
  // - Names (NER)
  // - Phone numbers (regex)
  // - SSN patterns (regex)
  // - Medical record numbers
  // - Email addresses
  
  // Option to auto-mask in stored transcripts
  ```

### 2.3 Administrative Safeguards

| Safeguard | Status | Notes |
|-----------|--------|-------|
| Security Officer designation | ⬜ | Can be same as DPO |
| Workforce training | ⬜ | In-app module |
| Sanctions policy | ⬜ | Document |
| Security incident procedures | ⬜ | SOP document |

**Implementation Checklist:**

- [ ] **2.3.1** HIPAA Training Module
  ```
  5-slide in-app training:
  1. What is PHI?
  2. Your responsibilities
  3. Dos and Don'ts
  4. Reporting incidents
  5. Acknowledgment
  
  Track completion in database
  ```

- [ ] **2.3.2** Training Tracking
  ```sql
  CREATE TABLE compliance_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    training_type VARCHAR(50), -- 'hipaa', 'security', 'privacy'
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- annual renewal
    score INTEGER,
    certificate_url TEXT
  );
  ```

### 2.4 Physical Safeguards

| Safeguard | Status | Notes |
|-----------|--------|-------|
| Facility access controls | ✅ | Cloud-based (Vercel/Supabase) |
| Workstation security | ⬜ | User responsibility |
| Device controls | ⬜ | Policy document |

**Action Items:**
- [ ] **2.4.1** Create Workstation Security Guidelines document
- [ ] **2.4.2** Add security reminder in healthcare org dashboard

---

## 📋 SECTION 3: GENERAL DATA PROTECTION

### 3.1 Privacy Policy Requirements

| Element | Status | Location |
|---------|--------|----------|
| Identity of data controller | ✅ | /privacy |
| Contact details | ⬜ | Needs update |
| Purpose of processing | ✅ | /privacy |
| Legal basis | ⬜ | Needs addition |
| Data retention periods | ⬜ | Needs specifics |
| Third-party processors | ⬜ | Needs list |
| International transfers | ⬜ | Needs disclosure |
| User rights | ⬜ | Needs enhancement |
| Complaint procedure | ⬜ | Needs addition |
| Cookie policy | ⬜ | Needs enhancement |

**Privacy Policy Update Checklist:**

- [ ] **3.1.1** Add specific data retention periods
  ```
  - Free tier: 7 days
  - Individual: 30 days
  - Team: 90 days
  - Enterprise: 365 days (or custom)
  ```

- [ ] **3.1.2** Add third-party processor list
  ```
  - Supabase (Database, Auth, Storage)
  - Vercel (Hosting)
  - Google Cloud (Gemini AI)
  - Razorpay (Payments)
  - Resend (Email)
  ```

- [ ] **3.1.3** Add legal basis section
  ```
  - Consent: AI analysis, marketing
  - Contract: Service delivery
  - Legal obligation: Tax records
  - Legitimate interest: Security, fraud prevention
  ```

- [ ] **3.1.4** Add cookie policy details
- [ ] **3.1.5** Add international transfer mechanism

### 3.2 Terms of Service Requirements

| Element | Status | Notes |
|---------|--------|-------|
| Service description | ✅ | Exists |
| User obligations | ✅ | Exists |
| Acceptable use | ⬜ | Needs expansion |
| Payment terms | ✅ | Exists |
| Limitation of liability | ⬜ | Needs legal review |
| Indemnification | ⬜ | Needs addition |
| Governing law | ⬜ | Needs update |
| Dispute resolution | ⬜ | Add arbitration |
| AI disclaimer | ✅ | Exists |
| Termination | ⬜ | Needs expansion |

**Terms of Service Update Checklist:**

- [ ] **3.2.1** Add comprehensive limitation of liability
  ```
  - Cap liability at fees paid in last 12 months
  - Exclude consequential damages
  - Carve-out for gross negligence
  ```

- [ ] **3.2.2** Add indemnification clause
  ```
  User indemnifies Audiolyse for:
  - Violations of recording consent laws
  - Misuse of analysis results
  - Unauthorized data sharing
  - Third-party claims from user content
  ```

- [ ] **3.2.3** Add arbitration clause (cost-efficient dispute resolution)
  ```
  - Binding arbitration for disputes under ₹50L
  - Seat: [City], India
  - Language: English
  - Rules: [Arbitration institution]
  ```

- [ ] **3.2.4** Update governing law
  ```
  - India law for Indian users
  - State-specific for US users (Delaware)
  ```

### 3.3 Cookie Compliance

| Requirement | Status | Priority |
|-------------|--------|----------|
| Cookie consent banner | ✅ | Exists |
| Cookie preference center | ⬜ | P2 |
| Cookie policy page | ⬜ | P1 |
| Honor DNT header | ⬜ | P2 |

**Implementation Checklist:**

- [ ] **3.3.1** Create Cookie Policy page
  ```
  Route: /cookies
  Content:
  - What cookies we use
  - Purpose of each cookie
  - Duration
  - Third-party cookies
  - How to control cookies
  ```

- [ ] **3.3.2** Cookie preference center
  ```typescript
  const COOKIE_CATEGORIES = {
    essential: { required: true, description: 'Required for site to work' },
    analytics: { required: false, description: 'Help us improve' },
    marketing: { required: false, description: 'Personalized ads' },
  };
  ```

---

## 📋 SECTION 4: AI-SPECIFIC COMPLIANCE

### 4.1 AI Transparency Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Disclose AI use | ✅ | In Terms |
| AI limitations disclaimer | ✅ | Medical disclaimer exists |
| Human oversight option | ⬜ | Manager review feature |
| Explanation of AI decisions | ⬜ | Citation feature needed |

**Implementation Checklist:**

- [ ] **4.1.1** Enhanced AI Disclaimer
  ```
  Add to every analysis page:
  "This analysis was generated by AI and may contain errors.
  Human review is recommended for important decisions.
  Click any insight to see the source transcript."
  ```

- [ ] **4.1.2** Citation/Source Feature
  ```typescript
  // When AI says "Score: 65 for objection handling"
  // Allow clicking to see:
  // - Which parts of transcript led to this score
  // - Confidence level
  // - Alternative interpretations
  ```

### 4.2 EU AI Act Considerations (Future-Proofing)

| Requirement | Status | Priority |
|-------------|--------|----------|
| Risk assessment | ⬜ | P2 |
| Technical documentation | ⬜ | P2 |
| Conformity assessment | ⬜ | P3 |
| Registration (if high-risk) | ⬜ | P3 |

**Notes:**
- Audiolyse may classify as "high-risk" under EU AI Act
- Required if selling to EU customers
- Timeline: Full compliance by August 2026

---

## 📋 SECTION 5: INDUSTRY-SPECIFIC COMPLIANCE

### 5.1 Healthcare Additional Requirements

| Requirement | Regulation | Status |
|-------------|------------|--------|
| Patient consent verification | HIPAA, DPDP | ⬜ |
| Minimum necessary standard | HIPAA | ⬜ |
| No marketing without auth | HIPAA | ⬜ |
| Accounting of disclosures | HIPAA | ⬜ |

### 5.2 Financial Services

| Requirement | Regulation | Status |
|-------------|------------|--------|
| Call recording disclosure | RBI guidelines | ⬜ |
| Data retention (varies) | SEBI/RBI | ⬜ |
| Audit trail | All | ⬜ |

### 5.3 Insurance

| Requirement | Regulation | Status |
|-------------|------------|--------|
| Sales practice compliance | IRDAI | ⬜ |
| Disclosure verification | IRDAI | ⬜ |
| Cooling-off period tracking | IRDAI | ⬜ |

---

## 📋 SECTION 6: OPERATIONAL COMPLIANCE

### 6.1 Data Retention & Deletion

| Data Type | Retention Period | Auto-Delete | Status |
|-----------|------------------|-------------|--------|
| Call analyses (Free) | 7 days | Yes | ⬜ |
| Call analyses (Paid) | Per plan | Configurable | ⬜ |
| Audio files | Same as analysis | Yes | ⬜ |
| Audit logs | 7 years | No | ⬜ |
| Payment records | 7 years | No | ⬜ |
| Deleted user data | 30 days grace | Yes | ⬜ |

**Implementation Checklist:**

- [ ] **6.1.1** Automated Deletion Cron Job
  ```typescript
  // Run daily at 2 AM IST
  // 1. Find expired call analyses
  // 2. Delete audio from storage
  // 3. Delete or anonymize database records
  // 4. Log deletion for compliance
  ```

- [ ] **6.1.2** Retention Warning Emails
  ```typescript
  // 7 days before deletion, send email:
  // "Your analysis of [call] will be deleted on [date]"
  ```

- [ ] **6.1.3** Legal Hold Feature
  ```sql
  ALTER TABLE call_analyses ADD COLUMN legal_hold BOOLEAN DEFAULT false;
  ALTER TABLE call_analyses ADD COLUMN legal_hold_reason TEXT;
  -- Skip auto-deletion if legal_hold = true
  ```

### 6.2 Audit Trail Requirements

| Event | Logged | Retained | Status |
|-------|--------|----------|--------|
| User login/logout | ⬜ | 2 years | ⬜ |
| Data access | ⬜ | 2 years | ⬜ |
| Data modification | ⬜ | 2 years | ⬜ |
| Data deletion | ⬜ | 7 years | ⬜ |
| Permission changes | ⬜ | 2 years | ⬜ |
| Settings changes | ⬜ | 2 years | ⬜ |
| Export operations | ⬜ | 2 years | ⬜ |

**Implementation Checklist:**

- [ ] **6.2.1** Comprehensive Audit Middleware
- [ ] **6.2.2** Audit Log Viewer for Admins
- [ ] **6.2.3** Audit Log Export Feature
- [ ] **6.2.4** Immutable Audit Storage (consider append-only)

### 6.3 Security Controls

| Control | Status | Evidence |
|---------|--------|----------|
| Encryption in transit | ✅ | TLS 1.3 |
| Encryption at rest | ✅ | Supabase |
| Access control | ⬜ | RBAC pending |
| MFA available | ⬜ | Not implemented |
| Vulnerability scanning | ⬜ | Not implemented |
| Penetration testing | ⬜ | Not done |
| Security training | ⬜ | Not implemented |

---

## 📋 SECTION 7: LEGAL DOCUMENTS CHECKLIST

### 7.1 Required Documents

| Document | Status | Location | Review Date |
|----------|--------|----------|-------------|
| Terms of Service | ⬜ Update | /terms | - |
| Privacy Policy | ⬜ Update | /privacy | - |
| Cookie Policy | ⬜ Create | /cookies | - |
| Acceptable Use Policy | ⬜ Create | /acceptable-use | - |
| BAA Template | ⬜ Create | /legal/baa | - |
| DPA Template | ⬜ Create | /legal/dpa | - |
| SLA | ⬜ Create | /sla | - |
| Subprocessor List | ⬜ Create | /legal/subprocessors | - |
| Security Whitepaper | ⬜ Create | /security | - |
| Incident Response Plan | ⬜ Create | Internal | - |

### 7.2 Document Version Control

```sql
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  changelog TEXT,
  UNIQUE(document_type, version)
);

CREATE TABLE user_document_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  document_type VARCHAR(50) NOT NULL,
  document_version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  UNIQUE(user_id, document_type, document_version)
);
```

---

## 📋 SECTION 8: COMPLIANCE MONITORING

### 8.1 Regular Compliance Tasks

| Task | Frequency | Owner | Status |
|------|-----------|-------|--------|
| Privacy policy review | Quarterly | Legal | ⬜ |
| Terms review | Quarterly | Legal | ⬜ |
| Security assessment | Annually | Security | ⬜ |
| Penetration test | Annually | External | ⬜ |
| HIPAA training renewal | Annually | HR | ⬜ |
| Subprocessor review | Quarterly | Legal | ⬜ |
| Data retention audit | Monthly | Ops | ⬜ |
| Consent rate monitoring | Monthly | Product | ⬜ |

### 8.2 Compliance Metrics Dashboard

```typescript
const COMPLIANCE_METRICS = {
  consentRate: '% of users with valid consent',
  dataRequestsResolved: 'DSR resolved within 30 days',
  breachResponseTime: 'Time to detect and respond',
  trainingCompletion: '% of users completed training',
  retentionCompliance: '% of data within retention policy',
  baaSignedRate: '% of healthcare orgs with BAA',
};
```

---

## 🚨 IMMEDIATE ACTION ITEMS

### This Week (P0)
1. [ ] Fix Delete Account functionality
2. [ ] Create consent management system
3. [ ] Update Privacy Policy with retention periods
4. [ ] Create BAA template (use HHS model)
5. [ ] Implement audit logging

### This Month (P1)
1. [ ] Create data export feature
2. [ ] Create privacy dashboard
3. [ ] Update Terms of Service
4. [ ] Create Cookie Policy
5. [ ] Implement PHI access logging

### This Quarter (P2)
1. [ ] HIPAA training module
2. [ ] Automated retention enforcement
3. [ ] Security assessment
4. [ ] EU AI Act preparation
5. [ ] SOC 2 Type II preparation

---

## 📞 LEGAL CONTACTS

| Role | Contact | For |
|------|---------|-----|
| DPO | dpo@audiolyse.com | Data protection queries |
| Legal | legal@audiolyse.com | Contracts, disputes |
| Security | security@audiolyse.com | Vulnerabilities, incidents |
| Grievance | grievance@audiolyse.com | Complaints |
| Compliance | compliance@audiolyse.com | BAA, audits |

---

*This checklist should be reviewed quarterly and updated as regulations change.*
