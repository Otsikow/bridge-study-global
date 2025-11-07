import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { FileText, CheckCircle, FileWarning, Users, Building2, Mail, Globe, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import gegLogo from "@/assets/geg-logo.png";

type DashboardMetrics = {
  activeApplications: number;
  offersReceived: number;
  pendingDocuments: number;
  totalStudents: number;
  uniquePrograms: number;
};

type UniversitySummary = {
  id: string;
  name: string;
  city: string | null;
  country: string;
  website: string | null;
  partnership_status: string | null;
  submission_mode: string | null;
  active: boolean | null;
  updated_at: string | null;
};

const ACTIVE_STATUSES = new Set([
  "submitted",
  "screening",
  "conditional_offer",
  "unconditional_offer",
  "cas_loa",
  "visa",
]);

const OFFER_STATUSES = new Set(["conditional_offer", "unconditional_offer"]);

const formatTitleCase = (value?: string | null) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Not specified";

export default function PartnerDashboard() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeApplications: 0,
    offersReceived: 0,
    pendingDocuments: 0,
    totalStudents: 0,
    uniquePrograms: 0,
  });
  const [university, setUniversity] = useState<UniversitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const handleRetry = () => setRetryToken((token) => token + 1);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!profile) return;

      if (profile.role !== "partner") {
        setError("Partner access is required to view this dashboard.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const tenantId = profile.tenant_id;

        const { data: applicationsData, error: applicationsError } = await supabase
          .from("applications")
          .select("id, status, student_id, program_id")
          .eq("tenant_id", tenantId);

        if (applicationsError) throw applicationsError;

        const applications =
          (applicationsData ?? []) as Array<{
            id: string;
            status: string | null;
            student_id: string | null;
            program_id: string | null;
          }>;

        const activeApplications = applications.filter(
          (application) => application.status && ACTIVE_STATUSES.has(application.status)
        ).length;

        const offersReceived = applications.filter(
          (application) => application.status && OFFER_STATUSES.has(application.status)
        ).length;

        const totalStudents = new Set(
          applications.map((application) => application.student_id).filter(Boolean)
        ).size;

        const uniquePrograms = new Set(
          applications.map((application) => application.program_id).filter(Boolean)
        ).size;

        let pendingDocuments = 0;

        const applicationIds = applications.map((application) => application.id);

        if (applicationIds.length > 0) {
          const { data: documentsData, error: documentsError } = await supabase
            .from("application_documents")
            .select("id, verified")
            .in("application_id", applicationIds);

          if (documentsError) throw documentsError;

          pendingDocuments = (documentsData ?? []).filter(
            (document: { verified: boolean | null }) => document.verified !== true
          ).length;
        }

        setMetrics({
          activeApplications,
          offersReceived,
          pendingDocuments,
          totalStudents,
          uniquePrograms,
        });

        const { data: universityData, error: universityError } = await supabase
          .from("universities")
          .select("id, name, city, country, website, partnership_status, submission_mode, active, updated_at")
          .eq("tenant_id", tenantId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (universityError) throw universityError;

        setUniversity((universityData as UniversitySummary | null) ?? null);
      } catch (fetchError) {
        console.error("Partner dashboard load failed:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load partner dashboard data.");
        setUniversity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [profile, retryToken]);

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <LoadingState message="Loading your partner profile..." />
        </div>
      </DashboardLayout>
    );
  }

  const welcomeName = profile.full_name || profile.username || "Partner";
  const location = [university?.city, university?.country].filter(Boolean).join(", ");
  const lastUpdated = university?.updated_at
    ? new Date(university.updated_at).toLocaleString()
    : "Not recorded";

  const statCards = [
    {
      key: "activeApplications",
      label: "Active Applications",
      value: metrics.activeApplications,
      description: "Moving through your partnership pipeline.",
      icon: FileText,
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      key: "offersReceived",
      label: "Offers Received",
      value: metrics.offersReceived,
      description: "Conditional or unconditional offers issued.",
      icon: CheckCircle,
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "pendingDocuments",
      label: "Pending Documents",
      value: metrics.pendingDocuments,
      description: "Awaiting verification or upload.",
      icon: FileWarning,
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "totalStudents",
      label: "Total Students",
      value: metrics.totalStudents,
      description: "Unique students you're supporting.",
      icon: Users,
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  ] as const;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        {error && (
          <Alert variant="destructive">
            <AlertTitle>We couldn&apos;t load everything just yet</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        <section className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Welcome back, {welcomeName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">{formattedDate}</p>
        </section>

        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.key} className="h-full border border-border/70">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        {loading ? (
                          <Skeleton className="h-7 w-16" />
                        ) : (
                          <p className="text-2xl font-semibold">
                            {stat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 p-3">
                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <Card className="border border-border/70">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>University Summary</CardTitle>
                <CardDescription>Snapshot of your partnership profile and current engagement.</CardDescription>
              </div>
              {!loading && university && (
                <Badge variant={university.active === false ? "secondary" : "default"} className="capitalize">
                  {formatTitleCase(university.partnership_status ?? (university.active === false ? "inactive" : "active"))}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6">
                  <LoadingState message="Loading your university summary..." />
                </div>
              ) : university ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Institution
                      </p>
                      <p className="text-2xl font-semibold">{university.name}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {location && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {location}
                          </span>
                        )}
                        {university.website && (
                          <a
                            href={university.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            {university.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground sm:text-right">
                      <span className="uppercase tracking-wide text-xs font-medium">Last Updated</span>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <CalendarDays className="h-4 w-4" />
                        <span>{lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Submission Mode</p>
                      <p className="text-sm font-medium">
                        {university.submission_mode ? formatTitleCase(university.submission_mode) : "Not configured"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Programs Represented</p>
                      <p className="text-sm font-medium">{metrics.uniquePrograms.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Active Applications</p>
                      <p className="text-sm font-medium">{metrics.activeApplications.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Offers Issued</p>
                      <p className="text-sm font-medium">{metrics.offersReceived.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Pending Documents</p>
                      <p className="text-sm font-medium">{metrics.pendingDocuments.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">Students Supported</p>
                      <p className="text-sm font-medium">{metrics.totalStudents.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
                  title="No University Found"
                  description="We couldn’t load your university profile. Retry to refresh the connection."
                  action={{ label: "Retry", onClick: handleRetry }}
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border border-border/70">
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-6">
              <div className="flex items-center gap-4">
                <img
                  src={gegLogo}
                  alt="Global Education Gateway logo"
                  className="h-12 w-12 object-contain rounded-md dark:brightness-0 dark:invert"
                />
                <div className="space-y-1">
                  <p className="text-lg font-semibold">Global Education Gateway</p>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Connecting international students with world-class universities through verified agents and
                    transparent application management.
                  </p>
                </div>
              </div>
              <div className="space-y-3 sm:text-right">
                <div className="flex items-center gap-2 text-sm text-muted-foreground sm:justify-end">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:info@globaleducationgateway.com" className="hover:underline">
                    info@globaleducationgateway.com
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm sm:justify-end">
                  <Link to="/search" className="text-primary hover:underline">
                    Search Universities
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link to="/blog" className="text-primary hover:underline">
                    Blog
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link to="/visa-calculator" className="text-primary hover:underline">
                    Visa Calculator
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
