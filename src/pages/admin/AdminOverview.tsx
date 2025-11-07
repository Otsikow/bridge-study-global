import { useMemo } from "react";
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

const KPI_CONFIG = [
  { key: "totalStudents", label: "Total Students" },
  { key: "totalAgents", label: "Total Agents" },
  { key: "totalUniversities", label: "Total Universities" },
  { key: "activeApplications", label: "Active Applications" },
  { key: "totalCommissionPaid", label: "Total Commission Paid", format: "currency" },
  { key: "pendingVerifications", label: "Pending Verifications" },
] as const;

const formatValue = (value: number, format?: "currency", currency = "USD") => {
  if (format === "currency") {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
};

const getHealthStyles = (status: string) => {
  switch (status) {
    case "operational":
      return {
        label: "Operational",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
        accent: "text-emerald-500",
      };
    case "monitoring":
      return {
        label: "Monitoring",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
        accent: "text-amber-500",
      };
    case "degraded":
      return {
        label: "Degraded",
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
        accent: "text-orange-500",
      };
    case "critical":
      return {
        label: "Critical",
        badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
        accent: "text-red-500",
      };
    default:
      return {
        label: "Unknown",
        badge: "bg-muted text-muted-foreground",
        accent: "text-muted-foreground",
      };
  }
};

const AdminOverview = () => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const openZoe = (prompt: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
  };

  const metricsQuery = useAdminOverviewMetrics(tenantId);
  const trendsQuery = useAdmissionsTrends(tenantId);
  const geographyQuery = useApplicationsByCountry(tenantId);
  const activityQuery = useAdminRecentActivity(tenantId);
  const healthQuery = useSystemHealth(tenantId);

  const loadingState = metricsQuery.isLoading && !metricsQuery.data;

  const chartContent = useMemo(() => {
    if (trendsQuery.isLoading) {
      return <LoadingState message="Loading admissions trends" size="sm" />;
    }

    if (!trendsQuery.data || trendsQuery.data.length === 0) {
      return <p className="text-sm text-muted-foreground">No admissions activity recorded for the selected period.</p>;
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={trendsQuery.data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" stroke="currentColor" className="text-xs text-muted-foreground" />
          <YAxis stroke="currentColor" className="text-xs text-muted-foreground" allowDecimals={false} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="submitted" strokeWidth={2} stroke="hsl(var(--chart-1))" name="Submitted" />
          <Line type="monotone" dataKey="enrolled" strokeWidth={2} stroke="hsl(var(--chart-2))" name="Enrolled" />
        </LineChart>
      </ResponsiveContainer>
    );
  }, [trendsQuery.data, trendsQuery.isLoading]);

  const barChart = useMemo(() => {
    if (geographyQuery.isLoading) {
      return <LoadingState message="Loading geographic mix" size="sm" />;
    }

    if (!geographyQuery.data || geographyQuery.data.length === 0) {
      return <p className="text-sm text-muted-foreground">No in-flight applications available.</p>;
    }

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
  }, [geographyQuery.data, geographyQuery.isLoading]);

  const kpiCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {KPI_CONFIG.map((item) => {
        const value = metricsQuery.data?.[item.key] ?? 0;
        const display =
          item.format === "currency"
            ? formatValue(value, "currency", metricsQuery.data?.currency)
            : formatValue(value);
        return (
          <Card key={item.key}>
            <CardHeader className="flex items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              {item.key === "pendingVerifications" && value > 0 ? (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-amber-600">
                  Action Required
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {metricsQuery.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">{display}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Updated {metricsQuery.data?.lastUpdated ? formatDistanceToNow(new Date(metricsQuery.data.lastUpdated), { addSuffix: true }) : "moments ago"}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const recentActivity = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
          <p className="text-sm text-muted-foreground">Latest tenant-wide audit events</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => openZoe("Summarize today’s critical audit events") }>
          <ArrowUpRight className="h-4 w-4" />
          Escalate with Zoe
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {activityQuery.isLoading && <LoadingState message="Loading activity" size="sm" />}
            {!activityQuery.isLoading && (!activityQuery.data || activityQuery.data.length === 0) ? (
              <p className="p-4 text-sm text-muted-foreground">No recent activity recorded.</p>
            ) : null}
            {activityQuery.data?.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.entity}</p>
                  {item.user?.full_name ? (
                    <p className="text-xs text-muted-foreground">by {item.user.full_name}</p>
                  ) : null}
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

  const healthStyles = getHealthStyles(healthQuery.data?.status ?? "unknown");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Operations overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor admissions momentum, commercial health, and platform activity in one unified console.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminReportExportButton tenantId={tenantId} defaultReportType="admissions" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {kpiCards}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Admissions trends</CardTitle>
                <p className="text-sm text-muted-foreground">Rolling six-month submission and enrollment cadence</p>
              </CardHeader>
              <CardContent className="pt-2">{chartContent}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Applications by country</CardTitle>
                <p className="text-sm text-muted-foreground">Current pipeline distribution by destination</p>
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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
              <p className="text-sm text-muted-foreground">Resolve high-impact workflow blockers</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                variant="default"
                className="justify-start gap-3"
                onClick={() => openZoe("List agents awaiting approval and potential risks")}
              >
                <Activity className="h-4 w-4" />
                Approve New Agents
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3"
                onClick={() => openZoe("Which universities are pending onboarding tasks?")}
              >
                <ArrowUpRight className="h-4 w-4" />
                Approve Universities
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-3"
                onClick={() => openZoe("Show profiles flagged for compliance review")}
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Review Flagged Profiles
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">System health</CardTitle>
                <p className="text-sm text-muted-foreground">Security signals aggregated from the last 30 days</p>
              </div>
              <Badge className={healthStyles.badge}>{healthStyles.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-semibold ${healthStyles.accent}`}>{healthQuery.data?.score ?? 0}</p>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">risk score</span>
              </div>
              <Separator />
              <div className="space-y-3 text-sm text-muted-foreground">
                {healthQuery.isLoading && <Skeleton className="h-20 w-full" />}
                {!healthQuery.isLoading &&
                  (healthQuery.data?.recommendations ?? ["No active recommendations—continue monitoring."]).map((item, index) => (
                    <p key={index}>{item}</p>
                  ))}
              </div>
              <Button size="sm" variant="outline" onClick={() => openZoe("Provide a security triage summary for admin") }>
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Triage with Zoe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
