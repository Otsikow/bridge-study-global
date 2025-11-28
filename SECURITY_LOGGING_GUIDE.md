# 🔐 Security Logging & Monitoring Guide

This guide explains the comprehensive security logging and monitoring features introduced for the UniDoxia platform. It covers the database schema additions, the Supabase Edge Function responsible for recording events, client-side integrations, and configuration options for alerting.

## Overview

- Centralizes all security-sensitive activity in dedicated audit tables.
- Automatically records failed authentication attempts and privilege escalation errors.
- Raises alerts for suspicious patterns (e.g., repeated failed login attempts) using configurable thresholds.
- Provides a reusable RPC helper (`log_security_event`) for future server-side integrations.

## Database Changes

Located in `supabase/migrations/20251106090000_add_security_logging.sql`:

- **Enums**
  - `security_event_type`: `failed_authentication`, `privilege_escalation_attempt`, `suspicious_activity`, `policy_violation`, `custom`
  - `security_event_severity`: `low`, `medium`, `high`, `critical`
  - `security_alert_status`: `open`, `acknowledged`, `resolved`, `dismissed`

- **Tables**
  - `security_audit_logs`
    - Stores granular security events with metadata, IP, user agent, and optional tenant/user references.
  - `security_alerts`
    - Captures escalated alerts (e.g., repeated failures, privilege escalation) for follow-up.

- **Policies**
  - Service-role (Edge Functions) has unrestricted access.
  - Authenticated users can view records scoped to their tenant.

- **Helper Function**
  - `log_security_event(...) RETURNS UUID`
  - Security definer helper to create audit log entries from SQL or RPC contexts.

## Supabase Edge Function: `security-logger`

File: `supabase/functions/security-logger/index.ts`

### Responsibilities

- Validates incoming requests (accepts anon, authenticated, and service-role tokens).
- Persists events into `security_audit_logs` with normalized metadata (identifier, IP, user agent).
- Evaluates heuristics:
  - Repeated failed authentication attempts (threshold-based).
  - Automatic alerts for privilege escalation and suspicious activity events.
- Inserts alert rows into `security_alerts` when thresholds or explicit requests are met.

### Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | — | Required for service-role client |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Required for privileged inserts |
| `SUPABASE_ANON_KEY` | — | Used to accept anon invocations |
| `SECURITY_FAILED_AUTH_THRESHOLD` | `5` | Failed auth attempts required to raise an alert |
| `SECURITY_FAILED_AUTH_WINDOW_MINUTES` | `15` | Time window (minutes) for threshold evaluation |

Set these values via the Supabase CLI or dashboard before deploying the function:

```bash
supabase functions deploy security-logger \
  --env-file ./supabase/.env \
  --project-ref <project-ref>
```

> Ensure `SUPABASE_SERVICE_ROLE_KEY` is supplied securely; never expose it to the browser.

## Client-Side Instrumentation

Located in `src/lib/securityLogger.ts`:

- Provides `logSecurityEvent`, `logFailedAuthentication`, `logPrivilegeEscalationAttempt`, and `logSuspiciousActivity` helpers.
- Automatically enriches events with the current authenticated user (when available) before invoking the Edge Function.
- Captures browser `userAgent` details for traceability.

### Usage

- `src/hooks/useAuth.tsx`
  - Calls `logFailedAuthentication` whenever password sign-in fails or throws, capturing the email and error details.
- `src/lib/databaseLogger.ts`
  - Detects `permission denied`/`insufficient_privilege` errors and reports them as privilege escalation attempts with full query context.

## Testing & Verification

1. **Failed Authentication**
   - Attempt to log in with an incorrect password ≥ threshold within the window.
   - Verify new rows in `security_audit_logs` and an alert in `security_alerts` once the threshold is exceeded.

2. **Privilege Escalation**
   - Perform an operation that triggers a Supabase `42501` permission error (e.g., restricted update).
   - Confirm the event and alert creation.

3. **Edge Function Invocation**
   - Call the edge function manually:
     ```bash
     supabase functions invoke security-logger \
       --project-ref <project-ref> \
       --no-verify-jwt \
       --body '{"eventType":"custom","description":"Manual test"}'
     ```

4. **RLS Policies**
   - Using an authenticated user from a tenant, ensure they can only read their tenant’s logs.

## Operational Considerations

- Monitor `security_alerts` for open items and update `status` as incidents are triaged.
- Extend the `security-logger` function when new event types or alerting strategies are needed.
- Integrate alerts with existing notification channels (email, Slack, PagerDuty) by subscribing to changes in `security_alerts` or extending the Edge Function.

---

For questions or extensions, reference the related files:

- `supabase/migrations/20251106090000_add_security_logging.sql`
- `supabase/functions/security-logger/index.ts`
- `src/lib/securityLogger.ts`
- `src/hooks/useAuth.tsx`
- `src/lib/databaseLogger.ts`

