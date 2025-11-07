import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Loader2, Mail, Search, UserCircle } from "lucide-react";

import BackButton from "@/components/BackButton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserConfig } from "@/lib/supabaseClientConfig";

const { url: SUPABASE_URL, functionsUrl: SUPABASE_FUNCTIONS_URL } = getSupabaseBrowserConfig();
const FUNCTIONS_BASE = (SUPABASE_FUNCTIONS_URL ?? `${SUPABASE_URL}/functions/v1`).replace(/\/+$/, "");

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

interface ApplicationSummary {
  id: string;
  status: ApplicationStatus | null;
  updatedAt: string | null;
  programName: string | null;
  universityName: string | null;
  universityCountry: string | null;
  agentName: string | null;
}

interface StudentRecord {
  assignmentId: string;
  studentId: string;
  name: string;
  email: string;
  country: string;
  displayStatus: string;
  rawStatus: ApplicationStatus | null;
  pipelineStatus: ApplicationStatus | null;
  latestApplicationId: string | null;
  updatedAt: string | null;
  course: string | null;
  university: string | null;
  agentName: string | null;
  nationality: string | null;
  applications: ApplicationSummary[];
}

const STATUS_PIPELINE: { value: ApplicationStatus; label: string }[] = [
  { value: "screening", label: "Under Review" },
  { value: "conditional_offer", label: "Offer" },
  { value: "visa", label: "Visa" },
  { value: "enrolled", label: "Enrolled" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  screening: "Under Review",
  conditional_offer: "Offer",
  unconditional_offer: "Offer",
  cas_loa: "Visa",
  visa: "Visa",
  enrolled: "Enrolled",
  withdrawn: "Withdrawn",
  deferred: "Deferred",
};

const STATUS_PIPELINE_NORMALIZATION: Record<string, ApplicationStatus> = {
  draft: "screening",
  submitted: "screening",
  screening: "screening",
  conditional_offer: "conditional_offer",
  unconditional_offer: "conditional_offer",
  cas_loa: "visa",
  visa: "visa",
  enrolled: "enrolled",
};

const ACTIVE_STATUSES = new Set<ApplicationStatus | null>([
  "screening",
  "conditional_offer",
  "unconditional_offer",
  "cas_loa",
  "visa",
]);

type StudentAssignmentRow = Database["public"]["Tables"]["student_assignments"]["Row"];

type StudentAssignmentResult = StudentAssignmentRow & {
  student: (Database["public"]["Tables"]["students"]["Row"] & {
    applications: (Database["public"]["Tables"]["applications"]["Row"] & {
      program: (Database["public"]["Tables"]["programs"]["Row"] & {
        university: Database["public"]["Tables"]["universities"]["Row"] | null;
      }) | null;
      agent: (Database["public"]["Tables"]["agents"]["Row"] & {
        profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
      }) | null;
    })[] | null;
  }) | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

const deriveDisplayStatus = (status: ApplicationStatus | null) => {
  if (!status) return "No Application";
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const derivePipelineStatus = (status: ApplicationStatus | null) => {
  if (!status) return null;
  return STATUS_PIPELINE_NORMALIZATION[status] ?? null;
};

interface StatusPipelineProps {
  applicationId: string | null;
  currentStatus: ApplicationStatus | null;
  onChange: (nextStatus: ApplicationStatus) => void;
  updating: boolean;
}

function StatusPipeline({ applicationId, currentStatus, onChange, updating }: StatusPipelineProps) {
  if (!applicationId) {
    return <Badge variant="outline">No Application</Badge>;
  }

  const pipelineStatus = derivePipelineStatus(currentStatus);
  const activeIndex = pipelineStatus
    ? STATUS_PIPELINE.findIndex((stage) => stage.value === pipelineStatus)
    : -1;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {STATUS_PIPELINE.map((stage, index) => {
        const isActive = activeIndex === index;
        const isCompleted = activeIndex > index;
        return (
          <Fragment key={stage.value}>
            <Button
              type="button"
              size="sm"
              variant={isActive ? "default" : "secondary"}
              disabled={updating}
              className={cn(
                "h-7 rounded-full px-3 text-xs transition-colors",
                isCompleted && "bg-success/10 text-success hover:bg-success/20",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
              onClick={() => onChange(stage.value)}
            >
              {stage.label}
            </Button>
            {index < STATUS_PIPELINE.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

interface StudentDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRecord | null;
  onStatusChange: (applicationId: string, studentId: string, status: ApplicationStatus) => void;
  statusUpdatingId: string | null;
}

type StudentDocumentRow = Database["public"]["Tables"]["student_documents"]["Row"];

function StudentDetailDrawer({
  open,
  onOpenChange,
  student,
  onStatusChange,
  statusUpdatingId,
}: StudentDetailDrawerProps) {
  const { session, profile } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<StudentDocumentRow[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [zoeSummary, setZoeSummary] = useState<string>("");
  const [zoeLoading, setZoeLoading] = useState(false);
  const [zoeError, setZoeError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!student) return;

    setDocumentsLoading(true);
    setDocumentsError(null);

    try {
      const { data, error } = await supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", student.studentId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const pdfs = (data ?? []).filter((doc) =>
        (doc.mime_type ?? doc.file_name ?? "").toLowerCase().includes("pdf"),
      );
      setDocuments(pdfs);
    } catch (error) {
      console.error("Failed to load documents", error);
      setDocumentsError("Unable to load documents for this student.");
    } finally {
      setDocumentsLoading(false);
    }
  }, [student]);

  const handleDownload = useCallback(
    async (document: StudentDocumentRow) => {
      try {
        const { data, error } = await supabase.storage
          .from("student-documents")
          .createSignedUrl(document.storage_path, 60);

        if (error) throw error;

        const url = data?.signedUrl;
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          throw new Error("Missing signed URL");
        }
      } catch (error) {
        console.error("Failed to download document", error);
        toast({
          title: "Download failed",
          description: "Zoe couldn't fetch this document right now.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const fetchZoeSummary = useCallback(async () => {
    if (!student) return;
    if (!session?.access_token) {
      setZoeError("Sign in to view Zoe summaries.");
      return;
    }

    setZoeLoading(true);
    setZoeError(null);
    setZoeSummary("");

    try {
      const prompt = [
        "Show summary of this student's progress.",
        `Student: ${student.name}`,
        student.email ? `Email: ${student.email}` : null,
        student.country ? `Country: ${student.country}` : null,
        student.course ? `Course: ${student.course}` : null,
        student.university ? `University: ${student.university}` : null,
        student.displayStatus ? `Latest status: ${student.displayStatus}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch(`${FUNCTIONS_BASE}/ai-chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: `staff-student-summary-${student.studentId}`,
          audience: profile?.role ?? "staff",
          locale: typeof navigator !== "undefined" ? navigator.language : "en",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          metadata: {
            surface: "staff-student-progress-summary",
            student_id: student.studentId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Zoe couldn't provide a summary right now.");
      }

      if (!response.body) {
        const text = await response.text();
        setZoeSummary(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split("\n\n").filter(Boolean);

        for (const event of events) {
          if (!event.startsWith("data:")) continue;
          const data = event.replace(/^data:\s*/, "").trim();
          if (!data) continue;
          if (data === "[DONE]") {
            done = true;
            break;
          }

          try {
            const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const textChunk = parsed?.choices?.[0]?.delta?.content;
            if (textChunk) {
              accumulated += textChunk;
              setZoeSummary(accumulated);
            }
          } catch (error) {
            accumulated += data;
            setZoeSummary(accumulated);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch Zoe summary", error);
      setZoeError(
        error instanceof Error ? error.message : "Zoe is unavailable right now. Please try again.",
      );
    } finally {
      setZoeLoading(false);
    }
  }, [profile?.role, session?.access_token, student]);

  useEffect(() => {
    if (!open || !student) return;
    void fetchDocuments();
    void fetchZoeSummary();
  }, [fetchDocuments, fetchZoeSummary, open, student]);

  useEffect(() => {
    if (!open) {
      setDocuments([]);
      setDocumentsError(null);
      setZoeSummary("");
      setZoeError(null);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 overflow-hidden sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{student?.name ?? "Student Details"}</SheetTitle>
          <SheetDescription>
            Review student progress, documents, and Zoe insights in one place.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex h-full flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                    <CardDescription>
                      Key contact details and the latest application snapshot.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{student?.email ?? "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Country</p>
                      <p className="text-muted-foreground">{student?.country ?? "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Course</p>
                      <p className="text-muted-foreground">{student?.course ?? "Pending application"}</p>
                    </div>
                    <div>
                      <p className="font-medium">University</p>
                      <p className="text-muted-foreground">{student?.university ?? "Not assigned"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Assigned Agent</p>
                      <p className="text-muted-foreground">{student?.agentName ?? "Not assigned"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Status</p>
                      <StatusPipeline
                        applicationId={student?.latestApplicationId ?? null}
                        currentStatus={student?.rawStatus ?? null}
                        onChange={(status) => {
                          if (student?.latestApplicationId && student?.studentId) {
                            onStatusChange(student.latestApplicationId, student.studentId, status);
                          }
                        }}
                        updating={statusUpdatingId === (student?.latestApplicationId ?? null)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Applications</CardTitle>
                    <CardDescription>Latest updates across the student's applications.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {student?.applications.length ? (
                      student.applications.map((application) => (
                        <div key={application.id} className="space-y-2 rounded-md border p-3">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>{application.programName ?? "Program pending"}</span>
                            <Badge variant="secondary">{deriveDisplayStatus(application.status)}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>{application.universityName ?? "University TBD"}</p>
                            <p>Updated {formatDate(application.updatedAt)}</p>
                            {application.agentName && <p>Agent: {application.agentName}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No applications available yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Chat with Zoe</CardTitle>
                    <CardDescription>AI summary of this student's journey so far.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {zoeLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Zoe is preparing the summary…
                      </div>
                    ) : zoeError ? (
                      <p className="text-sm text-destructive">{zoeError}</p>
                    ) : zoeSummary ? (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-muted-foreground">
                        {zoeSummary}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Zoe will summarise progress once the student's applications begin moving.
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => void fetchZoeSummary()} disabled={zoeLoading}>
                        {zoeLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Refreshing
                          </>
                        ) : (
                          "Refresh summary"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-6">
                {documentsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
                  </div>
                ) : documentsError ? (
                  <p className="text-sm text-destructive">{documentsError}</p>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No PDF documents have been uploaded for this student yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="text-sm font-medium">{document.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {formatDate(document.updated_at)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDownload(document)}
                        >
                          <Download className="mr-2 h-4 w-4" /> View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default function StaffStudents() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!profile?.id) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("student_assignments")
        .select(
          `id, assigned_at, student:students (
            id,
            preferred_name,
            legal_name,
            contact_email,
            current_country,
            nationality,
            updated_at,
            applications (
              id,
              status,
              updated_at,
              program:programs (
                name,
                university:universities ( name, country )
              ),
              agent:agents (
                id,
                profile:profiles ( full_name )
              )
            )
          )`,
        )
        .eq("counselor_id", profile.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      const mapped = (data as StudentAssignmentResult[] | null)?.map((assignment) => {
        const student = assignment.student;
        if (!student) return null;

        const applications = (student.applications ?? []).slice().sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });

        const latest = applications[0];

        const summaryApplications: ApplicationSummary[] = applications.map((application) => ({
          id: application.id,
          status: application.status,
          updatedAt: application.updated_at,
          programName: application.program?.name ?? null,
          universityName: application.program?.university?.name ?? null,
          universityCountry: application.program?.university?.country ?? null,
          agentName: application.agent?.profile?.full_name ?? null,
        }));

        const rawStatus = latest?.status ?? null;
        const pipelineStatus = derivePipelineStatus(rawStatus);

        return {
          assignmentId: assignment.id,
          studentId: student.id,
          name: student.preferred_name ?? student.legal_name ?? "Unnamed student",
          email: student.contact_email ?? "",
          country: student.current_country ?? student.nationality ?? "",
          displayStatus: deriveDisplayStatus(rawStatus),
          rawStatus,
          pipelineStatus,
          latestApplicationId: latest?.id ?? null,
          updatedAt: latest?.updated_at ?? student.updated_at ?? null,
          course: latest?.program?.name ?? null,
          university: latest?.program?.university?.name ?? null,
          agentName: latest?.agent?.profile?.full_name ?? null,
          nationality: student.nationality,
          applications: summaryApplications,
        } satisfies StudentRecord;
      });

      setStudents((mapped ?? []).filter((student): student is StudentRecord => Boolean(student)));
    } catch (error) {
      console.error("Failed to load staff students", error);
      setError("We couldn't load your student list. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading) return;
    void fetchStudents();
  }, [authLoading, fetchStudents]);

  const handleStatusChange = useCallback(
    async (applicationId: string, studentId: string, status: ApplicationStatus) => {
      setStatusUpdatingId(applicationId);
      try {
        const { error } = await supabase
          .from("applications")
          .update({ status })
          .eq("id", applicationId);

        if (error) throw error;

        const updatedAt = new Date().toISOString();

        setStudents((prev) =>
          prev.map((student) => {
            if (student.studentId !== studentId) return student;
            const displayStatus = deriveDisplayStatus(status);
            return {
              ...student,
              rawStatus: status,
              displayStatus,
              pipelineStatus: derivePipelineStatus(status),
              updatedAt,
              applications: student.applications.map((application) =>
                application.id === applicationId
                  ? { ...application, status, updatedAt }
                  : application,
              ),
            } satisfies StudentRecord;
          }),
        );

        setSelectedStudent((current) => {
          if (!current || current.studentId !== studentId) return current;
          const displayStatus = deriveDisplayStatus(status);
          return {
            ...current,
            rawStatus: status,
            displayStatus,
            pipelineStatus: derivePipelineStatus(status),
            updatedAt,
            applications: current.applications.map((application) =>
              application.id === applicationId
                ? { ...application, status, updatedAt }
                : application,
            ),
          } satisfies StudentRecord;
        });

        toast({
          title: "Status updated",
          description: "The student's application status has been updated.",
        });
      } catch (error) {
        console.error("Failed to update status", error);
        toast({
          title: "Update failed",
          description: "We couldn't update the status. Please try again.",
          variant: "destructive",
        });
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [toast],
  );

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    students.forEach((student) => {
      if (student.displayStatus && student.displayStatus !== "No Application") {
        statuses.add(student.displayStatus);
      }
    });
    return Array.from(statuses).sort();
  }, [students]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    students.forEach((student) => {
      if (student.country) countries.add(student.country);
    });
    return Array.from(countries).sort();
  }, [students]);

  const uniqueUniversities = useMemo(() => {
    const universities = new Set<string>();
    students.forEach((student) => {
      if (student.university) universities.add(student.university);
    });
    return Array.from(universities).sort();
  }, [students]);

  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    students.forEach((student) => {
      if (student.agentName) agents.add(student.agentName);
    });
    return Array.from(agents).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.university?.toLowerCase().includes(query) ||
        student.course?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || student.displayStatus === statusFilter;
      const matchesCountry = countryFilter === "all" || student.country === countryFilter;
      const matchesUniversity =
        universityFilter === "all" || student.university === universityFilter;
      const matchesAgent = agentFilter === "all" || student.agentName === agentFilter;

      return matchesSearch && matchesStatus && matchesCountry && matchesUniversity && matchesAgent;
    });
  }, [agentFilter, countryFilter, searchQuery, statusFilter, students, universityFilter]);

  const totalStudents = students.length;
  const activeStudents = students.filter((student) => ACTIVE_STATUSES.has(student.rawStatus)).length;
  const enrolledStudents = students.filter((student) => student.rawStatus === "enrolled").length;

  const handleRowSelect = (student: StudentRecord) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Students Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Focus on the students assigned to you and keep their progress moving.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assigned Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{loading ? "…" : activeStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{loading ? "…" : enrolledStudents}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Students</CardTitle>
            <CardDescription>Quickly narrow down students by status, region, or partner.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="md:col-span-2 xl:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, course, or university…"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {uniqueUniversities.map((university) => (
                    <SelectItem key={university} value={university}>
                      {university}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>{filteredStudents.length} student(s) found</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Agent</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Updated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No students match your filters yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.studentId} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="truncate" title={student.email}>
                                {student.email || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{student.country || "—"}</TableCell>
                          <TableCell>{student.course ?? "Pending"}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="secondary">{student.displayStatus}</Badge>
                              <StatusPipeline
                                applicationId={student.latestApplicationId}
                                currentStatus={student.rawStatus}
                                onChange={(status) => {
                                  if (student.latestApplicationId) {
                                    void handleStatusChange(
                                      student.latestApplicationId,
                                      student.studentId,
                                      status,
                                    );
                                  }
                                }}
                                updating={statusUpdatingId === student.latestApplicationId}
                              />
                            </div>
                          </TableCell>
                          <TableCell>{student.agentName ?? "—"}</TableCell>
                          <TableCell>{student.university ?? "—"}</TableCell>
                          <TableCell>{formatDate(student.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRowSelect(student)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/student/profile/${student.studentId}`)}
                              >
                                Open Profile
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <StudentDetailDrawer
          open={detailOpen}
          onOpenChange={setDetailOpen}
          student={selectedStudent}
          onStatusChange={handleStatusChange}
          statusUpdatingId={statusUpdatingId}
        />
      </div>
    </DashboardLayout>
  );
}

