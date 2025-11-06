import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventType = Database['public']['Enums']['security_event_type'];
type Severity = Database['public']['Enums']['security_event_severity'];

interface BaseSecurityPayload {
  description?: string;
  metadata?: Record<string, unknown>;
  tenantId?: string | null;
  userId?: string | null;
  actorEmail?: string | null;
  severity?: Severity;
  alert?: boolean | { summary?: string; details?: string };
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface SecurityLogPayload extends BaseSecurityPayload {
  eventType: EventType;
}

const DEFAULT_SEVERITY: Record<EventType, Severity> = {
  failed_authentication: 'medium',
  privilege_escalation_attempt: 'high',
  suspicious_activity: 'high',
  policy_violation: 'medium',
  custom: 'low',
};

async function resolveAuthContext(
  payload: SecurityLogPayload,
): Promise<{ userId: string | null; actorEmail: string | null }> {
  if (payload.userId && payload.actorEmail) {
    return { userId: payload.userId, actorEmail: payload.actorEmail };
  }

  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    return {
      userId: payload.userId ?? user?.id ?? null,
      actorEmail: payload.actorEmail ?? user?.email ?? null,
    };
  } catch {
    return {
      userId: payload.userId ?? null,
      actorEmail: payload.actorEmail ?? null,
    };
  }
}

export async function logSecurityEvent(payload: SecurityLogPayload) {
  try {
    const severity = payload.severity ?? DEFAULT_SEVERITY[payload.eventType];
    const { userId, actorEmail } = await resolveAuthContext(payload);

    const body = {
      eventType: payload.eventType,
      severity,
      description: payload.description,
      tenantId: payload.tenantId ?? null,
      userId,
      actorEmail,
      metadata: payload.metadata ?? {},
      alert: payload.alert ?? false,
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? (typeof window !== 'undefined' ? window.navigator.userAgent : null),
    };

    const { error } = await supabase.functions.invoke('security-logger', {
      body,
    });

    if (error) {
      console.error('Failed to invoke security logger function', error);
    }
  } catch (error) {
    console.error('Failed to log security event', error);
  }
}

export async function logFailedAuthentication(
  email: string,
  reason: string,
  metadata: Record<string, unknown> = {},
) {
  await logSecurityEvent({
    eventType: 'failed_authentication',
    description: `Failed authentication attempt for ${email}`,
    actorEmail: email,
    metadata: { email, reason, ...metadata },
  });
}

export async function logPrivilegeEscalationAttempt(details: {
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  await logSecurityEvent({
    eventType: 'privilege_escalation_attempt',
    description: details.description ?? 'Privilege escalation attempt detected',
    metadata: details.metadata,
    alert: true,
  });
}

export async function logSuspiciousActivity(details: {
  description: string;
  metadata?: Record<string, unknown>;
  severity?: Severity;
}) {
  await logSecurityEvent({
    eventType: 'suspicious_activity',
    description: details.description,
    metadata: details.metadata,
    severity: details.severity,
    alert: true,
  });
}

