# Audiolyse DB Schema (Supabase)

## ai_chat_sessions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `organization_id` "uuid" NOT NULL
- `context_type` "text" NOT NULL
- `context_id` "uuid"
- `title` "text"
- `messages` "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
- `message_count` integer DEFAULT 0
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## analysis_groups
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `created_by` "uuid" NOT NULL
- `name` "text"
- `custom_query` "text"
- `overall_analysis` "jsonb"
- `status` "public"."analysis_status" DEFAULT 'pending'::"public"."analysis_status"
- `total_files` integer DEFAULT 0
- `processed_files` integer DEFAULT 0
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `created_by` → `profiles.id`
- `organization_id` → `organizations.id`

## audit_logs
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid"
- `user_id` "uuid"
- `action` character varying(100) NOT NULL
- `resource_type` character varying(50)
- `resource_id` "uuid"
- `ip_address` "inet"
- `user_agent` "text"
- `metadata` "jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## badge_definitions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `name` "text" NOT NULL
- `title` "text" NOT NULL
- `description` "text" NOT NULL
- `icon` "text" NOT NULL
- `category` "text" NOT NULL
- `requirement_type` "text" NOT NULL
- `requirement_value` integer
- `requirement_json` "jsonb" DEFAULT '{}'::"jsonb"
- `points_reward` integer DEFAULT 50
- `rarity` "text" DEFAULT 'common'::"text"
- `is_active` boolean DEFAULT true
- `created_at` timestamp with time zone DEFAULT "now"()

## call_analyses
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `uploaded_by` "uuid" NOT NULL
- `team_id` "uuid"
- `file_name` "text" NOT NULL
- `file_size_bytes` bigint NOT NULL
- `file_path` "text"
- `duration_sec` integer
- `language` "text"
- `transcription` "text"
- `summary` "text"
- `overall_score` integer
- `sentiment` "text"
- `analysis_json` "jsonb"
- `status` "public"."analysis_status" DEFAULT 'pending'::"public"."analysis_status"
- `error_message` "text"
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
- `assigned_to` "uuid"
- `audio_url` "text"
- `storage_bucket` character varying(50) DEFAULT 'call-recordings'::character varying
- `customer_id` "uuid"
- `group_id` "uuid"
- `custom_analysis` "text"
Relations:
- `assigned_to` → `profiles.id`
- `customer_id` → `customer_profiles.id`
- `group_id` → `analysis_groups.id`
- `organization_id` → `organizations.id`
- `team_id` → `teams.id`
- `uploaded_by` → `profiles.id`

## challenge_participants
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `challenge_id` "uuid" NOT NULL
- `user_id` "uuid" NOT NULL
- `current_value` integer DEFAULT 0
- `completed` boolean DEFAULT false
- `completed_at` timestamp with time zone
- `rank` integer
- `joined_at` timestamp with time zone DEFAULT "now"()
Relations:
- `challenge_id` → `challenges.id`

## challenges
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `title` "text" NOT NULL
- `description` "text" NOT NULL
- `icon` "text" DEFAULT '🎯'::"text"
- `challenge_type` "text" NOT NULL
- `metric` "text" NOT NULL
- `target_value` integer NOT NULL
- `start_date` "date" NOT NULL
- `end_date` "date" NOT NULL
- `points_reward` integer DEFAULT 100
- `badge_reward` "uuid"
- `status` "text" DEFAULT 'active'::"text"
- `created_by` "uuid"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `badge_reward` → `badge_definitions.id`
- `organization_id` → `organizations.id`

## coaching_sessions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `coach_id` "uuid" NOT NULL
- `agent_id` "uuid" NOT NULL
- `session_type` "text" DEFAULT 'one_on_one'::"text"
- `title` "text" NOT NULL
- `description` "text"
- `scheduled_at` timestamp with time zone NOT NULL
- `duration_minutes` integer DEFAULT 30
- `status` "text" DEFAULT 'scheduled'::"text"
- `completed_at` timestamp with time zone
- `call_ids` "uuid"[] DEFAULT '{}'::"uuid"[]
- `agenda` "text"
- `notes` "text"
- `action_items` "jsonb" DEFAULT '[]'::"jsonb"
- `goals` "jsonb" DEFAULT '[]'::"jsonb"
- `agent_rating` integer
- `coach_notes` "text"
- `metadata` "jsonb" DEFAULT '{}'::"jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## consent_records
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `user_id` "uuid"
- `organization_id` "uuid"
- `consent_type` character varying(50) NOT NULL
- `consent_version` character varying(20) DEFAULT '1.0'::character varying NOT NULL
- `consented` boolean NOT NULL
- `ip_address` "inet"
- `user_agent` "text"
- `created_at` timestamp with time zone DEFAULT "now"()
- `withdrawn_at` timestamp with time zone
- `metadata` "jsonb"
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## credits_transactions
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `user_id` "uuid" NOT NULL
- `transaction_type` "text" NOT NULL
- `credits_amount` integer NOT NULL
- `amount_paid` numeric(10
- `currency` "public"."currency_type" DEFAULT 'INR'::"public"."currency_type"
- `description` "text"
- `metadata` "jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## customer_concerns
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `customer_id` "uuid" NOT NULL
- `organization_id` "uuid" NOT NULL
- `concern_type` character varying(30) NOT NULL
- `description` "text" NOT NULL
- `status` character varying(20) DEFAULT 'open'::character varying
- `priority` character varying(10) DEFAULT 'medium'::character varying
- `resolution` "text"
- `resolved_at` timestamp with time zone
- `resolved_by` "uuid"
- `source_interaction_id` "uuid"
- `first_mentioned` timestamp with time zone DEFAULT "now"()
- `last_mentioned` timestamp with time zone DEFAULT "now"()
- `mention_count` integer DEFAULT 1
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `customer_id` → `customer_profiles.id`
- `organization_id` → `organizations.id`
- `resolved_by` → `profiles.id`
- `source_interaction_id` → `customer_interactions.id`

## customer_interactions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `customer_id` "uuid" NOT NULL
- `organization_id` "uuid" NOT NULL
- `interaction_type` character varying(30) NOT NULL
- `call_analysis_id` "uuid"
- `sentiment` character varying(20)
- `sentiment_score` integer
- `resolution_status` character varying(20)
- `summary` "text"
- `key_topics` "text"[]
- `action_items` "text"[]
- `agent_id` "uuid"
- `interaction_date` timestamp with time zone DEFAULT "now"()
- `duration_seconds` integer
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `agent_id` → `profiles.id`
- `call_analysis_id` → `call_analyses.id`
- `customer_id` → `customer_profiles.id`
- `organization_id` → `organizations.id`

## customer_profiles
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `name` character varying(255) NOT NULL
- `email` character varying(255)
- `phone` character varying(50)
- `company` character varying(255)
- `external_id` character varying(100)
- `preferred_language` character varying(10) DEFAULT 'en'::character varying
- `preferred_contact_method` character varying(20) DEFAULT 'phone'::character varying
- `timezone` character varying(50)
- `communication_style` character varying(20)
- `decision_style` character varying(30)
- `price_sensitivity` character varying(10) DEFAULT 'medium'::character varying
- `status` character varying(20) DEFAULT 'active'::character varying
- `lifecycle_stage` character varying(30) DEFAULT 'prospect'::character varying
- `account_type` character varying(30)
- `total_calls` integer DEFAULT 0
- `avg_sentiment_score` numeric(5
- `avg_call_score` numeric(5
- `last_interaction_date` timestamp with time zone
- `first_interaction_date` timestamp with time zone
- `notes` "text"
- `tags` "text"[]
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
- `created_by` "uuid"
Relations:
- `created_by` → `profiles.id`
- `organization_id` → `organizations.id`

## data_retention_policies
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid"
- `call_retention_days` integer DEFAULT 30
- `audio_retention_days` integer DEFAULT 30
- `audit_log_retention_days` integer DEFAULT 730
- `auto_delete_enabled` boolean DEFAULT true
- `legal_hold_active` boolean DEFAULT false
- `legal_hold_reason` "text"
- `legal_hold_started_at` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## data_subject_requests
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `user_id` "uuid"
- `request_type` character varying(50) NOT NULL
- `status` character varying(20) DEFAULT 'pending'::character varying
- `requested_at` timestamp with time zone DEFAULT "now"()
- `completed_at` timestamp with time zone
- `completed_by` "uuid"
- `response_notes` "text"
- `metadata` "jsonb"
Relations:
- `completed_by` → `profiles.id`
- `user_id` → `profiles.id`

## enterprise_leads
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `company_name` character varying(255) NOT NULL
- `contact_name` character varying(255) NOT NULL
- `email` character varying(255) NOT NULL
- `phone` character varying(50)
- `company_size` character varying(50)
- `industry` character varying(100)
- `estimated_monthly_calls` integer
- `current_solution` "text"
- `requirements` "text"
- `source` character varying(100) DEFAULT 'pricing_page'::character varying
- `status` character varying(50) DEFAULT 'new'::character varying
- `notes` "text"
- `assigned_to` "uuid"
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
- `contacted_at` timestamp with time zone
- `closed_at` timestamp with time zone
Relations:
- `assigned_to` → `profiles.id`

## invitations
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `email` "text" NOT NULL
- `role` "public"."user_role" DEFAULT 'member'::"public"."user_role"
- `token` "text" NOT NULL
- `invited_by` "uuid" NOT NULL
- `expires_at` timestamp with time zone NOT NULL
- `accepted_at` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `invited_by` → `profiles.id`
- `organization_id` → `organizations.id`

## leaderboard_snapshots
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `period_type` "text" NOT NULL
- `period_start` "date" NOT NULL
- `period_end` "date" NOT NULL
- `rankings` "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## legal_document_versions
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `document_type` character varying(50) NOT NULL
- `version` character varying(20) NOT NULL
- `content` "text"
- `summary_of_changes` "text"
- `effective_date` "date" NOT NULL
- `created_at` timestamp with time zone DEFAULT "now"()
- `created_by` "uuid"
Relations:
- `created_by` → `profiles.id`

## login_history
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `organization_id` "uuid"
- `event_type` "text" NOT NULL
- `success` boolean DEFAULT true
- `ip_address` "inet"
- `user_agent` "text"
- `device_type` "text"
- `browser` "text"
- `os` "text"
- `country` "text"
- `city` "text"
- `session_id` "text"
- `risk_score` integer DEFAULT 0
- `risk_factors` "text"[]
- `is_suspicious` boolean DEFAULT false
- `metadata` "jsonb" DEFAULT '{}'::"jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## manager_alert_configs
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `manager_id` "uuid" NOT NULL
- `low_score_threshold` integer DEFAULT 60
- `negative_sentiment_alert` boolean DEFAULT true
- `forced_sale_alert` boolean DEFAULT true
- `compliance_violation_alert` boolean DEFAULT true
- `email_alerts` boolean DEFAULT true
- `in_app_alerts` boolean DEFAULT true
- `alert_frequency` "text" DEFAULT 'realtime'::"text"
- `digest_time` time without time zone DEFAULT '09:00:00'::time without time zone
- `monitored_agent_ids` "uuid"[]
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## mfa_settings
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `mfa_enabled` boolean DEFAULT false
- `mfa_method` "text" DEFAULT 'totp'::"text"
- `backup_codes` "text"[]
- `recovery_email` "text"
- `recovery_phone` "text"
- `last_mfa_challenge` timestamp with time zone
- `failed_attempts` integer DEFAULT 0
- `locked_until` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()

## notifications
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `user_id` "uuid"
- `organization_id` "uuid"
- `type` character varying(50) NOT NULL
- `title` character varying(255) NOT NULL
- `message` "text"
- `link` character varying(500)
- `read_at` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
- `metadata` "jsonb"
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## objection_playbooks
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `objection_text` "text" NOT NULL
- `objection_category` "text" NOT NULL
- `responses` "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
- `best_response_index` integer DEFAULT 0
- `occurrence_count` integer DEFAULT 0
- `success_rate` numeric(3
- `industry_tags` "text"[] DEFAULT '{}'::"text"[]
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## organization_members
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `user_id` "uuid" NOT NULL
- `role` "public"."user_role" DEFAULT 'member'::"public"."user_role"
- `invited_by` "uuid"
- `invited_at` timestamp with time zone
- `joined_at` timestamp with time zone DEFAULT "now"()
- `reports_to` "uuid"
- `department` "text"
- `title` "text"
Relations:
- `invited_by` → `profiles.id`
- `organization_id` → `organizations.id`
- `reports_to` → `profiles.id`
- `user_id` → `profiles.id`

## organizations
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `name` "text" NOT NULL
- `slug` "text" NOT NULL
- `logo_url` "text"
- `owner_id` "uuid" NOT NULL
- `subscription_tier` "public"."subscription_tier" DEFAULT 'free'::"public"."subscription_tier"
- `subscription_status` "public"."subscription_status" DEFAULT 'active'::"public"."subscription_status"
- `subscription_id` "text"
- `calls_limit` integer DEFAULT 3
- `calls_used` integer DEFAULT 0
- `storage_limit_mb` integer DEFAULT 50
- `storage_used_mb` numeric(10
- `users_limit` integer DEFAULT 1
- `billing_email` "text"
- `current_period_start` timestamp with time zone
- `current_period_end` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
- `credits_balance` integer DEFAULT 0
- `daily_reset_date` "date"
- `industry` "text"
- `onboarding_completed` boolean DEFAULT false
- `ai_settings` "jsonb" DEFAULT '{}'::"jsonb"
- `hipaa_covered_entity` boolean DEFAULT false
- `baa_signed_at` timestamp with time zone
- `baa_document_url` "text"
- `baa_signatory_name` character varying(255)
- `baa_signatory_email` character varying(255)
- `billing_interval` character varying(20) DEFAULT 'monthly'::character varying
- `annual_discount_applied` boolean DEFAULT false
Relations:
- `owner_id` → `profiles.id`

## password_policies
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `min_length` integer DEFAULT 8
- `require_uppercase` boolean DEFAULT true
- `require_lowercase` boolean DEFAULT true
- `require_numbers` boolean DEFAULT true
- `require_special` boolean DEFAULT true
- `password_history_count` integer DEFAULT 5
- `max_age_days` integer DEFAULT 90
- `max_failed_attempts` integer DEFAULT 5
- `lockout_duration_minutes` integer DEFAULT 30
- `require_mfa` boolean DEFAULT false
- `mfa_grace_period_days` integer DEFAULT 7
- `session_timeout_minutes` integer DEFAULT 480
- `concurrent_sessions` integer DEFAULT 5
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## payment_idempotency
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `idempotency_key` character varying(255) NOT NULL
- `razorpay_order_id` character varying(255)
- `razorpay_payment_id` character varying(255)
- `organization_id` "uuid"
- `user_id` "uuid"
- `credits` integer
- `amount` numeric(10
- `currency` character varying(3)
- `status` character varying(50) DEFAULT 'pending'::character varying
- `processed_at` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
- `metadata` "jsonb"
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## payment_receipts
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid"
- `user_id` "uuid"
- `razorpay_payment_id` character varying(255)
- `razorpay_order_id` character varying(255)
- `razorpay_subscription_id` character varying(255)
- `receipt_number` character varying(50) NOT NULL
- `amount` numeric(10
- `currency` character varying(3) DEFAULT 'INR'::character varying NOT NULL
- `tax_amount` numeric(10
- `total_amount` numeric(10
- `payment_type` character varying(50) NOT NULL
- `description` "text"
- `billing_name` character varying(255)
- `billing_email` character varying(255)
- `billing_address` "text"
- `gstin` character varying(20)
- `status` character varying(50) DEFAULT 'paid'::character varying
- `pdf_url` "text"
- `metadata` "jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## permissions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `name` "text" NOT NULL
- `description` "text"
- `category` "text" NOT NULL
- `created_at` timestamp with time zone DEFAULT "now"()

## phi_access_logs
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `user_id` "uuid"
- `organization_id` "uuid"
- `resource_type` character varying(50) NOT NULL
- `resource_id` "uuid"
- `action` character varying(50) NOT NULL
- `ip_address` "inet"
- `user_agent` "text"
- `accessed_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## points_history
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `organization_id` "uuid" NOT NULL
- `points` integer NOT NULL
- `action` "text" NOT NULL
- `description` "text"
- `related_type` "text"
- `related_id` "uuid"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## profiles
Columns:
- `id` "uuid" NOT NULL
- `email` "text" NOT NULL
- `full_name` "text"
- `avatar_url` "text"
- `phone` "text"
- `country` "text" DEFAULT 'IN'::"text"
- `currency` "public"."currency_type" DEFAULT 'INR'::"public"."currency_type"
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
- `is_admin` boolean DEFAULT false
- `job_title` "text"

## rate_limit_tracking
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `identifier` character varying(255) NOT NULL
- `endpoint` character varying(100) NOT NULL
- `request_count` integer DEFAULT 1
- `window_start` timestamp with time zone DEFAULT "now"()
- `created_at` timestamp with time zone DEFAULT "now"()

## role_permissions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `role` "text" NOT NULL
- `permission_id` "uuid" NOT NULL
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `permission_id` → `permissions.id`

## script_library
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `title` "text" NOT NULL
- `description` "text"
- `category` "text" NOT NULL
- `script_text` "text" NOT NULL
- `scenario_tags` "text"[] DEFAULT '{}'::"text"[]
- `industry_tags` "text"[] DEFAULT '{}'::"text"[]
- `usage_count` integer DEFAULT 0
- `avg_effectiveness` numeric(3
- `is_template` boolean DEFAULT false
- `is_active` boolean DEFAULT true
- `created_by` "uuid"
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## security_alerts
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `organization_id` "uuid"
- `alert_type` "text" NOT NULL
- `severity` "text" NOT NULL
- `title` "text" NOT NULL
- `description` "text"
- `login_history_id` "uuid"
- `session_id` "uuid"
- `status` "text" DEFAULT 'new'::"text"
- `acknowledged_by` "uuid"
- `acknowledged_at` timestamp with time zone
- `resolved_at` timestamp with time zone
- `metadata` "jsonb" DEFAULT '{}'::"jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `login_history_id` → `login_history.id`
- `organization_id` → `organizations.id`
- `session_id` → `user_sessions.id`

## team_members
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `team_id` "uuid" NOT NULL
- `user_id` "uuid" NOT NULL
- `role` "public"."team_role" DEFAULT 'member'::"public"."team_role"
- `joined_at` timestamp with time zone DEFAULT "now"()
Relations:
- `team_id` → `teams.id`
- `user_id` → `profiles.id`

## teams
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `name` "text" NOT NULL
- `description` "text"
- `created_by` "uuid" NOT NULL
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `created_by` → `profiles.id`
- `organization_id` → `organizations.id`

## training_resources
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `title` "text" NOT NULL
- `description` "text"
- `resource_type` "text" NOT NULL
- `url` "text"
- `content` "text"
- `duration_minutes` integer
- `category` "text" NOT NULL
- `skill_level` "text" DEFAULT 'beginner'::"text"
- `tags` "text"[] DEFAULT '{}'::"text"[]
- `view_count` integer DEFAULT 0
- `avg_rating` numeric(2
- `required_for_roles` "text"[] DEFAULT '{}'::"text"[]
- `prerequisite_ids` "uuid"[] DEFAULT '{}'::"uuid"[]
- `is_active` boolean DEFAULT true
- `created_by` "uuid"
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## usage_logs
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `user_id` "uuid" NOT NULL
- `action` "public"."usage_action" NOT NULL
- `call_analysis_id` "uuid"
- `metadata` "jsonb"
- `created_at` timestamp with time zone DEFAULT "now"()
Relations:
- `call_analysis_id` → `call_analyses.id`
- `organization_id` → `organizations.id`
- `user_id` → `profiles.id`

## user_badges
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `badge_id` "uuid" NOT NULL
- `organization_id` "uuid" NOT NULL
- `earned_at` timestamp with time zone DEFAULT "now"()
- `progress` integer DEFAULT 0
- `progress_max` integer DEFAULT 0
Relations:
- `badge_id` → `badge_definitions.id`
- `organization_id` → `organizations.id`

## user_document_acceptances
Columns:
- `id` "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL
- `user_id` "uuid"
- `document_type` character varying(50) NOT NULL
- `document_version` character varying(20) NOT NULL
- `accepted_at` timestamp with time zone DEFAULT "now"()
- `ip_address` "inet"
Relations:
- `user_id` → `profiles.id`

## user_points
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `organization_id` "uuid" NOT NULL
- `total_points` integer DEFAULT 0
- `level` integer DEFAULT 1
- `calls_analyzed_points` integer DEFAULT 0
- `high_score_points` integer DEFAULT 0
- `improvement_points` integer DEFAULT 0
- `streak_points` integer DEFAULT 0
- `achievement_points` integer DEFAULT 0
- `current_streak` integer DEFAULT 0
- `longest_streak` integer DEFAULT 0
- `last_activity_date` "date"
- `points_to_next_level` integer DEFAULT 100
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`

## user_sessions
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `session_token` "text" NOT NULL
- `refresh_token` "text"
- `ip_address` "inet"
- `user_agent` "text"
- `device_type` "text"
- `device_name` "text"
- `browser` "text"
- `os` "text"
- `country` "text"
- `city` "text"
- `is_current` boolean DEFAULT false
- `is_active` boolean DEFAULT true
- `last_activity` timestamp with time zone DEFAULT "now"()
- `expires_at` timestamp with time zone
- `created_at` timestamp with time zone DEFAULT "now"()
- `revoked_at` timestamp with time zone

## user_training_progress
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `user_id` "uuid" NOT NULL
- `resource_id` "uuid" NOT NULL
- `status` "text" DEFAULT 'not_started'::"text"
- `progress_percent` integer DEFAULT 0
- `started_at` timestamp with time zone
- `completed_at` timestamp with time zone
- `user_rating` integer
Relations:
- `resource_id` → `training_resources.id`

## webhook_deliveries
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `webhook_id` "uuid" NOT NULL
- `event_type` "text" NOT NULL
- `payload` "jsonb" NOT NULL
- `status` "text" DEFAULT 'pending'::"text"
- `http_status` integer
- `response_body` "text"
- `attempt_count` integer DEFAULT 0
- `created_at` timestamp with time zone DEFAULT "now"()
- `delivered_at` timestamp with time zone
Relations:
- `webhook_id` → `webhooks.id`

## webhooks
Columns:
- `id` "uuid" DEFAULT "gen_random_uuid"() NOT NULL
- `organization_id` "uuid" NOT NULL
- `name` "text" NOT NULL
- `url` "text" NOT NULL
- `secret` "text"
- `events` "text"[] DEFAULT '{}'::"text"[] NOT NULL
- `is_active` boolean DEFAULT true
- `total_calls` integer DEFAULT 0
- `successful_calls` integer DEFAULT 0
- `last_triggered_at` timestamp with time zone
- `last_error` "text"
- `last_error_at` timestamp with time zone
- `custom_headers` "jsonb" DEFAULT '{}'::"jsonb"
- `retry_count` integer DEFAULT 3
- `created_at` timestamp with time zone DEFAULT "now"()
- `updated_at` timestamp with time zone DEFAULT "now"()
Relations:
- `organization_id` → `organizations.id`
