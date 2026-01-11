/**
 * Industry-Specific AI Prompt Templates
 * 
 * These templates provide specialized context and evaluation criteria
 * for different industries to improve AI analysis accuracy.
 */

export type IndustryType = 
  | 'healthcare'
  | 'medical_equipment'
  | 'physiotherapy'
  | 'insurance'
  | 'banking'
  | 'real_estate'
  | 'saas'
  | 'ecommerce'
  | 'telecom'
  | 'education'
  | 'automotive'
  | 'hospitality'
  | 'legal'
  | 'general';

export interface IndustryPrompt {
  id: IndustryType;
  name: string;
  description: string;
  context: string;
  evaluationCriteria: string[];
  complianceRequirements: string[];
  keyTerminology: string[];
  commonObjections: string[];
  redFlagIndicators: string[];
  qualityMarkers: string[];
}

export const INDUSTRY_PROMPTS: Record<IndustryType, IndustryPrompt> = {
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Medical Services',
    description: 'Medical facilities, clinics, hospitals, nursing services',
    context: `
This is a healthcare/medical services call. The conversation involves patient care, medical services, or health-related inquiries.

HEALTHCARE-SPECIFIC ANALYSIS PRIORITIES:
1. PATIENT SAFETY & TRIAGE: Immediately identify if this is an emergency. Any mention of severe symptoms (chest pain, difficulty breathing, suicide risk) REQUIRES immediate escalation instructions.
2. HIPAA COMPLIANCE: Strict adherence to verification standards. No PHI discussion without 3-point verification (Name, DOB, Address/ID).
3. EMPATHY & BEDSIDE MANNER: This is CRITICAL. Agents must validate feelings ("I understand how painful that is") before moving to business logic. Transactional tones are failures.
4. SCOPE OF PRACTICE: Non-clinical agents MUST NOT give medical advice. They must use phrases like "I recommend consulting your doctor" or "According to our protocols."
5. CARE COORDINATION: Clear next steps are vital. Patients are often anxious/confused. Repetition and "teach-back" (asking patient to repeat instructions) are quality markers.
6. FINANCIAL SENSITIVITY: Medical costs are stressful. Financial discussions must be clear but compassionate.
`,
    evaluationCriteria: [
      'Verified patient identity (3-point check) before discussing ANY medical info',
      'Demonstrated deep empathy ("I can hear how difficult this is for you")',
      'Stayed within scope of practice (No unauthorized medical advice)',
      'Performed appropriate triage/urgency assessment immediately',
      'Used "Teach-Back" method to ensure patient understood instructions',
      ' maintained professional yet warm "Bedside Manner"',
      'Protected patient privacy (HIPAA) throughout',
    ],
    complianceRequirements: [
      'HIPAA: 3-point identity verification',
      'Emergency Disclaimers: "If this is a medical emergency, hang up and dial 911"',
      'Scope of Practice: No diagnostic statements by non-clinicians',
      'Consent: Explicit consent for recording/treatment discussions',
      'Documentation: Accurate logging of symptoms reported',
    ],
    keyTerminology: [
      'patient', 'provider', 'triage', 'symptoms', 'consultation', 'referral',
      'copay', 'deductible', 'out-of-pocket', 'pre-authorization', 'formulary',
      'HIPAA', 'PHI', 'vital signs', 'emergency', 'urgent care', 'follow-up',
    ],
    commonObjections: [
      'Appointment wait times too long',
      'Cost of service/medication too high',
      'Insurance denial/coverage issues',
      'Provider unavailability',
      'Referral processing delays',
      'Dissatisfaction with previous care',
    ],
    redFlagIndicators: [
      'IGNORING EMERGENCY SYMPTOMS (Chest pain, shortness of breath, suicidal ideation)',
      'Discussing PHI without full verification',
      'Agent giving medical advice ("You should take X", "It sounds like Y")',
      'Dismissive or transactional tone with distressed patient',
      'Failure to escalate unsatisfied clinical complaints',
      'Discussing other patients\' information',
    ],
    qualityMarkers: [
      'Warm, reassuring opening tone',
      'Active validation of distress',
      'Clear/Safe escalation of medical questions',
      'Patient comprehension verification',
      'Compassionate financial discussion',
      'Clear, written-like summary of next steps',
    ],
  },

  medical_equipment: {
    id: 'medical_equipment',
    name: 'Medical Equipment & Devices',
    description: 'Medical devices, equipment sales, rentals, and support',
    context: `
This is a medical equipment/device call. The conversation involves medical equipment sales, rentals, maintenance, or support.

MEDICAL EQUIPMENT-SPECIFIC PRIORITIES:
1. PRODUCT KNOWLEDGE: Deep understanding of equipment specifications and use cases
2. COMPLIANCE: FDA regulations, warranty terms, proper usage guidelines
3. PATIENT SAFETY: Proper training requirements, contraindications
4. TECHNICAL SUPPORT: Troubleshooting, maintenance scheduling
5. INSURANCE/BILLING: DME coverage, prior authorization, rental vs purchase
6. DELIVERY/SETUP: Installation, training, follow-up visits
7. DOCUMENTATION: Prescription requirements, medical necessity
`,
    evaluationCriteria: [
      'Demonstrated thorough product knowledge',
      'Explained proper usage and safety guidelines',
      'Addressed insurance/coverage questions accurately',
      'Provided clear delivery/setup expectations',
      'Offered appropriate training resources',
      'Handled technical issues competently',
      'Documented medical necessity appropriately',
    ],
    complianceRequirements: [
      'FDA device regulations awareness',
      'DME billing compliance',
      'Medical necessity documentation',
      'Prescription verification',
      'Warranty and liability explanations',
    ],
    keyTerminology: [
      'DME', 'prior authorization', 'medical necessity', 'prescription',
      'warranty', 'maintenance', 'calibration', 'replacement parts',
      'rental', 'purchase', 'coverage', 'setup', 'training',
    ],
    commonObjections: [
      'Equipment cost concerns',
      'Insurance coverage uncertainty',
      'Setup complexity worries',
      'Maintenance requirements',
      'Alternative product comparisons',
      'Wait times for delivery',
    ],
    redFlagIndicators: [
      'Recommending equipment without prescription',
      'Overstating equipment capabilities',
      'Ignoring contraindications',
      'Improper insurance advice',
      'Skipping safety instructions',
      'Pressure selling unnecessary features',
    ],
    qualityMarkers: [
      'Needs assessment before recommendation',
      'Clear explanation of features vs needs',
      'Safety-first approach',
      'Insurance guidance accuracy',
      'Comprehensive setup support',
      'Follow-up care planning',
    ],
  },

  physiotherapy: {
    id: 'physiotherapy',
    name: 'Physiotherapy & Rehabilitation',
    description: 'Physical therapy, rehabilitation centers, elder care',
    context: `
This is a physiotherapy/rehabilitation call. The conversation involves physical therapy services, rehabilitation programs, or mobility assistance.

PHYSIOTHERAPY-SPECIFIC PRIORITIES:
1. PATIENT CONDITION: Understanding current mobility, pain levels, and goals
2. TREATMENT PLANNING: Explaining therapy approaches and expected outcomes
3. SAFETY: Home exercise risks, fall prevention, proper technique
4. PROGRESS TRACKING: Assessment schedules, milestone setting
5. INSURANCE: Coverage for PT sessions, authorization requirements
6. ACCESSIBILITY: Home visits, transportation, scheduling flexibility
7. FAMILY INVOLVEMENT: Caregiver instructions, support systems
`,
    evaluationCriteria: [
      'Assessed patient mobility and pain levels appropriately',
      'Explained treatment approach and expected outcomes',
      'Discussed safety considerations and precautions',
      'Set realistic goals and timeline expectations',
      'Addressed insurance and coverage clearly',
      'Involved family/caregivers when appropriate',
      'Provided clear home exercise instructions',
    ],
    complianceRequirements: [
      'PT scope of practice adherence',
      'Proper referral documentation',
      'Home safety assessments',
      'Progress documentation requirements',
      'Insurance pre-authorization',
    ],
    keyTerminology: [
      'mobility', 'range of motion', 'strength training', 'balance',
      'pain management', 'rehabilitation', 'exercises', 'therapy plan',
      'assessment', 'progress', 'home program', 'assistive devices',
    ],
    commonObjections: [
      'Pain during therapy concerns',
      'Time commitment worries',
      'Cost of multiple sessions',
      'Transportation difficulties',
      'Skepticism about effectiveness',
      'Previous therapy failures',
    ],
    redFlagIndicators: [
      'Ignoring pain complaints',
      'Overpromising recovery timelines',
      'Skipping safety assessments',
      'Not involving caregivers for elderly',
      'Inadequate home exercise instructions',
      'Dismissing patient limitations',
    ],
    qualityMarkers: [
      'Thorough initial assessment',
      'Realistic goal setting',
      'Clear therapy plan explanation',
      'Safety-first messaging',
      'Empathetic pain acknowledgment',
      'Caregiver inclusion when needed',
    ],
  },

  insurance: {
    id: 'insurance',
    name: 'Insurance Services',
    description: 'Life, health, auto, property insurance',
    context: `
This is an insurance call. The conversation involves policy inquiries, claims, coverage questions, or sales.

INSURANCE-SPECIFIC PRIORITIES:
1. REGULATORY COMPLIANCE: State/federal insurance regulations, licensing
2. POLICY ACCURACY: Coverage details, exclusions, limitations
3. CLAIMS PROCESS: Documentation, timelines, appeals
4. TRANSPARENCY: Premium calculations, deductibles, copays
5. SUITABILITY: Matching coverage to actual needs
6. DISCLOSURE: Material information requirements
7. ETHICS: No misrepresentation, fair dealing
`,
    evaluationCriteria: [
      'Provided accurate policy information',
      'Explained coverage and exclusions clearly',
      'Assessed customer needs before recommending',
      'Handled claims inquiries professionally',
      'Disclosed all material information',
      'Avoided misrepresentation',
      'Set realistic expectations',
    ],
    complianceRequirements: [
      'State insurance regulations',
      'Disclosure requirements',
      'Anti-fraud protocols',
      'Claims handling timelines',
      'Privacy protection',
    ],
    keyTerminology: [
      'premium', 'deductible', 'copay', 'coverage', 'exclusion',
      'claim', 'policy', 'beneficiary', 'underwriting', 'rider',
      'endorsement', 'liability', 'comprehensive', 'collision',
    ],
    commonObjections: [
      'Premium too expensive',
      'Claim denial frustration',
      'Coverage confusion',
      'Competitor comparison',
      'Distrust of insurance',
      'Claims process complexity',
    ],
    redFlagIndicators: [
      'Misrepresenting coverage',
      'Pressure selling unnecessary coverage',
      'Hiding exclusions',
      'Improper claim denial',
      'Unauthorized policy changes',
      'Discriminatory practices',
    ],
    qualityMarkers: [
      'Needs-based recommendation',
      'Clear explanation of terms',
      'Transparent pricing discussion',
      'Professional claims handling',
      'Appropriate follow-up',
      'Documentation accuracy',
    ],
  },

  banking: {
    id: 'banking',
    name: 'Banking & Financial Services',
    description: 'Banks, credit unions, lending, investments',
    context: `
This is a banking/financial services call. The conversation involves accounts, loans, investments, or banking services.

BANKING-SPECIFIC PRIORITIES:
1. REGULATORY COMPLIANCE: Banking regulations, KYC, AML
2. SECURITY: Identity verification, fraud prevention
3. ACCURACY: Account information, rates, fees
4. SUITABILITY: Matching products to financial situation
5. DISCLOSURE: Terms, conditions, risks
6. PRIVACY: Customer financial information protection
7. PROFESSIONALISM: High standards for financial advice
`,
    evaluationCriteria: [
      'Verified customer identity properly',
      'Provided accurate account/product information',
      'Explained fees and terms clearly',
      'Assessed customer needs appropriately',
      'Maintained security protocols',
      'Disclosed risks and limitations',
      'Handled sensitive information properly',
    ],
    complianceRequirements: [
      'KYC (Know Your Customer) protocols',
      'AML (Anti-Money Laundering) compliance',
      'Privacy regulations',
      'Fair lending practices',
      'Disclosure requirements',
    ],
    keyTerminology: [
      'account', 'balance', 'interest rate', 'APR', 'fees',
      'loan', 'mortgage', 'credit', 'deposit', 'withdrawal',
      'transfer', 'statement', 'overdraft', 'credit score',
    ],
    commonObjections: [
      'High fees concerns',
      'Interest rate comparisons',
      'Application rejection',
      'Security concerns',
      'Wait times for approvals',
      'Complex terms confusion',
    ],
    redFlagIndicators: [
      'Skipping identity verification',
      'Misquoting rates or fees',
      'Unauthorized account access',
      'Pushing unsuitable products',
      'Ignoring fraud indicators',
      'Sharing confidential information',
    ],
    qualityMarkers: [
      'Strict security adherence',
      'Clear rate/fee disclosure',
      'Needs-based recommendations',
      'Professional demeanor',
      'Accurate information',
      'Proper documentation',
    ],
  },

  real_estate: {
    id: 'real_estate',
    name: 'Real Estate',
    description: 'Property sales, rentals, property management',
    context: `
This is a real estate call. The conversation involves property sales, rentals, listings, or property management.

REAL ESTATE-SPECIFIC PRIORITIES:
1. PROPERTY DETAILS: Accurate information about listings
2. LEGAL COMPLIANCE: Fair housing, disclosure requirements
3. PRICING: Market analysis, valuation accuracy
4. FINANCING: Mortgage options, qualification guidance
5. NEGOTIATION: Professional representation
6. DOCUMENTATION: Contract terms, disclosures
7. TIMELINE: Realistic closing/move-in expectations
`,
    evaluationCriteria: [
      'Provided accurate property information',
      'Understood buyer/seller needs',
      'Discussed financing options appropriately',
      'Set realistic timeline expectations',
      'Complied with fair housing requirements',
      'Explained process clearly',
      'Handled negotiations professionally',
    ],
    complianceRequirements: [
      'Fair Housing Act compliance',
      'Property disclosure requirements',
      'Licensing regulations',
      'Agency disclosure',
      'Anti-discrimination protocols',
    ],
    keyTerminology: [
      'listing', 'closing', 'escrow', 'mortgage', 'down payment',
      'appraisal', 'inspection', 'offer', 'contingency', 'HOA',
      'square footage', 'zoning', 'title', 'deed', 'commission',
    ],
    commonObjections: [
      'Price too high/low',
      'Location concerns',
      'Property condition issues',
      'Financing challenges',
      'Timeline pressure',
      'Market uncertainty',
    ],
    redFlagIndicators: [
      'Discriminatory language or practices',
      'Misrepresenting property details',
      'Hiding known defects',
      'Pressure tactics',
      'Unauthorized dual agency',
      'False market claims',
    ],
    qualityMarkers: [
      'Thorough needs assessment',
      'Accurate property presentation',
      'Fair housing compliance',
      'Professional negotiation',
      'Clear communication',
      'Proper documentation',
    ],
  },

  saas: {
    id: 'saas',
    name: 'SaaS & Technology',
    description: 'Software as a Service, tech products, B2B solutions',
    context: `
This is a SaaS/technology call. The conversation involves software products, subscriptions, implementations, or technical support.

SAAS-SPECIFIC PRIORITIES:
1. PRODUCT KNOWLEDGE: Features, capabilities, integrations
2. TECHNICAL UNDERSTANDING: Customer's tech stack and requirements
3. ROI FOCUS: Value demonstration, business impact
4. IMPLEMENTATION: Onboarding, training, timeline
5. SUPPORT: SLA, response times, escalation paths
6. PRICING: Subscription models, scaling, discounts
7. SECURITY: Data handling, compliance certifications
`,
    evaluationCriteria: [
      'Demonstrated strong product knowledge',
      'Understood customer technical requirements',
      'Articulated value proposition clearly',
      'Addressed integration concerns',
      'Explained pricing transparently',
      'Set realistic implementation expectations',
      'Discussed security and compliance',
    ],
    complianceRequirements: [
      'Data privacy regulations (GDPR, CCPA)',
      'Security certifications discussion',
      'Contract terms transparency',
      'SLA documentation',
      'Data handling policies',
    ],
    keyTerminology: [
      'subscription', 'SLA', 'uptime', 'API', 'integration',
      'implementation', 'onboarding', 'seats', 'users', 'deployment',
      'cloud', 'security', 'compliance', 'ROI', 'scalability',
    ],
    commonObjections: [
      'Pricing concerns',
      'Integration complexity',
      'Switching costs',
      'Security worries',
      'Training requirements',
      'Competitor comparisons',
    ],
    redFlagIndicators: [
      'Overpromising capabilities',
      'Hiding implementation complexity',
      'Ignoring security questions',
      'Misrepresenting integrations',
      'Avoiding pricing discussions',
      'Dismissing competitor mentions',
    ],
    qualityMarkers: [
      'Discovery-led conversation',
      'Use case understanding',
      'Demo relevance',
      'ROI articulation',
      'Technical credibility',
      'Next steps clarity',
    ],
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    description: 'Online retail, customer service, order support',
    context: `
This is an e-commerce/retail call. The conversation involves orders, returns, product inquiries, or customer service.

ECOMMERCE-SPECIFIC PRIORITIES:
1. ORDER MANAGEMENT: Status, tracking, modifications
2. RETURNS/REFUNDS: Policy adherence, process clarity
3. PRODUCT INFORMATION: Accurate descriptions, availability
4. DELIVERY: Shipping options, timelines, issues
5. PAYMENT: Secure handling, billing inquiries
6. PROMOTIONS: Accurate discount application
7. CUSTOMER SATISFACTION: Resolution focus
`,
    evaluationCriteria: [
      'Provided accurate order/product information',
      'Handled returns/refunds per policy',
      'Resolved issues efficiently',
      'Demonstrated product knowledge',
      'Managed expectations appropriately',
      'Offered appropriate alternatives',
      'Ensured customer satisfaction',
    ],
    complianceRequirements: [
      'Consumer protection laws',
      'Return policy adherence',
      'Payment security (PCI)',
      'Advertising accuracy',
      'Privacy regulations',
    ],
    keyTerminology: [
      'order', 'tracking', 'shipping', 'delivery', 'return',
      'refund', 'exchange', 'promo code', 'discount', 'stock',
      'cart', 'checkout', 'payment', 'receipt', 'warranty',
    ],
    commonObjections: [
      'Order delays',
      'Product quality issues',
      'Return policy disputes',
      'Shipping cost concerns',
      'Wrong item received',
      'Promo code issues',
    ],
    redFlagIndicators: [
      'Refusing valid returns',
      'Misrepresenting delivery times',
      'Incorrect product information',
      'Payment security issues',
      'Ignoring customer complaints',
      'Unauthorized charges',
    ],
    qualityMarkers: [
      'Quick issue identification',
      'Proactive solutions',
      'Empathetic communication',
      'Policy adherence with flexibility',
      'Clear resolution paths',
      'Follow-up commitment',
    ],
  },

  telecom: {
    id: 'telecom',
    name: 'Telecommunications',
    description: 'Phone, internet, cable services',
    context: `
This is a telecommunications call. The conversation involves phone, internet, or cable services.

TELECOM-SPECIFIC PRIORITIES:
1. SERVICE ISSUES: Technical troubleshooting, outages
2. BILLING: Plan details, charges, disputes
3. PLAN CHANGES: Upgrades, downgrades, additions
4. CONTRACTS: Terms, early termination, renewals
5. EQUIPMENT: Devices, modems, installation
6. COVERAGE: Service availability, signal issues
7. RETENTION: Handling cancellation requests
`,
    evaluationCriteria: [
      'Effective troubleshooting process',
      'Clear billing explanation',
      'Appropriate plan recommendations',
      'Transparent contract terms',
      'Professional retention handling',
      'Accurate service information',
      'Good technical explanation',
    ],
    complianceRequirements: [
      'FCC regulations',
      'Contract disclosure',
      'Billing accuracy',
      'Service quality standards',
      'Privacy protection',
    ],
    keyTerminology: [
      'plan', 'data', 'minutes', 'bandwidth', 'coverage',
      'signal', 'outage', 'modem', 'router', 'installation',
      'contract', 'early termination fee', 'upgrade', 'bundle',
    ],
    commonObjections: [
      'High bills',
      'Service quality issues',
      'Contract lock-in',
      'Hidden fees',
      'Long wait times',
      'Competitor offers',
    ],
    redFlagIndicators: [
      'Slamming (unauthorized changes)',
      'Hiding fees',
      'Aggressive retention tactics',
      'Misrepresenting speeds',
      'Ignoring service issues',
      'Contract term misrepresentation',
    ],
    qualityMarkers: [
      'Patient troubleshooting',
      'Clear plan explanation',
      'Honest service assessment',
      'Professional retention',
      'Appropriate escalation',
      'Follow-up scheduling',
    ],
  },

  education: {
    id: 'education',
    name: 'Education & Training',
    description: 'Schools, online courses, corporate training',
    context: `
This is an education/training call. The conversation involves educational programs, courses, or training services.

EDUCATION-SPECIFIC PRIORITIES:
1. PROGRAM FIT: Matching programs to student needs/goals
2. ACCREDITATION: Legitimacy, recognition, transferability
3. OUTCOMES: Career prospects, completion rates
4. COST: Tuition, financial aid, ROI
5. SCHEDULE: Flexibility, time commitment
6. SUPPORT: Academic support, career services
7. ENROLLMENT: Process, deadlines, requirements
`,
    evaluationCriteria: [
      'Assessed student goals appropriately',
      'Provided accurate program information',
      'Discussed accreditation clearly',
      'Explained costs and financial options',
      'Set realistic outcome expectations',
      'Addressed schedule concerns',
      'Clear enrollment guidance',
    ],
    complianceRequirements: [
      'Accreditation accuracy',
      'Financial aid regulations',
      'Outcome disclosure requirements',
      'Enrollment agreement terms',
      'Privacy (FERPA)',
    ],
    keyTerminology: [
      'enrollment', 'accreditation', 'tuition', 'financial aid',
      'curriculum', 'credits', 'degree', 'certificate', 'transcript',
      'GPA', 'prerequisites', 'graduation', 'career services',
    ],
    commonObjections: [
      'Cost concerns',
      'Time commitment worries',
      'Accreditation questions',
      'Job placement doubts',
      'Prior learning recognition',
      'Online vs in-person',
    ],
    redFlagIndicators: [
      'Misrepresenting accreditation',
      'False job placement claims',
      'High-pressure enrollment tactics',
      'Hiding total costs',
      'Downplaying time requirements',
      'Guaranteed outcome promises',
    ],
    qualityMarkers: [
      'Needs-based program matching',
      'Transparent cost discussion',
      'Honest outcome expectations',
      'Support services explanation',
      'Clear enrollment process',
      'Student-centered approach',
    ],
  },

  automotive: {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car sales, service, dealerships',
    context: `
This is an automotive call. The conversation involves vehicle sales, service, or dealership inquiries.

AUTOMOTIVE-SPECIFIC PRIORITIES:
1. VEHICLE INFORMATION: Accurate specs, features, availability
2. PRICING: Transparency, negotiations, fees
3. FINANCING: Loan options, credit requirements
4. TRADE-IN: Fair valuations, process
5. SERVICE: Maintenance, repairs, warranties
6. TEST DRIVES: Scheduling, preparation
7. DELIVERY: Timeline, inspection process
`,
    evaluationCriteria: [
      'Accurate vehicle information provided',
      'Transparent pricing discussion',
      'Appropriate financing guidance',
      'Fair trade-in handling',
      'Professional service scheduling',
      'Clear next steps communication',
      'Customer needs understanding',
    ],
    complianceRequirements: [
      'Truth in Lending (financing)',
      'Lemon law awareness',
      'Warranty disclosures',
      'Trade-in value documentation',
      'Fee disclosure requirements',
    ],
    keyTerminology: [
      'MSRP', 'invoice', 'dealer fee', 'trade-in', 'financing',
      'APR', 'lease', 'warranty', 'service', 'maintenance',
      'test drive', 'VIN', 'mileage', 'features', 'options',
    ],
    commonObjections: [
      'Price too high',
      'Trade-in value low',
      'Financing rate concerns',
      'Additional fees surprise',
      'Availability issues',
      'Competitive offers',
    ],
    redFlagIndicators: [
      'Hidden fees',
      'Bait and switch tactics',
      'Pressure to buy today',
      'Misrepresenting vehicle history',
      'Unfair trade-in practices',
      'False urgency creation',
    ],
    qualityMarkers: [
      'Needs discovery first',
      'Transparent pricing',
      'No-pressure approach',
      'Accurate vehicle presentation',
      'Professional follow-up',
      'Customer-focused service',
    ],
  },

  hospitality: {
    id: 'hospitality',
    name: 'Hospitality & Travel',
    description: 'Hotels, restaurants, travel agencies',
    context: `
This is a hospitality/travel call. The conversation involves accommodations, reservations, or travel services.

HOSPITALITY-SPECIFIC PRIORITIES:
1. RESERVATIONS: Accuracy, confirmation, modifications
2. AMENITIES: Clear descriptions, availability
3. PRICING: Rates, packages, fees
4. SPECIAL REQUESTS: Accommodating needs
5. CANCELLATION: Policy clarity, flexibility
6. EXPERIENCE: Setting expectations appropriately
7. LOYALTY: Recognition, rewards programs
`,
    evaluationCriteria: [
      'Accurate reservation handling',
      'Clear amenity description',
      'Transparent pricing',
      'Accommodating special requests',
      'Clear cancellation policy',
      'Appropriate expectations setting',
      'Warm, hospitable demeanor',
    ],
    complianceRequirements: [
      'Cancellation policy disclosure',
      'Rate transparency',
      'Safety regulations',
      'Accessibility requirements',
      'Privacy protection',
    ],
    keyTerminology: [
      'reservation', 'booking', 'confirmation', 'rate', 'room type',
      'amenities', 'check-in', 'check-out', 'cancellation', 'deposit',
      'loyalty', 'points', 'upgrade', 'package', 'concierge',
    ],
    commonObjections: [
      'Rate concerns',
      'Availability issues',
      'Cancellation policy strictness',
      'Room type preferences',
      'Location questions',
      'Competitive options',
    ],
    redFlagIndicators: [
      'Misrepresenting amenities',
      'Hidden fees',
      'Overbooking without disclosure',
      'Ignoring special requests',
      'Cancellation policy surprises',
      'Rude or unwelcoming tone',
    ],
    qualityMarkers: [
      'Warm, welcoming tone',
      'Proactive service',
      'Attention to detail',
      'Special request accommodation',
      'Clear confirmation',
      'Appreciation expression',
    ],
  },

  legal: {
    id: 'legal',
    name: 'Legal Services',
    description: 'Law firms, legal consultations, legal services',
    context: `
This is a legal services call. The conversation involves legal inquiries, case discussions, or law firm services.

LEGAL-SPECIFIC PRIORITIES:
1. CONFIDENTIALITY: Attorney-client privilege awareness
2. SCOPE: Clear service boundaries and limitations
3. FEES: Transparent billing practices
4. EXPECTATIONS: Realistic outcome discussion
5. DOCUMENTATION: Proper intake procedures
6. URGENCY: Statute of limitations awareness
7. REFERRALS: Appropriate when outside expertise
`,
    evaluationCriteria: [
      'Maintained confidentiality appropriately',
      'Clear scope explanation',
      'Transparent fee discussion',
      'Realistic expectations set',
      'Professional intake process',
      'Appropriate urgency handling',
      'Proper referral when needed',
    ],
    complianceRequirements: [
      'Attorney-client privilege',
      'Conflict of interest checks',
      'Fee agreement requirements',
      'Statute of limitations awareness',
      'Unauthorized practice prevention',
    ],
    keyTerminology: [
      'consultation', 'retainer', 'fee agreement', 'case',
      'litigation', 'settlement', 'discovery', 'filing',
      'deadline', 'statute of limitations', 'conflict check',
    ],
    commonObjections: [
      'Fee concerns',
      'Timeline frustration',
      'Outcome uncertainty',
      'Communication gaps',
      'Process complexity',
      'Alternative dispute resolution',
    ],
    redFlagIndicators: [
      'Guaranteeing outcomes',
      'Unclear fee structures',
      'Breaching confidentiality',
      'Missing deadlines',
      'Conflict of interest issues',
      'Unauthorized legal advice',
    ],
    qualityMarkers: [
      'Professional intake',
      'Clear fee explanation',
      'Realistic expectations',
      'Timely communication',
      'Confidentiality adherence',
      'Appropriate referrals',
    ],
  },

  general: {
    id: 'general',
    name: 'General Business',
    description: 'Default template for general business calls',
    context: `
This is a general business call. Apply standard call quality analysis criteria.

GENERAL ANALYSIS PRIORITIES:
1. PROFESSIONALISM: Tone, language, demeanor
2. NEEDS ASSESSMENT: Understanding customer requirements
3. SOLUTION DELIVERY: Providing appropriate solutions
4. COMMUNICATION: Clarity and effectiveness
5. RESOLUTION: Issue handling and follow-up
6. COMPLIANCE: General business ethics
7. CUSTOMER EXPERIENCE: Overall interaction quality
`,
    evaluationCriteria: [
      'Professional communication',
      'Effective needs assessment',
      'Appropriate solution delivery',
      'Clear information provision',
      'Issue resolution effectiveness',
      'Customer satisfaction focus',
      'Proper follow-up commitment',
    ],
    complianceRequirements: [
      'General business regulations',
      'Consumer protection basics',
      'Privacy considerations',
      'Fair business practices',
      'Documentation standards',
    ],
    keyTerminology: [
      'inquiry', 'solution', 'service', 'product', 'pricing',
      'support', 'issue', 'resolution', 'follow-up', 'satisfaction',
    ],
    commonObjections: [
      'Price concerns',
      'Service issues',
      'Wait times',
      'Product availability',
      'Policy questions',
      'Competitor comparisons',
    ],
    redFlagIndicators: [
      'Unprofessional behavior',
      'Ignoring customer needs',
      'Providing inaccurate information',
      'Pressure tactics',
      'Poor issue handling',
      'Privacy violations',
    ],
    qualityMarkers: [
      'Professional greeting',
      'Active listening',
      'Clear communication',
      'Problem resolution',
      'Appropriate follow-up',
      'Positive closing',
    ],
  },
};

/**
 * Get industry prompt by ID with fallback to general
 */
export function getIndustryPrompt(industry: string): IndustryPrompt {
  const normalizedIndustry = industry.toLowerCase().replace(/[^a-z_]/g, '_') as IndustryType;
  return INDUSTRY_PROMPTS[normalizedIndustry] || INDUSTRY_PROMPTS.general;
}

/**
 * Get list of all available industries for UI dropdown
 */
export function getAvailableIndustries(): Array<{ id: IndustryType; name: string; description: string }> {
  return Object.values(INDUSTRY_PROMPTS).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}
