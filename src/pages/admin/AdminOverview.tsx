"use client";

import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminOverviewMetrics,
  useAdmissionsTrends,
  useApplicationsByCountry,
  useAdminRecentActivity,
  useSystemHealth,
} from "@/hooks/admin/useAdminOverviewData";
import ZoeAdminInsightsPanel from "@/components/admin/ZoeAdminInsightsPanel";
import AdminReportExportButton from "@/components/admin/AdminReportExportButton";
import { LoadingState } from "@/components/LoadingState";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

/* -------------------------------------------------------------------------- */
/* ✅ KPI Configuration                                                      */
/* -------------------------------------------------------------------------- */
const KPI_CONFIG = [
  { key: "totalStudents", labelKey: "admin.overview.kpis.totalStudents", defaultLabel: "Total Students" },
  { key: "totalAgents", labelKey: "admin.overview.kpis.totalAgents", defaultLabel: "Total Agents" },
  { key: "totalUniversities", labelKey: "admin.overview.kpis.totalUniversities", defaultLabel: "Total Universities" },
  { key: "activeApplications", labelKey: "admin.overview.kpis.activeApplications", defaultLabel: "Active Applications" },
  {
    key: "totalCommissionPaid",
    labelKey: "admin.overview.kpis.totalCommissionPaid",
    defaultLabel: "Total Commission Paid",
    format: "currency",
  },
  { key: "pendingVerifications", labelKey: "admin.overview.kpis.pendingVerifications", defaultLabel: "Pending Verifications" },
] as const;

/* -------------------------------------------------------------------------- */
/* ✅ Utility Functions                                                      */
/* -------------------------------------------------------------------------- */
const formatValue = (value: number, format?: "currency", currency = "USD", locale = "en") => {
  if (format === "currency") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
};

const getHealthStyles = (status: string, t: TFunction) => {
  switch (status) {
    case "operational":
      return {
        label: t("admin.overview.health.operational", { defaultValue: "Operational" }),
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
        accent: "text-emerald-500",
      };
    case "monitoring":
      return {
        label: t("admin.overview.health.monitoring", { defaultValue: "Monitoring" }),
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
        accent: "text-amber-500",
      };
    case "degraded":
      return {
        label: t("admin.overview.health.degraded", { defaultValue: "Degraded" }),
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
        accent: "text-orange-500",
      };
    case "critical":
      return {
        label: t("admin.overview.health.critical", { defaultValue: "Critical" }),
        badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
        accent: "text-red-500",
      };
    default:
      return {
        label: t("admin.overview.health.unknown", { defaultValue: "Unknown" }),
        badge: "bg-muted text-muted-foreground",
        accent: "text-muted-foreground",
      };
  }
};

/* -------------------------------------------------------------------------- */
/* ✅ Main Component                                                         */
/* -------------------------------------------------------------------------- */
const AdminOverview = () => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const { t, i18n } = useTranslation();
  const translate = useCallback(
    (key: string, defaultValue: string, options?: Record<string, unknown>) =>
      t(key, { defaultValue, ...options }),
    [t],
  );

  const openZoe = (prompt: string) =>
    typeof window !== "undefined" &&
    window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));

  /* ---------------------------------------------------------------------- */
  /* ✅ Data Queries                                                        */
  /* ---------------------------------------------------------------------- */
  const metricsQuery = useAdminOverviewMetrics(tenantId);
  const trendsQuery = useAdmissionsTrends(tenantId);
  const geographyQuery = useApplicationsByCountry(tenantId);
  const activityQuery = useAdminRecentActivity(tenantId);
  const healthQuery = useSystemHealth(tenantId);
  const loadingState = metricsQuery.isLoading && !metricsQuery.data;

  /* ---------------------------------------------------------------------- */
  /* ✅ Charts                                                              */
  /* ---------------------------------------------------------------------- */
  const chartContent = useMemo(() => {
    if (trendsQuery.isLoading)
      return <LoadingState message={t("admin.overview.loading.trends", { defaultValue: "Loading admissions trends" })} size="sm" />;
    if (!trendsQuery.data?.length)
      return <p className="text-sm text-muted-foreground">{t("admin.overview.emptyStates.noAdmissions", { defaultValue: "No admissions activity recorded for the selected period." })}</p>;

    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={trendsQuery.data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" stroke="currentColor" className="text-xs text-muted-foreground" />
          <YAxis stroke="currentColor" className="text-xs text-muted-foreground" allowDecimals={false} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="submitted" strokeWidth={2} stroke="hsl(var(--chart-1))"
            name={t("admin.overview.trends.submitted", { defaultValue: "Submitted" })} />
          <Line type="monotone" dataKey="enrolled" strokeWidth={2} stroke="hsl(var(--chart-2))"
            name={t("admin.overview.trends.enrolled", { defaultValue: "Enrolled" })} />
        </LineChart>
      </ResponsiveContainer>
    );
  }, [t, trendsQuery]);

  const barChart = useMemo(() => {
    if (geographyQuery.isLoading)
      return <LoadingState message={t("admin.overview.loading.geography", { defaultValue: "Loading geographic mix" })} size="sm" />;
    if (!geographyQuery.data?.length)
      return <p className="text-sm text-muted-foreground">{t("admin.overview.emptyStates.noApplications", { defaultValue: "No in-flight applications available." })}</p>;

    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={geographyQuery.data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="country" stroke="currentColor" className="text-xs text-muted-foreground" />
          <YAxis stroke="currentColor" className="text-xs text-muted-foreground" allowDecimals={false} />
          <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="applications" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }, [geographyQuery, t]);

  /* ---------------------------------------------------------------------- */
  /* ✅ KPI Cards                                                           */
  /* ---------------------------------------------------------------------- */
  const kpiCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {KPI_CONFIG.map((item) => {
        const value = metricsQuery.data?.[item.key] ?? 0;
        const display =
          item.format === "currency"
            ? formatValue(value, "currency", metricsQuery.data?.currency, i18n.language)
            : formatValue(value, undefined, undefined, i18n.language);
        return (
          <Card key={item.key}>
            <CardHeader className="flex items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(item.labelKey, { defaultValue: item.defaultLabel })}
              </CardTitle>
              {item.key === "pendingVerifications" && value > 0 && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-amber-600">
                  {t("admin.overview.badges.actionRequired", { defaultValue: "Action Required" })}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {metricsQuery.isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold tracking-tight">{display}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.overview.kpis.lastUpdated", {
                  defaultValue: "Updated {{time}}",
                  time: metricsQuery.data?.lastUpdated
                    ? formatDistanceToNow(new Date(metricsQuery.data.lastUpdated), { addSuffix: true })
                    : t("admin.overview.kpis.justNow", { defaultValue: "moments ago" }),
                })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  /* ---------------------------------------------------------------------- */
  /* ✅ Recent Activity                                                     */
  /* ---------------------------------------------------------------------- */
  const recentActivity = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            {t("admin.overview.recentActivity.title", { defaultValue: "Recent activity" })}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("admin.overview.recentActivity.subtitle", { defaultValue: "Latest tenant-wide audit events" })}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openZoe(translate("admin.overview.recentActivity.prompt", "Summarize today’s critical audit events"))}
        >
          <ArrowUpRight className="h-4 w-4" />
          {t("admin.overview.recentActivity.cta", { defaultValue: "Escalate with Zoe" })}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {activityQuery.isLoading && <LoadingState message={t("admin.overview.loading.activity", { defaultValue: "Loading activity" })} size="sm" />}
            {!activityQuery.isLoading && (!activityQuery.data?.length) && (
              <p className="p-4 text-sm text-muted-foreground">
                {t("admin.overview.recentActivity.empty", { defaultValue: "No recent activity recorded." })}
              </p>
            )}
            {activityQuery.data?.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.entity}</p>
                  {item.user?.full_name && (
                    <p className="text-xs text-muted-foreground">
                      {t("admin.overview.recentActivity.byUser", { defaultValue: "by {{name}}", name: item.user.full_name })}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const healthStyles = getHealthStyles(healthQuery.data?.status ?? "unknown", t);

  /* ---------------------------------------------------------------------- */
  /* ✅ Render                                                              */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.overview.title", { defaultValue: "Operations overview" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.overview.subtitle", {
              defaultValue: "Monitor admissions momentum, commercial health, and platform activity in one unified console.",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminReportExportButton tenantId={tenantId} defaultReportType="admissions" />
        </div>
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {kpiCards}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {t("admin.overview.trends.title", { defaultValue: "Admissions trends" })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.overview.trends.subtitle", { defaultValue: "Rolling six-month submission and enrollment cadence" })}
                </p>
              </CardHeader>
              <CardContent className="pt-2">{chartContent}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {t("admin.overview.geography.title", { defaultValue: "Applications by country" })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.overview.geography.subtitle", { defaultValue: "Current pipeline distribution by destination" })}
                </p>
              </CardHeader>
              <CardContent className="pt-2">{barChart}</CardContent>
            </Card>
          </div>

          {recentActivity}
          <ZoeAdminInsightsPanel
            metrics={metricsQuery.data}
            trends={trendsQuery.data}
            geography={geographyQuery.data}
            loading={loadingState}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t("admin.overview.quickActions.title", { defaultValue: "Quick actions" })}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("admin.overview.quickActions.subtitle", { defaultValue: "Resolve high-impact workflow blockers" })}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                variant="default"
                className="justify-start gap-3"
                onClick={() =>
                  openZoe(translate("admin.overview.quickActions.agentsPrompt", "List agents awaiting approval and potential risks"))
                }
              >
                <Activity className="h-4 w-4" />
                {t("admin.overview.quickActions.agents", { defaultValue: "Approve New Agents" })}
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3"
                onClick={() =>
                  openZoe(translate("admin.overview.quickActions.universitiesPrompt", "Which universities are pending onboarding tasks?"))
                }
              >
                <ArrowUpRight className="h-4 w-4" />
                {t("admin.overview.quickActions.universities", { defaultValue: "Approve Universities" })}
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-3"
                onClick={() =>
                  openZoe(translate("admin.overview.quickActions.compliancePrompt", "Show profiles flagged for compliance review"))
                }
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t("admin.overview.quickActions.compliance", { defaultValue: "Review Flagged Profiles" })}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  {t("admin.overview.health.title", { defaultValue: "System health" })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("admin.overview.health.subtitle", { defaultValue: "Security signals aggregated from the last 30 days" })}
                </p>
              </div>
              <Badge className={healthStyles.badge}>{healthStyles.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-semibold ${healthStyles.accent}`}>{healthQuery.data?.score ?? 0}</p>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("admin.overview.health.scoreLabel", { defaultValue: "risk score" })}
                </span>
              </div
