# Security Architecture & Compliance

## Overview
Audiolyse is designed with a "Security First" approach, specifically tailored for the medical and healthcare industry. This document outlines the technical security controls implemented to protect sensitive data (PHI/PII).

## 1. Authentication & Authorization
*   **Provider:** Supabase Auth (JWT-based).
*   **Role-Based Access Control (RBAC):**
    *   **Organization Level:** Users are scoped to Organizations.
    *   **Roles:** `owner`, `admin`, `member`.
*   **Row Level Security (RLS):**
    *   All database tables have RLS enabled.
    *   Policies utilize `SECURITY DEFINER` functions to prevent recursion and ensure strict data isolation.
    *   Users can strictly only access data belonging to their Organization.

## 2. Data Protection
*   **Encryption in Transit:** TLS 1.2+ for all API and Database connections.
*   **Encryption at Rest:** Supabase (PostgreSQL) data is encrypted at rest.
*   **Storage Security:**
    *   Audio files are stored in a private Supabase Storage bucket (`audio-files`).
    *   Storage RLS policies restrict read/write access to authenticated members of the owning organization only.
    *   Public access is disabled.

## 3. Audit Logging (HIPAA Requirement)
*   **Table:** `data_access_logs`
*   **Scope:** Tracks access to sensitive resources (Viewing Call Analysis, Playing Audio).
*   **Triggers:**
    *   `viewed`: Logged when a user opens the Call Details view.
    *   `viewed_after_upload`: Logged when a user views immediate analysis results.
*   **Retention:** Logs are immutable and stored in the database.

## 4. API Security
*   **Authentication:** All API routes (`/api/*`) verify the Supabase session token before processing requests.
*   **Validation:** Input validation checks for file types, sizes, and user membership.
*   **Service Client:** Restricted use of `service_role` client only for authorized administrative tasks (e.g., saving analysis results after permission checks).

## 5. Medical Industry Specifics
*   **Patient Consent:** The upload workflow requires explicit confirmation of patient consent.
*   **Disclaimer:** Prominent disclaimers clarify that the AI is for coaching/QA, not medical diagnosis.

## Developer Guidelines
*   **Always** use `createClient()` from `@/lib/supabase/server` for API routes to ensure user context is present.
*   **Never** use `service_role` key unless absolutely necessary and after manual permission checks.
*   **RLS Changes:** Any change to RLS policies must be peer-reviewed to prevent data leaks.
