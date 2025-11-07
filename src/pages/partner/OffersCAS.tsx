import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Filter, GraduationCap, University } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import emptyStateIllustration from "@/assets/university-application.png";

type OfferType = "conditional" | "unconditional";
type RecordStatus = "issued" | "pending";

interface SupabaseProfile {
  full_name?: string | null;
  email?: string | null;
}

interface SupabaseStudent {
  profiles?: SupabaseProfile | null;
}

interface SupabaseUniversity {
  name?: string | null;
}

interface SupabaseProgram {
  universities?: SupabaseUniversity | null;
}

interface SupabaseApplication {
  id: string;
  students?: SupabaseStudent | null;
  programs?: SupabaseProgram | null;
}

interface OfferRecord {
  id: string;
  offer_type: OfferType | null;
  letter_url?: string | null;
  created_at: string | null;
  application_id: string;
  applications?: SupabaseApplication | null;
}

interface CasRecord {
  id: string;
  cas_number?: string | null;
  issue_date?: string | null;
  file_url?: string | null;
  application_id: string;
  applications?: SupabaseApplication | null;
}

interface CombinedRecord {
  applicationId: string;
  studentName: string;
  studentEmail?: string;
  universityName: string;
  offerType?: OfferType;
  offerLetterUrl?: string;
  offerCreatedAt?: string;
  casNumber?: string;
  casLetterUrl?: string;
  casIssueDate?: string;
}

interface ProcessedRecord {
  id: string;
  student: string;
  email?: string;
  university: string;
  offerType?: OfferType;
  offerLetterUrl?: string;
  casNumber?: string;
  casLetterUrl?: string;
  dateIssued?: string;
  status: RecordStatus;
}

const offerTypeBadgeStyles: Record<OfferType, string> = {
  conditional:
    "border-blue-400/40 bg-blue-500/10 text-blue-200 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-100",
  unconditional:
    "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100",
};

const statusBadgeStyles: Record<RecordStatus, string> = {
  issued:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-100",
  pending:
    "border-slate-500/40 bg-slate-500/10 text-slate-200 dark:border-slate-500/40 dark:bg-slate-800 dark:text-slate-200",
};

const formatDate = (isoDate?: string) => {
  if (!isoDate) return "—";
  try {
    return format(new Date(isoDate), "PPP");
  } catch (error) {
    console.warn("Unable to format date", error);
    return "—";
  }
};

const fetchOffersAndCas = async (): Promise<ProcessedRecord[]> => {
  const offerSelect = `
    id,
    offer_type,
    letter_url,
    created_at,
    application_id,
    applications (
      id,
      students (
        profiles (
          full_name,
          email
        )
      ),
      programs (
        universities (
          name
        )
      )
    )
  `;

  const casSelect = `
    id,
    cas_number,
    issue_date,
    file_url,
    application_id,
    applications (
      id,
      students (
        profiles (
          full_name,
          email
        )
      ),
      programs (
        universities (
          name
        )
      )
    )
  `;

  const fetchCasLetters = async (): Promise<CasRecord[]> => {
    const casLettersResponse = await supabase
      .from<CasRecord>("cas_letters")
      .select(casSelect)
      .order("issue_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false });

    if (casLettersResponse.error) {
      const errorCode = (casLettersResponse.error as { code?: string }).code;
      if (
        errorCode === "42P01" ||
        casLettersResponse.error.message?.toLowerCase().includes("cas_letters")
      ) {
        const fallbackResponse = await supabase
          .from<CasRecord>("cas_loa")
          .select(casSelect)
          .order("issue_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false, nullsFirst: false });

        if (fallbackResponse.error) {
          throw fallbackResponse.error;
        }

        return (fallbackResponse.data ?? []) as CasRecord[];
      }

      throw casLettersResponse.error;
    }

    return (casLettersResponse.data ?? []) as CasRecord[];
  };

  const [offersResponse, casLetters] = await Promise.all([
    supabase.from<OfferRecord>("offers").select(offerSelect).order("created_at", {
      ascending: false,
      nullsFirst: false,
    }),
    fetchCasLetters(),
  ]);

  if (offersResponse.error) {
    throw offersResponse.error;
  }

  const offers = (offersResponse.data ?? []) as OfferRecord[];

  const combinedMap = new Map<string, CombinedRecord>();

  const upsertRecord = (
    applicationId: string,
    updater: (record: CombinedRecord) => CombinedRecord,
  ) => {
    const existing =
      combinedMap.get(applicationId) ??
      ({
        applicationId,
        studentName: "Unknown Student",
        universityName: "Unknown University",
      } as CombinedRecord);
    const next = updater(existing);
    combinedMap.set(applicationId, next);
  };

  const extractDetails = (application?: SupabaseApplication | null) => {
    const studentName = application?.students?.profiles?.full_name ?? "Unknown Student";
    const studentEmail = application?.students?.profiles?.email ?? undefined;
    const universityName =
      application?.programs?.universities?.name ?? "Unknown University";
    return { studentName, studentEmail, universityName };
  };

  for (const offer of offers) {
    const { studentName, studentEmail, universityName } = extractDetails(
      offer.applications,
    );

    upsertRecord(offer.application_id, (current) => ({
      ...current,
      studentName,
      studentEmail,
      universityName,
      offerType: offer.offer_type ?? undefined,
      offerLetterUrl: offer.letter_url ?? undefined,
      offerCreatedAt: offer.created_at ?? undefined,
    }));
  }

  for (const cas of casLetters) {
    const { studentName, studentEmail, universityName } = extractDetails(
      cas.applications,
    );

    upsertRecord(cas.application_id, (current) => ({
      ...current,
      studentName,
      studentEmail,
      universityName,
      casNumber: cas.cas_number ?? undefined,
      casLetterUrl: cas.file_url ?? undefined,
      casIssueDate: cas.issue_date ?? undefined,
    }));
  }

  const combinedRecords = Array.from(combinedMap.values());

  return combinedRecords.map((record) => {
    const status: RecordStatus =
      record.casNumber || record.casLetterUrl || record.casIssueDate
        ? "issued"
        : "pending";

    return {
      id: record.applicationId,
      student: record.studentName,
      email: record.studentEmail,
      university: record.universityName,
      offerType: record.offerType,
      offerLetterUrl: record.offerLetterUrl,
      casNumber: record.casNumber,
      casLetterUrl: record.casLetterUrl,
      dateIssued: record.casIssueDate ?? record.offerCreatedAt,
      status,
    };
  });
};

export default function OffersCASPage() {
  const { toast } = useToast();

  const [offerTypeFilter, setOfferTypeFilter] = useState<OfferType | "all">("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");

  const {
    data: records = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["partner-offers-cas"],
    queryFn: fetchOffersAndCas,
    onError: (queryError) => {
      console.error("Failed to fetch partner offers and CAS records", queryError);
      toast({
        title: "Unable to load records",
        description:
          queryError instanceof Error
            ? queryError.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  const universityOptions = useMemo(() => {
    const unique = Array.from(
      new Set(records.map((record) => record.university).filter(Boolean)),
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesOfferType =
        offerTypeFilter === "all" || record.offerType === offerTypeFilter;
      const matchesUniversity =
        universityFilter === "all" || record.university === universityFilter;
      return matchesOfferType && matchesUniversity;
    });
  }, [records, offerTypeFilter, universityFilter]);

  const summary = useMemo(() => {
    const totalOffers = records.length;
    const issuedCas = records.filter((record) => record.status === "issued").length;
    const pendingCas = records.filter((record) => record.status === "pending").length;
    return { totalOffers, issuedCas, pendingCas };
  }, [records]);

  const handleDownload = (url?: string) => {
    if (!url) {
      toast({
        title: "No document available",
        description: "This record does not have a downloadable file yet.",
        variant: "destructive",
      });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="py-16">
          <LoadingState message="Loading partner offers and CAS letters..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-base font-medium text-red-400">
            We couldn&apos;t load the records.
          </p>
          <p className="text-sm text-slate-400">
            Please refresh the page or try again later.
          </p>
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="flex flex-col items-center gap-6 py-16">
          <img
            src={emptyStateIllustration}
            alt="No offers yet"
            className="h-40 w-40 rounded-xl border border-slate-800/60 bg-slate-900/60 object-cover p-4"
          />
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold text-slate-100">
              No offers or CAS letters yet
            </h3>
            <p className="max-w-md text-sm text-slate-400">
              Once universities issue offers and CAS letters for your students, they will
              appear here for quick tracking.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <Filter className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      );
    }

    if (filteredRecords.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-slate-400">
          <p className="text-lg font-semibold text-slate-100">
            No records match these filters
          </p>
          <p className="max-w-md text-sm">
            Try adjusting the offer type or university filter to see more results.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60">
              <TableHead className="text-slate-300">Student</TableHead>
              <TableHead className="text-slate-300">University</TableHead>
              <TableHead className="text-slate-300">Offer Type</TableHead>
              <TableHead className="text-slate-300">CAS Number</TableHead>
              <TableHead className="text-slate-300">Date Issued</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow
                key={`${record.id}-${record.casNumber ?? record.offerType ?? "record"}`}
                className="border-slate-800/50 bg-slate-950/40 transition-colors hover:bg-slate-900/40"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-100">{record.student}</span>
                    {record.email && (
                      <span className="text-xs text-slate-400">{record.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px]">
                  <span className="truncate text-slate-100" title={record.university}>
                    {record.university}
                  </span>
                </TableCell>
                <TableCell>
                  {record.offerType ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        offerTypeBadgeStyles[record.offerType],
                      )}
                    >
                      {record.offerType}
                    </Badge>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-200">
                  {record.casNumber ?? "—"}
                </TableCell>
                <TableCell className="text-slate-200">
                  {formatDate(record.dateIssued)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("capitalize", statusBadgeStyles[record.status])}
                  >
                    {record.status === "issued" ? "Issued" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-blue-200 hover:text-blue-100"
                      onClick={() => handleDownload(record.offerLetterUrl)}
                    >
                      <Download className="h-4 w-4" />
                      Offer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-emerald-200 hover:text-emerald-100"
                      onClick={() => handleDownload(record.casLetterUrl)}
                    >
                      <Download className="h-4 w-4" />
                      CAS Letter
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
        <PartnerSidebar />
        <SidebarInset className="flex min-h-screen flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          <PartnerHeader />
          <main className="flex-1 space-y-8 px-4 pb-12 pt-6 md:px-8 lg:px-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                Offers &amp; CAS Tracking
              </h1>
              <p className="text-sm text-slate-400">
                Review university offers, track CAS issuance, and download documents for
                your students.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border border-slate-800/60 bg-slate-950/60 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Total Offers
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-blue-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-100">
                    {summary.totalOffers}
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-slate-800/60 bg-slate-950/60 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Issued CAS
                  </CardTitle>
                  <Download className="h-4 w-4 text-emerald-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-emerald-400">
                    {summary.issuedCas}
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-slate-800/60 bg-slate-950/60 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Pending CAS
                  </CardTitle>
                  <University className="h-4 w-4 text-slate-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-200">
                    {summary.pendingCas}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-800/60 bg-slate-950/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100">Filters</CardTitle>
                <CardDescription className="text-slate-400">
                  Narrow the records by offer type or university partner.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Offer Type
                  </p>
                  <Select
                    value={offerTypeFilter}
                    onValueChange={(value) =>
                      setOfferTypeFilter(value as OfferType | "all")
                    }
                  >
                    <SelectTrigger className="bg-slate-900/80 text-slate-100">
                      <Filter className="mr-2 h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="All offer types" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 text-slate-100">
                      <SelectItem value="all">All offer types</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                      <SelectItem value="unconditional">Unconditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    University
                  </p>
                  <Select
                    value={universityFilter}
                    onValueChange={(value) => setUniversityFilter(value)}
                  >
                    <SelectTrigger className="bg-slate-900/80 text-slate-100">
                      <University className="mr-2 h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="All universities" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto bg-slate-950 text-slate-100">
                      <SelectItem value="all">All universities</SelectItem>
                      {universityOptions.map((university) => (
                        <SelectItem key={university} value={university}>
                          {university}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    <Filter className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-800/60 bg-slate-950/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100">
                  Offers &amp; CAS Letters
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Track offers and CAS issuance progress across your student portfolio.
                </CardDescription>
              </CardHeader>
              <CardContent>{renderContent()}</CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
