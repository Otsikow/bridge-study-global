import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Search,
  RefreshCw,
  Filter,
  Eye,
  User,
  Building2,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  ClipboardList,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/StatusBadge";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";
import { LoadingState } from "@/components/LoadingState";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import {
  formatErrorForToast,
  getErrorMessage,
  logError,
} from "@/lib/errorUtils";

type StatusFilter =
  | "all"
  | "pending"
  | "under_review"
  | "offer_sent"
  | "rejected";

interface ProfileInfo {
  full_name?: string | null;
  email?: string | null;
}

interface StudentInfo {
  id?: string;
  legal_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  profile?: ProfileInfo | null;
}

interface AgentInfo {
  id?: string;
  company_name?: string | null;
  profile?: ProfileInfo | null;
}

interface ProgramInfo {
  id?: string;
  name?: string | null;
  level?: string | null;
}

interface TimelineItem {
  title?: string;
  description?: string;
  date?: string;
  status?: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  submitted_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  app_number?: string | null;
  student?: StudentInfo | null;
  agent?: AgentInfo | null;
  program?: ProgramInfo | null;
  notes?: string | null;
  internal_notes?: string | null;
  timeline_json?: TimelineItem[] | null;
}

interface ApplicationDocument {
  id: string;
  document_type: string | null;
  storage_path: string | null;
  document_url?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  uploaded_at: string | null;
  verified: boolean | null;
  verification_notes?: string | null;
}

interface DetailedApplication extends ApplicationRow {
  documents?: ApplicationDocument[];
}

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "offer_sent", label: "Offer sent" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_FILTER_MAP: Record<StatusFilter, string[]> = {
  all: [],
  pending: ["draft", "submitted"],
  under_review: ["screening", "cas_loa", "visa"],
  offer_sent: ["conditional_offer", "unconditional_offer", "enrolled"],
  rejected: ["withdrawn", "deferred", "rejected"],
};

const formatDate = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string | null) =>
  formatDate(value, { dateStyle: "medium", timeStyle: "short" });

const toDisplayName = (...candidates: (string | null | undefined)[]) =>
  candidates.find((candidate) => candidate && candidate.trim().length > 0) ??
  "—";

const formatDocumentType = (value: string | null | undefined) => {
  if (!value) return "Document";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const ApplicationsPage = () => {
  const { data } = useUniversityDashboard();
  const { toast } = useToast();

  const universityId = data?.university?.id ?? null;

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationRow | null>(null);
  const [detailedApplication, setDetailedApplication] =
    useState<DetailedApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const detailsCacheRef = useRef<Record<string, DetailedApplication>>({});

  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const startIndex = useMemo(() => (page - 1) * PAGE_SIZE, [page]);
  const endIndex = useMemo(() => startIndex + PAGE_SIZE - 1, [startIndex]);
  const totalPages = useMemo(
    () => (totalCount === 0 ? 1 : Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  const hasFiltersApplied =
    statusFilter !== "all" || searchTerm.trim().length > 0;

  const getStudentName = (application: ApplicationRow) =>
    toDisplayName(
      application.student?.legal_name,
      application.student?.profile?.full_name,
    );

  const getStudentEmail = (application: ApplicationRow) =>
    application.student?.contact_email ??
    application.student?.profile?.email ??
    null;

  const getStudentPhone = (application: ApplicationRow) =>
    application.student?.contact_phone ?? null;

  const getAgentName = (application: ApplicationRow) =>
    toDisplayName(
      application.agent?.profile?.full_name,
      application.agent?.company_name,
    );

  const getAgentEmail = (application: ApplicationRow) =>
    application.agent?.profile?.email ?? null;

  const getProgramName = (application: ApplicationRow) =>
    application.program?.name ?? "—";

  const getProgramLevel = (application: ApplicationRow) =>
    application.program?.level ?? null;

  const fetchApplications = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!universityId) {
        setApplications([]);
        setTotalCount(0);
        return false;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const statuses = STATUS_FILTER_MAP[statusFilter];
        const searchValue = debouncedSearch
          ? `%${debouncedSearch.replace(/\s+/g, "%")}%`
          : null;

        let query = supabase
          .from("applications")
          .select(
            `
              id,
              status,
              submitted_at,
              updated_at,
              created_at,
              app_number,
              student:students (
                id,
                legal_name,
                contact_email,
                contact_phone,
                profile:profiles (
                  full_name,
                  email
                )
              ),
              agent:agents (
                id,
                company_name,
                profile:profiles (
                  full_name,
                  email
                )
              ),
              program:programs!inner (
                id,
                name,
                level,
                university_id
              )
            `,
            { count: "exact" },
          )
          .eq("program.university_id", universityId);

        if (statuses.length > 0) {
          query = query.in("status", statuses);
        }

        if (searchValue) {
          query = query.or(
            [
              `app_number.ilike.${searchValue}`,
              `student.legal_name.ilike.${searchValue}`,
              `student.profile.full_name.ilike.${searchValue}`,
              `student.contact_email.ilike.${searchValue}`,
              `agent.company_name.ilike.${searchValue}`,
              `agent.profile.full_name.ilike.${searchValue}`,
              `program.name.ilike.${searchValue}`,
            ].join(","),
          );
        }

        const { data: rows, error, count } = await query
          .order("submitted_at", { ascending: false, nullsLast: true })
          .order("created_at", { ascending: false })
          .range(startIndex, endIndex);

        if (options?.signal?.aborted) {
          return false;
        }

        if (error) {
          throw error;
        }

        if ((count ?? 0) <= startIndex && page > 1) {
          setPage(1);
          return false;
        }

        setApplications((rows ?? []) as ApplicationRow[]);
        setTotalCount(count ?? rows?.length ?? 0);
        return true;
      } catch (error) {
        if (options?.signal?.aborted) {
          return false;
        }

        logError(error, "UniversityApplications.fetchApplications");
        const message = getErrorMessage(error);
        setErrorMessage(message);
        toast(formatErrorForToast(error, "Failed to load applications"));
        return false;
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      debouncedSearch,
      page,
      startIndex,
      endIndex,
      statusFilter,
      toast,
      universityId,
    ],
  );

  useEffect(() => {
    if (!universityId) {
      return;
    }

    const controller = new AbortController();
    void fetchApplications({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [fetchApplications, universityId]);

  const loadApplicationDetails = useCallback(
    async (applicationId: string) => {
      if (detailsCacheRef.current[applicationId]) {
        setDetailedApplication(detailsCacheRef.current[applicationId]);
        setDetailsError(null);
        setDetailsLoading(false);
        return;
      }

      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const { data: applicationRow, error } = await supabase
          .from("applications")
          .select(
            `
              id,
              status,
              submitted_at,
              updated_at,
              created_at,
              app_number,
              notes,
              internal_notes,
              timeline_json,
              student:students (
                id,
                legal_name,
                contact_email,
                contact_phone,
                profile:profiles (
                  full_name,
                  email
                )
              ),
              agent:agents (
                id,
                company_name,
                profile:profiles (
                  full_name,
                  email
                )
              ),
              program:programs (
                id,
                name,
                level
              )
            `,
          )
          .eq("id", applicationId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!applicationRow) {
          throw new Error("Application not found");
        }

        const { data: documentsData, error: documentsError } = await supabase
          .from("application_documents")
          .select(
            "id, document_type, storage_path, document_url, file_url, mime_type, uploaded_at, verified, verification_notes",
          )
          .eq("application_id", applicationId)
          .order("uploaded_at", { ascending: false });

        if (documentsError) {
          throw documentsError;
        }

        const detailed: DetailedApplication = {
          ...(applicationRow as ApplicationRow),
          documents: (documentsData ?? []) as ApplicationDocument[],
        };

        detailsCacheRef.current[applicationId] = detailed;
        setDetailedApplication(detailed);
      } catch (error) {
        logError(error, "UniversityApplications.loadApplicationDetails");
        const message = getErrorMessage(error);
        setDetailsError(message);
        toast(
          formatErrorForToast(error, "Failed to load application details"),
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    const applicationId = selectedApplication?.id;

    if (!applicationId) {
      setDetailedApplication(null);
      setDetailsError(null);
      setDetailsLoading(false);
      return;
    }

    void loadApplicationDetails(applicationId);
  }, [loadApplicationDetails, selectedApplication?.id]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    setPage(1);
  };

  const handleRefresh = async () => {
    const success = await fetchApplications();
    if (success) {
      toast({
        title: "Applications refreshed",
        description: "Showing the latest applications submitted by agents.",
      });
    }
  };

  const handleViewApplication = (application: ApplicationRow) => {
    setSelectedApplication(application);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedApplication(null);
    }
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const showingRangeStart = totalCount === 0 ? 0 : startIndex + 1;
  const showingRangeEnd =
    totalCount === 0 ? 0 : Math.min(totalCount, startIndex + applications.length);

  const renderTimeline = (items?: TimelineItem[] | null) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No timeline updates recorded yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${item.title ?? "timeline"}-${index}`} className="flex gap-3">
            <div className="relative">
              <div className="mt-2 h-2 w-2 rounded-full bg-blue-400" />
              {index !== items.length - 1 && (
                <div className="ml-[3px] h-full w-px bg-slate-700" />
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-100">
                {item.title ?? "Update"}
              </p>
              {item.description && (
                <p className="text-xs text-slate-400">{item.description}</p>
              )}
              {item.date && (
                <p className="text-xs text-slate-500">
                  {formatDateTime(item.date)}
                </p>
              )}
              {item.status && (
                <StatusBadge status={item.status} className="text-xs" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDocuments = (documents?: ApplicationDocument[] | null) => {
    if (!documents || documents.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No documents uploaded for this application yet.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-100">
                {formatDocumentType(document.document_type)}
              </p>
              <p className="text-xs text-muted-foreground">
                Uploaded {formatDateTime(document.uploaded_at)}
              </p>
              {document.storage_path && (
                <p className="break-all text-xs text-muted-foreground/80">
                  Storage path: {document.storage_path}
                </p>
              )}
              {document.document_url && (
                <p className="break-all text-xs text-muted-foreground/80">
                  URL: {document.document_url}
                </p>
              )}
              {document.verification_notes && (
                <p className="text-xs text-muted-foreground">
                  Notes: {document.verification_notes}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge variant={document.verified ? "default" : "outline"}>
                {document.verified ? "Verified" : "Pending review"}
              </Badge>
              {document.mime_type && (
                <Badge variant="secondary" className="text-xs">
                  {document.mime_type}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNotes = (application?: DetailedApplication | null) => {
    if (!application?.notes && !application?.internal_notes) {
      return (
        <p className="text-sm text-muted-foreground">
          No notes have been added yet.
        </p>
      );
    }

    return (
      <div className="space-y-4 text-sm">
        {application.notes && (
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">
              Agent notes
            </p>
            <p className="whitespace-pre-line text-slate-100">
              {application.notes}
            </p>
          </div>
        )}
        {application.internal_notes && (
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">
              Internal notes
            </p>
            <p className="whitespace-pre-line text-slate-100">
              {application.internal_notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Applications</h1>
        <p className="text-sm text-slate-400">
          Monitor applications submitted by agents, review documentation, and
          stay on top of decisions.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="space-y-4 lg:flex lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="text-base font-semibold text-slate-100">
              Applications library
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {totalCount === 0
                ? "No applications to display yet"
                : `Showing ${showingRangeStart}-${showingRangeEnd} of ${totalCount} applications`}
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by student, agent, or course"
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => void handleRefresh()}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 py-6">
              <LoadingState
                message={
                  applications.length === 0
                    ? "Loading applications..."
                    : "Refreshing applications..."
                }
                size="sm"
              />
            </div>
          )}

          {applications.length === 0 && !loading ? (
            <StatePlaceholder
              title={
                hasFiltersApplied
                  ? "No applications match your filters"
                  : "No applications yet"
              }
              description={
                hasFiltersApplied
                  ? "Update the status filter or search criteria to broaden your results."
                  : "When agents submit applications to your programmes, they will appear here."
              }
              className="bg-transparent"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student name</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date submitted</TableHead>
                    <TableHead>Last updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow
                      key={application.id}
                      className="cursor-pointer transition hover:bg-slate-800/40"
                      onClick={() => handleViewApplication(application)}
                    >
                      <TableCell className="space-y-1">
                        <p className="font-medium text-white">
                          {getStudentName(application)}
                        </p>
                        {getStudentEmail(application) && (
                          <p className="text-xs text-slate-400">
                            {getStudentEmail(application)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="space-y-1">
                        <p>{getAgentName(application)}</p>
                        {getAgentEmail(application) && (
                          <p className="text-xs text-slate-500">
                            {getAgentEmail(application)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="space-y-1">
                        <p>{getProgramName(application)}</p>
                        {getProgramLevel(application) && (
                          <p className="text-xs text-slate-500">
                            {getProgramLevel(application)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={application.status} />
                          {application.app_number && (
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] uppercase"
                            >
                              #{application.app_number}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleViewApplication(application);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatDate(application.submitted_at ?? application.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatDateTime(application.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {applications.length > 0 && (
            <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  {STATUS_FILTER_OPTIONS.find(
                    (option) => option.value === statusFilter,
                  )?.label ?? "All statuses"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page === totalPages || totalCount === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedApplication)}
        onOpenChange={handleDialogChange}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>View full application</DialogTitle>
            <DialogDescription>
              Explore the application timeline, supporting documents, and agent
              information in one place.
            </DialogDescription>
          </DialogHeader>

          {!selectedApplication ? null : detailsLoading ? (
            <div className="py-10">
              <LoadingState message="Loading application details..." />
            </div>
          ) : detailsError ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {detailsError}
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh] pr-3">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                      <GraduationCap className="h-4 w-4" />
                      Course
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-base font-semibold text-white">
                        {getProgramName(selectedApplication)}
                      </p>
                      {getProgramLevel(selectedApplication) && (
                        <p className="text-slate-400">
                          {getProgramLevel(selectedApplication)}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Submitted{" "}
                        {formatDate(
                          selectedApplication.submitted_at ??
                            selectedApplication.created_at,
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Last updated {formatDateTime(selectedApplication.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                      <ClipboardList className="h-4 w-4" />
                      Application
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <StatusBadge status={selectedApplication.status} />
                        {selectedApplication.app_number && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            #{selectedApplication.app_number}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Created {formatDateTime(selectedApplication.created_at)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                      <User className="h-4 w-4" />
                      Student
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-base font-semibold text-white">
                        {getStudentName(selectedApplication)}
                      </p>
                      <div className="flex flex-col gap-1 text-xs text-slate-400">
                        {getStudentEmail(selectedApplication) && (
                          <span className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            {getStudentEmail(selectedApplication)}
                          </span>
                        )}
                        {getStudentPhone(selectedApplication) && (
                          <span className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            {getStudentPhone(selectedApplication)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                      <Building2 className="h-4 w-4" />
                      Agent
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-base font-semibold text-white">
                        {getAgentName(selectedApplication)}
                      </p>
                      {getAgentEmail(selectedApplication) ? (
                        <p className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="h-3.5 w-3.5" />
                          {getAgentEmail(selectedApplication)}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No agent email on record.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                      <FileText className="h-4 w-4" />
                      Documents
                    </div>
                    {renderDocuments(detailedApplication?.documents)}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                      <FileText className="h-4 w-4" />
                      Notes
                    </div>
                    {renderNotes(detailedApplication)}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </div>
                  {renderTimeline(
                    detailedApplication?.timeline_json ??
                      selectedApplication.timeline_json,
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsPage;
