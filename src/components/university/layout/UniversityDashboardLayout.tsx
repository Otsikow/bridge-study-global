import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { StatePlaceholder } from "../common/StatePlaceholder";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Building2, AlertCircle, ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  computeUniversityProfileCompletion,
  emptyUniversityProfileDetails,
  parseUniversityProfileDetails,
  type UniversityProfileDetails,
} from "@/lib/universityProfile";

type Nullable<T> = T | null;

type FeaturedListingStatus = Database["public"]["Enums"]["featured_listing_status"];

interface UniversityRecord {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  country: string;
  city: string | null;
  description?: string | null;
  featured?: boolean | null;
  featured_summary?: string | null;
  featured_highlight?: string | null;
  featured_image_url?: string | null;
  featured_priority?: number | null;
  featured_listing_status?: FeaturedListingStatus | null;
  featured_listing_expires_at?: string | null;
  featured_listing_last_paid_at?: string | null;
  featured_listing_current_order_id?: string | null;
  submission_config_json?: unknown;
}

export interface UniversityProgram {
  id: string;
  name: string;
  level: string;
  discipline: string | null;
  duration_months: number | null;
  tuition_amount: number | null;
  tuition_currency: string | null;
  intake_months: number[] | null;
  entry_requirements: string[] | null;
  ielts_overall: number | null;
  toefl_overall: number | null;
  seats_available: number | null;
  description: string | null;
  app_fee: number | null;
  image_url: string | null;
  active: boolean | null;
}

export interface UniversityApplication {
  id: string;
  appNumber: string;
  status: string;
  createdAt: string;
  programId: string;
  programName: string;
  programLevel: string;
  programDiscipline: string | null;
  studentId: string | null;
  studentName: string;
  studentNationality: string | null;
}

export interface UniversityDocumentRequest {
  id: string;
  studentId: string | null;
  studentName: string;
  status: string;
  requestType: string;
  requestedAt: string | null;
  documentUrl: string | null;
}

export interface UniversityAgent {
  id: string;
  companyName: string | null;
  contactName: string;
  contactEmail: string;
  referralCount: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
}

export interface ConversionMetric {
  key: string;
  label: string;
  value: number;
  description: string;
}

export interface ChartDatum {
  name: string;
  value: number;
  color?: string;
}

export interface UniversityDashboardMetrics {
  totalApplications: number;
  totalPrograms: number;
  totalOffers: number;
  totalCas: number;
  totalEnrolled: number;
  totalAgents: number;
  acceptanceRate: number;
  newApplicationsThisWeek: number;
  pendingDocuments: number;
  receivedDocuments: number;
}

export interface UniversityDashboardData {
  university: Nullable<UniversityRecord>;
  profileDetails: UniversityProfileDetails;
  programs: UniversityProgram[];
  applications: UniversityApplication[];
  documentRequests: UniversityDocumentRequest[];
  agents: UniversityAgent[];
  metrics: UniversityDashboardMetrics;
  pipeline: PipelineStage[];
  conversion: ConversionMetric[];
  statusSummary: ChartDatum[];
  countrySummary: ChartDatum[];
  recentApplications: UniversityApplication[];
}

interface UniversityDashboardContextValue {
  data: UniversityDashboardData | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: Nullable<string>;
  refetch: () => Promise<void>;
}

const UniversityDashboardContext =
  createContext<UniversityDashboardContextValue | null>(null);

const statusColors: Record<string, string> = {
  accepted: "hsl(var(--success))",
  offers: "hsl(var(--info))",
  pending: "hsl(var(--warning))",
  other: "hsl(var(--muted-foreground))",
};

const pipelineStageDefinitions = [
  {
    key: "submitted",
    label: "New Applications",
    description: "Submitted and awaiting review",
    statuses: ["submitted", "draft"],
  },
  {
    key: "screening",
    label: "In Review",
    description: "Applications in screening or evaluation",
    statuses: ["screening"],
  },
  {
    key: "offers",
    label: "Offers Issued",
    description: "Conditional or unconditional offers sent",
    statuses: ["conditional_offer", "unconditional_offer"],
  },
  {
    key: "cas",
    label: "Visa & CAS",
    description: "Students completing CAS or visa steps",
    statuses: ["cas_loa", "visa"],
  },
  {
    key: "enrolled",
    label: "Enrolled Students",
    description: "Students confirmed for intake",
    statuses: ["enrolled"],
  },
];

const buildEmptyDashboardData = (): UniversityDashboardData => ({
  university: null,
  profileDetails: { ...emptyUniversityProfileDetails },
  programs: [],
  applications: [],
  documentRequests: [],
  agents: [],
  metrics: {
    totalApplications: 0,
    totalPrograms: 0,
    totalOffers: 0,
    totalCas: 0,
    totalEnrolled: 0,
    totalAgents: 0,
    acceptanceRate: 0,
    newApplicationsThisWeek: 0,
    pendingDocuments: 0,
    receivedDocuments: 0,
  },
  pipeline: [],
  conversion: [],
  statusSummary: [],
  countrySummary: [],
  recentApplications: [],
});

const normalizeStatus = (status: string | null | undefined) =>
  status ? status.toLowerCase() : "unknown";

const titleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const isWithinLastDays = (dateISO: string | null, days: number) => {
  if (!dateISO) return false;
  const now = new Date();
  const comparison = new Date(dateISO);
  if (Number.isNaN(comparison.getTime())) return false;
  const diffMs = now.getTime() - comparison.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
};

const fetchUniversityDashboardData = async (
  tenantId: string,
): Promise<UniversityDashboardData> => {
  console.log("Fetching university dashboard for tenant:", tenantId);
  
  const { data: uniRows, error: uniError } = await supabase
    .from("universities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (uniError) {
    console.error("Error fetching universities:", uniError);
    throw uniError;
  }

  console.log("Universities found:", uniRows?.length ?? 0);

  const uniData = (uniRows?.[0] ?? null) as Nullable<UniversityRecord>;

  const profileDetails = uniData
    ? parseUniversityProfileDetails(uniData.submission_config_json ?? null)
    : { ...emptyUniversityProfileDetails };

  if (!uniData) {
    console.warn("No university found for tenant:", tenantId);
    return buildEmptyDashboardData();
  }

  console.log("Loading data for university:", uniData.name);

  const programColumns = [
    "id",
    "name",
    "level",
    "discipline",
    "duration_months",
    "tuition_amount",
    "tuition_currency",
    "intake_months",
    "entry_requirements",
    "ielts_overall",
    "toefl_overall",
    "seats_available",
    "description",
    "app_fee",
    "image_url",
    "active",
  ] as const;

  const selectPrograms = (columns: readonly string[]) =>
    supabase
      .from("programs")
      .select(columns.join(", "))
      .eq("university_id", uniData.id)
      .order("name");

  const fetchProgramsWithFallback = async (): Promise<UniversityProgram[]> => {
    const response = await selectPrograms(programColumns);

    if (!response.error) {
      return (response.data ?? []) as any as UniversityProgram[];
    }

    const errorCode = (response.error as { code?: string }).code ?? "";
    const errorMessage = response.error.message?.toLowerCase() ?? "";
    const missingImageColumn =
      errorCode === "42703" || errorMessage.includes("image_url");

    if (!missingImageColumn) {
      throw response.error;
    }

    console.warn(
      "programs.image_url column missing – refetching without optional column",
      {
        code: errorCode,
        message: response.error.message,
      },
    );

    const fallbackColumns = programColumns.filter(
      (column) => column !== "image_url",
    );

    const fallback = await selectPrograms(fallbackColumns);
    if (fallback.error) {
      throw fallback.error;
    }

    return (fallback.data ?? []).map((program: any) => ({
      ...program,
      image_url: null,
    })) as UniversityProgram[];
  };

  const [programs, documentRequestsRes, agentsRes] = await Promise.all([
    fetchProgramsWithFallback(),
    supabase
      .from("document_requests")
      .select(
        "id, student_id, request_type, status, requested_at, created_at, document_url, uploaded_file_url, file_url, storage_path",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("agents")
      .select(
        `
        id,
        company_name,
        profile:profiles!inner (
          full_name,
          email
        )
      `,
      )
      .eq("tenant_id", tenantId),
  ]);

  if (documentRequestsRes.error) {
    throw documentRequestsRes.error;
  }

  if (agentsRes.error) {
    throw agentsRes.error;
  }

  const programIds = programs.map((program) => program.id);

  let applications: UniversityApplication[] = [];

  if (programIds.length > 0) {
    const { data: applicationsRes, error: applicationsError } = await supabase
      .from("applications")
      .select(
        "id, app_number, status, created_at, program_id, student_id, updated_at",
      )
      .in("program_id", programIds)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      throw applicationsError;
    }

    const applicationRows = applicationsRes ?? [];
    const studentIds = Array.from(
      new Set(
        applicationRows
          .map((app) => app.student_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let studentsMap = new Map<
      string,
      { id: string; legal_name: string | null; nationality: string | null }
    >();

    if (studentIds.length > 0) {
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, legal_name, nationality")
        .in("id", studentIds);

      if (studentsError) {
        throw studentsError;
      }

      studentsMap = new Map(
        (studentsData ?? []).map((student) => [student.id, student]),
      );
    }

    const programsMap = new Map(
      programs.map((program) => [
        program.id,
        {
          id: program.id,
          name: program.name,
          level: program.level,
          discipline: program.discipline,
        },
      ]),
    );

    applications = applicationRows.map((app) => {
      const student = app.student_id
        ? studentsMap.get(app.student_id)
        : null;
      const program = programsMap.get(app.program_id);

      return {
        id: app.id,
        appNumber: app.app_number ?? "—",
        status: app.status ?? "unknown",
        createdAt: app.created_at,
        programId: app.program_id,
        programName: program?.name ?? "Unknown Program",
        programLevel: program?.level ?? "—",
        programDiscipline: program?.discipline ?? null,
        studentId: app.student_id ?? null,
        studentName: student?.legal_name ?? "Unknown Student",
        studentNationality: student?.nationality ?? "Unknown",
      };
    });
  }

  const documentRequests: UniversityDocumentRequest[] = (documentRequestsRes.data ?? []).map(
    (request) => ({
      id: request.id,
      studentId: request.student_id ?? null,
      studentName: "Student",
      status: request.status ? request.status.toLowerCase() : "pending",
      requestType: request.request_type
        ? titleCase(request.request_type)
        : "Document",
      requestedAt: request.requested_at ?? request.created_at,
      documentUrl:
        request.document_url ?? request.uploaded_file_url ?? request.file_url,
    }),
  );

  if (documentRequests.length > 0) {
    const studentIds = Array.from(
      new Set(
        documentRequests
          .map((request) => request.studentId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (studentIds.length > 0) {
      const { data: docStudents, error: docStudentsError } = await supabase
        .from("students")
        .select("id, legal_name, preferred_name")
        .in("id", studentIds);

      if (docStudentsError) {
        throw docStudentsError;
      }

      const docStudentMap = new Map(
        (docStudents ?? []).map((student) => [student.id, student]),
      );

      documentRequests.forEach((request) => {
        if (!request.studentId) return;
        const student = docStudentMap.get(request.studentId);
        if (!student) return;
        request.studentName =
          student.preferred_name ?? student.legal_name ?? "Student";
      });
    }
  }

  const agents: UniversityAgent[] = await Promise.all(
    (agentsRes.data ?? []).map(async (agent: any) => {
      const { count, error: countError } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id);

      if (countError) {
        throw countError;
      }

      return {
        id: agent.id,
        companyName: agent.company_name ?? null,
        contactName: agent.profile?.full_name ?? "Agent",
        contactEmail: agent.profile?.email ?? "—",
        referralCount: count ?? 0,
      };
    }),
  );

  const metrics = buildMetrics(applications, documentRequests, programs, agents);
  const pipeline = buildPipeline(applications);
  const conversion = buildConversion(applications);
  const statusSummary = buildStatusSummary(applications);
  const countrySummary = buildCountrySummary(applications);
  const recentApplications = applications.slice(0, 5);

  return {
    university: {
      id: uniData.id,
      name: uniData.name,
      logo_url: uniData.logo_url,
      website: uniData.website,
      country: uniData.country,
      city: uniData.city,
      description: uniData.description,
      featured_image_url: uniData.featured_image_url,
    },
    profileDetails,
    programs,
    applications,
    documentRequests,
    agents,
    metrics,
    pipeline,
    conversion,
    statusSummary,
    countrySummary,
    recentApplications,
  };
};

const buildMetrics = (
  applications: UniversityApplication[],
  documentRequests: UniversityDocumentRequest[],
  programs: UniversityProgram[],
  agents: UniversityAgent[],
): UniversityDashboardMetrics => {
  const totalApplications = applications.length;
  const totalPrograms = programs.length;

  const offerStatuses = ["conditional_offer", "unconditional_offer"];
  const casStatuses = ["cas_loa", "visa"];
  const enrolledStatuses = ["enrolled"];

  let totalOffers = 0;
  let totalCas = 0;
  let totalEnrolled = 0;
  let newApplicationsThisWeek = 0;

  applications.forEach((app) => {
    const status = normalizeStatus(app.status);
    if (offerStatuses.includes(status)) {
      totalOffers += 1;
    }
    if (casStatuses.includes(status)) {
      totalCas += 1;
    }
    if (enrolledStatuses.includes(status)) {
      totalEnrolled += 1;
    }
    if (isWithinLastDays(app.createdAt, 7)) {
      newApplicationsThisWeek += 1;
    }
  });

  const acceptanceRate =
    totalApplications > 0 ? Math.round((totalOffers / totalApplications) * 100) : 0;

  const pendingDocuments = documentRequests.filter(
    (request) => normalizeStatus(request.status) !== "received",
  ).length;

  const receivedDocuments = documentRequests.length - pendingDocuments;

  return {
    totalApplications,
    totalPrograms,
    totalOffers,
    totalCas,
    totalEnrolled,
    totalAgents: agents.length,
    acceptanceRate,
    newApplicationsThisWeek,
    pendingDocuments,
    receivedDocuments,
  };
};

const buildPipeline = (
  applications: UniversityApplication[],
): PipelineStage[] => {
  const total = applications.length;

  return pipelineStageDefinitions.map((definition) => {
    const count = applications.filter((app) =>
      definition.statuses.includes(normalizeStatus(app.status)),
    ).length;

    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
};

const buildConversion = (
  applications: UniversityApplication[],
): ConversionMetric[] => {
  const total = applications.length;
  const offers = applications.filter((app) =>
    ["conditional_offer", "unconditional_offer"].includes(
      normalizeStatus(app.status),
    ),
  ).length;
  const cas = applications.filter((app) =>
    ["cas_loa", "visa"].includes(normalizeStatus(app.status)),
  ).length;
  const enrolled = applications.filter((app) =>
    ["enrolled"].includes(normalizeStatus(app.status)),
  ).length;

  return [
    {
      key: "offer",
      label: "Offer Rate",
      value: total > 0 ? Math.round((offers / total) * 100) : 0,
      description: `${offers} offers issued`,
    },
    {
      key: "visa",
      label: "Visa Progress",
      value: offers > 0 ? Math.round((cas / offers) * 100) : 0,
      description: `${cas} students in CAS or Visa`,
    },
    {
      key: "enrolled",
      label: "Enrollment Rate",
      value: total > 0 ? Math.round((enrolled / total) * 100) : 0,
      description: `${enrolled} students enrolled`,
    },
  ];
};

const buildStatusSummary = (
  applications: UniversityApplication[],
): ChartDatum[] => {
  const acceptedCount = applications.filter((app) =>
    ["conditional_offer", "unconditional_offer"].includes(
      normalizeStatus(app.status),
    ),
  ).length;

  const pendingCount = applications.filter((app) =>
    ["submitted", "screening", "draft"].includes(
      normalizeStatus(app.status),
    ),
  ).length;

  const otherCount = applications.length - (acceptedCount + pendingCount);

  return [
    {
      name: "Accepted",
      value: acceptedCount,
      color: statusColors.accepted,
    },
    {
      name: "Pending",
      value: pendingCount,
      color: statusColors.pending,
    },
    {
      name: "Other",
      value: otherCount,
      color: statusColors.other,
    },
  ];
};

const buildCountrySummary = (
  applications: UniversityApplication[],
): ChartDatum[] => {
  const accumulator = new Map<string, number>();

  applications.forEach((app) => {
    const country = app.studentNationality ?? "Unknown";
    accumulator.set(country, (accumulator.get(country) ?? 0) + 1);
  });

  return Array.from(accumulator.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
};

export const UniversityDashboardLayout = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const tenantId = profile?.tenant_id;

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ["university-dashboard", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      if (!tenantId) {
        console.log("No tenant ID available");
        return buildEmptyDashboardData();
      }
      try {
        const result = await fetchUniversityDashboardData(tenantId);
        console.log("Dashboard data loaded successfully");
        return result;
      } catch (err) {
        console.error("Error in queryFn:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("University dashboard error:", {
        error,
        message: (error as Error)?.message,
        tenantId,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Unable to load dashboard",
        description:
          (error as Error)?.message ??
          "Something went wrong while loading your dashboard.",
        variant: "destructive",
      });
    }
  }, [error, toast, tenantId]);

  const contextValue = useMemo<UniversityDashboardContextValue>(
    () => ({
      data: data ?? buildEmptyDashboardData(),
      isLoading,
      isRefetching: isFetching,
      error: error ? (error as Error).message : null,
      refetch: async () => {
        await queryRefetch();
      },
    }),
    [data, error, isFetching, isLoading, queryRefetch],
  );

  const profileCompletion = useMemo(
    () =>
      data?.university
        ? computeUniversityProfileCompletion(
            // @ts-expect-error - UniversityRecord type mismatch
            data.university,
            data.profileDetails ?? emptyUniversityProfileDetails,
          )
        : { percentage: 0, missingFields: [] as string[] },
    [data],
  );

  const showProfileReminder = Boolean(data?.university) && profileCompletion.percentage < 100;
  const missingSummary = showProfileReminder
    ? profileCompletion.missingFields.slice(0, 3).join(", ")
    : "";

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState message="Preparing your university dashboard..." size="lg" />
      </div>
    );
  }

  if (!profile) {
    console.log("No profile found");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="No partner profile found"
          description="Sign in with your university partner credentials to access the Global Education Gateway dashboard."
        />
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <StatePlaceholder
          icon={<AlertCircle className="h-12 w-12 text-red-400" />}
          title="We couldn't load your dashboard"
          description={`Error: ${(error as Error)?.message || 'Unknown error'}. Please try refreshing or contact support.`}
          action={
            <Button onClick={() => void queryRefetch()} className="gap-2">
              Try again
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    );
  }

  if (!data || !data.university) {
    console.log("No university data available", { data, tenantId });
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <StatePlaceholder
          icon={<Building2 className="h-12 w-12 text-primary" />}
          title="No university profile found"
          description={`No active university is linked to your account (Tenant ID: ${tenantId?.slice(0, 8)}...). Please contact GEG Support to set up your university profile.`}
          action={
            <Button
              onClick={() => void queryRefetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  console.log("Rendering dashboard for:", data.university.name);

  return (
    <UniversityDashboardContext.Provider value={contextValue}>
      <div className="flex min-h-screen bg-background text-foreground">
        <UniversitySidebar className="hidden lg:flex" />

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-72 overflow-y-auto border-r border-border bg-background p-0 text-foreground"
          >
            <UniversitySidebar
              onNavigate={() => setMobileNavOpen(false)}
              className="flex lg:hidden"
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-screen flex-1 flex-col">
          <UniversityHeader
            onRefresh={() => void queryRefetch()}
            refreshing={isFetching}
            onToggleMobileNav={() => setMobileNavOpen(true)}
          />
          <main className="flex flex-1 flex-col overflow-y-auto bg-gradient-subtle px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              {showProfileReminder ? (
                <Alert className="border-primary/40 bg-primary/5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <AlertTitle className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                        Complete your university profile
                      </AlertTitle>
                      <AlertDescription className="space-y-3 text-sm text-muted-foreground">
                        <p>
                          You're {profileCompletion.percentage}% complete.
                          {missingSummary
                            ? ` Add ${missingSummary} to unlock a fully polished listing.`
                            : " Add the remaining details to unlock a fully polished listing."}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Progress value={profileCompletion.percentage} className="h-2 flex-1" />
                          <span className="font-medium text-primary">
                            {profileCompletion.percentage}%
                          </span>
                        </div>
                      </AlertDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2 whitespace-nowrap"
                      onClick={() => navigate("/university/profile")}
                    >
                      Update profile
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              ) : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </UniversityDashboardContext.Provider>
  );
};

export const useUniversityDashboard = () => {
  const context = useContext(UniversityDashboardContext);
  if (!context) {
    throw new Error(
      "useUniversityDashboard must be used within UniversityDashboardLayout",
    );
  }
  return context;
};
