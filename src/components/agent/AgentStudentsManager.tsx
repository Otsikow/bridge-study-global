import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  Clock3,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAgentStudents, agentStudentsQueryKey } from "@/hooks/useAgentStudents";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const addStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please provide at least 2 characters.")
    .max(200, "Name cannot exceed 200 characters."),
  email: z.string().email("Enter a valid email address."),
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.trim().length >= 6,
      "If provided, phone number should contain at least 6 characters.",
    ),
});

type AddStudentFormValues = z.infer<typeof addStudentSchema>;

interface AddStudentDialogProps {
  agentProfileId?: string | null;
  tenantId?: string | null;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddStudentDialog = ({
  agentProfileId,
  tenantId,
  disabled,
  open,
  onOpenChange,
}: AddStudentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  const handleSuccess = () => {
    onOpenChange(false);
    reset();
    if (agentProfileId) {
      queryClient.invalidateQueries({
        queryKey: agentStudentsQueryKey(agentProfileId),
      });
    }
  };

  const onSubmit = async (values: AddStudentFormValues) => {
    if (!agentProfileId || !tenantId) {
      toast({
        title: "Missing agent details",
        description: "We could not verify your agent profile. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
        agentProfileId,
        tenantId,
      };

      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        studentId?: string;
        inviteType?: string;
        error?: string;
      }>("invite-student", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error ?? "The student invite could not be completed.");
      }

      toast({
        title: "Student invited",
        description: `${values.fullName} will receive an email with next steps.`,
      });

      handleSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while inviting the student.";

      toast({
        title: "Unable to invite student",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a student</DialogTitle>
          <DialogDescription>
            Send an invite to connect a student to your dashboard. They&apos;ll receive an email
            with instructions to activate their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number (optional)</Label>
            <Input id="phone" autoComplete="tel" {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <DialogFooter className="gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const formatRelativeTime = (value: string | null) => {
  if (!value) return "—";
  try {
    const date = parseISO(value);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch {
    return "—";
  }
};

type StatusFilter = "all" | "onboarded" | "pending";

const statusOptions: Record<StatusFilter, string> = {
  all: "All statuses",
  onboarded: "Onboarded",
  pending: "Pending onboarding",
};

const statusBadgeClass = (status: StatusFilter) => {
  switch (status) {
    case "onboarded":
      return "bg-success/10 text-success border-success/20";
    case "pending":
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const StudentTableSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-64 mt-2" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const MetricsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-3">
    {[...Array(3)].map((_, idx) => (
      <Card key={idx}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function AgentStudentsManager() {
  const { profile, loading: authLoading } = useAuth();
  const agentProfileId = profile?.id ?? null;
  const tenantId = profile?.tenant_id ?? null;

  const { data, isLoading, isFetching, isError, error, refetch } = useAgentStudents(agentProfileId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const allStudents = data ?? [];

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return allStudents.filter((student) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.displayName.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch) ||
        (student.username?.toLowerCase().includes(normalizedSearch) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "onboarded" && student.onboarded) ||
        (statusFilter === "pending" && !student.onboarded);

      return matchesSearch && matchesStatus;
    });
  }, [allStudents, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const total = allStudents.length;
    const onboarded = allStudents.filter((student) => student.onboarded).length;
    const pending = total - onboarded;
    const totalApplications = allStudents.reduce(
      (accumulator, student) => accumulator + (student.applicationCount ?? 0),
      0,
    );

    return {
      total,
      onboarded,
      pending,
      totalApplications,
    };
  }, [allStudents]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <MetricsSkeleton />
        <StudentTableSkeleton />
      </div>
    );
  }

  if (!agentProfileId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No agent profile detected</AlertTitle>
        <AlertDescription>
          We could not find an agent profile connected to your account. Please contact support if
          this continues.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">My Students</h2>
          <p className="text-sm text-muted-foreground">
            Track student progress, invite new prospects, and monitor application activity.
          </p>
        </div>
        <AddStudentDialog
          agentProfileId={agentProfileId}
          tenantId={tenantId}
          disabled={!tenantId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      </div>

      {isLoading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">Assigned to you</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Onboarded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{metrics.onboarded}</div>
              <p className="text-xs text-muted-foreground">Ready for applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending onboarding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{metrics.pending}</div>
              <p className="text-xs text-muted-foreground">Invited but not completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalApplications}</div>
              <p className="text-xs text-muted-foreground">Across all linked students</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {isFetching ? "Refreshing latest data…" : `${filteredStudents.length} student(s)`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or username…"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="lg:w-[220px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{statusOptions.all}</SelectItem>
                  <SelectItem value="onboarded">{statusOptions.onboarded}</SelectItem>
                  <SelectItem value="pending">{statusOptions.pending}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="lg:w-auto"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to load students</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <span>{error?.message ?? "An unexpected error occurred."}</span>
                <Button variant="outline" onClick={() => refetch()} className="w-fit">
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <StudentTableSkeleton />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-8 w-8" />}
              title={searchQuery ? "No students match your search" : "No students yet"}
              description={
                searchQuery
                  ? "Adjust your filters or search text to see other students."
                  : "Invite your first student to start tracking applications and progress."
              }
              action={
                searchQuery
                  ? undefined
                  : {
                      label: "Invite student",
                      onClick: () => {
                        setStatusFilter("all");
                        setSearchQuery("");
                        setInviteDialogOpen(true);
                      },
                    }
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const status: StatusFilter = student.onboarded ? "onboarded" : "pending";
                    return (
                      <TableRow key={student.studentId} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="font-medium">{student.displayName}</div>
                          {student.email !== "unknown@example.com" && (
                            <p className="text-xs text-muted-foreground">
                              @{student.username ?? student.profileId.slice(0, 6)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="truncate max-w-[200px]" title={student.email}>
                                {student.email}
                              </span>
                            </div>
                            {student.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[180px]" title={student.phone}>
                                  {student.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {student.country ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(statusBadgeClass(status))}>
                            {student.onboarded ? (
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {statusOptions[status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {student.applicationCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(student.updatedAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
