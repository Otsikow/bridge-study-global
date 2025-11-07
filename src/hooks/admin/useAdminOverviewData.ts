import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatISO, subMonths } from "date-fns";

type Nullable<T> = T | null | undefined;

export interface AdminOverviewMetrics {
  totalStudents: number;
  totalAgents: number;
  totalUniversities: number;
  activeApplications: number;
  totalCommissionPaid: number;
  pendingVerifications: number;
  currency: string;
  lastUpdated: string;
}

export interface AdmissionsTrendPoint {
  month: string;
  submitted: number;
  enrolled: number;
}

export interface ApplicationsByCountryPoint {
  country: string;
  applications: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export type SystemHealthStatus = "operational" | "monitoring" | "degraded" | "critical" | "unknown";

export interface SystemHealthSummary {
  status: SystemHealthStatus;
  score: number;
  incidents: Array<{
    id: string;
    event_type: string | null;
    severity: "low" | "medium" | "high" | "critical" | null;
    created_at: string;
    metadata?: Record<string, unknown> | null;
  }>;
  updatedAt: string;
  recommendations: string[];
}

const ACTIVE_STATUSES = [
  "submitted",
  "screening",
  "conditional_offer",
  "unconditional_offer",
  "cas_loa",
  "visa",
];

const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 1,
  medium: 3,
  high: 6,
  critical: 10,
};

const DEFAULT_CURRENCY = "USD";

const safeCount = (count: Nullable<number>) => (typeof count === "number" && Number.isFinite(count) ? count : 0);

const safeNumber = (value: Nullable<number>) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const useAdminOverviewMetrics = (tenantId?: string | null) =>
  useQuery<AdminOverviewMetrics>({
    queryKey: ["admin", "overview", "metrics", tenantId],
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant not available for metrics query");
      }

      const [students, agents, universities, applications, commissions, pendingAgents, pendingUniversities] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("role", "student"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("role", "agent"),
        supabase
          .from("universities")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .in("status", ACTIVE_STATUSES),
        supabase
          .from("commissions")
          .select("amount,status", { head: false })
          .eq("tenant_id", tenantId)
          .eq("status", "paid"),
        supabase
          .from("agents")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("verification_status", "pending"),
        supabase
          .from("universities")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("partnership_status", "pending"),
      ]);

      const errors = [students.error, agents.error, universities.error, applications.error, commissions.error, pendingAgents.error, pendingUniversities.error].filter(
        Boolean,
      );

      if (errors.length > 0) {
        throw errors[0];
      }

      const commissionTotal = (commissions.data ?? []).reduce((total, record) => {
        const amount = safeNumber((record as { amount?: number }).amount);
        return total + amount;
      }, 0);

      return {
        totalStudents: safeCount(students.count),
        totalAgents: safeCount(agents.count),
        totalUniversities: safeCount(universities.count),
        activeApplications: safeCount(applications.count),
        totalCommissionPaid: commissionTotal,
        pendingVerifications: safeCount(pendingAgents.count) + safeCount(pendingUniversities.count),
        currency: DEFAULT_CURRENCY,
        lastUpdated: new Date().toISOString(),
      };
    },
  });

export const useAdmissionsTrends = (tenantId?: string | null) =>
  useQuery<AdmissionsTrendPoint[]>({
    queryKey: ["admin", "overview", "admissions-trends", tenantId],
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant not available for admissions trend query");
      }

      const startDate = subMonths(new Date(), 5);
      const { data, error } = await supabase
        .from("applications")
        .select("id, created_at, status")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatISO(startDate));

      if (error) {
        throw error;
      }

      const monthLabels = Array.from({ length: 6 }, (_, index) => {
        const date = subMonths(new Date(), 5 - index);
        return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
      });

      const template = monthLabels.map((label) => ({
        month: label,
        submitted: 0,
        enrolled: 0,
      }));

      const now = Date.now();
      const monthMs = 1000 * 60 * 60 * 24 * 30;

      for (const application of data ?? []) {
        const created = application.created_at ? new Date(application.created_at) : null;
        if (!created) continue;

        const diff = Math.floor((now - created.getTime()) / monthMs);
        const bounded = Math.min(5, Math.max(0, diff));
        const label = monthLabels[5 - bounded] ?? null;
        if (!label) continue;

        const record = template.find((item) => item.month === label);
        if (!record) continue;

        const status = (application.status ?? "").toLowerCase();
        if (status === "enrolled" || status === "visa") {
          record.enrolled += 1;
        }
        if (status && status !== "draft" && status !== "withdrawn") {
          record.submitted += 1;
        }
      }

      return template;
    },
  });

export const useApplicationsByCountry = (tenantId?: string | null) =>
  useQuery<ApplicationsByCountryPoint[]>({
    queryKey: ["admin", "overview", "applications-by-country", tenantId],
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant not available for application geography query");
      }

      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          program:programs (
            university:universities (country)
          )
        `,
        )
        .eq("tenant_id", tenantId)
        .in("status", ACTIVE_STATUSES);

      if (error) {
        throw error;
      }

      const counts = new Map<string, number>();

      for (const record of data ?? []) {
        const country =
          (record.program as { university?: { country?: string | null } | null } | null)?.university?.country?.trim();
        const normalized = country && country.length > 0 ? country : "Unknown";
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }

      return Array.from(counts.entries())
        .map(([country, applications]) => ({ country, applications }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 8);
    },
  });

export const useAdminRecentActivity = (tenantId?: string | null) =>
  useQuery<AuditLogEntry[]>({
    queryKey: ["admin", "overview", "recent-activity", tenantId],
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant not available for audit log query");
      }

      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          `
          id,
          action,
          entity,
          created_at,
          user:profiles!audit_logs_user_id_fkey (
            full_name,
            email
          )
        `,
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        throw error;
      }

      return (data ?? []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        created_at: entry.created_at,
        user: (entry as { user?: { full_name: string | null; email: string | null } | null }).user ?? null,
      }));
    },
  });

export const useSystemHealth = (tenantId?: string | null) =>
  useQuery<SystemHealthSummary>({
    queryKey: ["admin", "overview", "system-health", tenantId],
    enabled: Boolean(tenantId),
    refetchInterval: 120_000,
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant not available for system health query");
      }

      const since = subMonths(new Date(), 1);
      const { data, error, status } = await supabase
        .from("security_audit_logs")
        .select("id,event_type,severity,metadata,created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatISO(since))
        .order("created_at", { ascending: false })
        .limit(25);

      if (error && status !== 406) {
        throw error;
      }

      const incidents = (data ?? []).map((event) => ({
        id: event.id,
        event_type: (event as { event_type?: string | null }).event_type ?? null,
        severity: (event as { severity?: "low" | "medium" | "high" | "critical" | null }).severity ?? null,
        metadata: (event as { metadata?: Record<string, unknown> | null }).metadata ?? null,
        created_at: event.created_at,
      }));

      const score = incidents.reduce((total, incident) => {
        if (!incident.severity) return total;
        return total + (SEVERITY_WEIGHTS[incident.severity] ?? 1);
      }, 0);

      let statusLabel: SystemHealthStatus = "operational";
      if (incidents.some((incident) => incident.severity === "critical")) {
        statusLabel = "critical";
      } else if (incidents.some((incident) => incident.severity === "high")) {
        statusLabel = "degraded";
      } else if (score > 6) {
        statusLabel = "monitoring";
      } else if (incidents.length === 0) {
        statusLabel = "operational";
      }

      const recommendations: string[] = [];
      if (statusLabel === "critical" || statusLabel === "degraded") {
        recommendations.push("Escalate to the security team and review the latest incidents immediately.");
      }
      if (score > 0 && statusLabel !== "critical") {
        recommendations.push("Audit access logs and confirm MFA enforcement for administrative users.");
      }
      if (recommendations.length === 0) {
        recommendations.push("System health is normal. Continue monitoring automated alerts.");
      }

      return {
        status: incidents.length === 0 ? "operational" : statusLabel,
        score,
        incidents,
        updatedAt: new Date().toISOString(),
        recommendations,
      };
    },
  });
