import { useMemo, useState } from "react";
import { CalendarClock, CheckSquare, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StaffPagination from "@/components/staff/StaffPagination";
import { useStaffTasks, useUpdateTaskStatus, STAFF_PAGE_SIZE } from "@/hooks/useStaffData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusLabels: Record<string, { label: string; variant: "default" | "outline" | "secondary" }> = {
  open: { label: "To do", variant: "secondary" },
  in_progress: { label: "In progress", variant: "default" },
  done: { label: "Completed", variant: "outline" },
  blocked: { label: "Blocked", variant: "outline" },
};

const priorityBadges: Record<string, string> = {
  high: "bg-orange-500/10 text-orange-600 border border-orange-500/40",
  medium: "bg-blue-500/10 text-blue-600 border border-blue-500/40",
  low: "bg-muted text-muted-foreground",
};

export function StaffTasksBoard() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const { data, isLoading, isFetching } = useStaffTasks(page, { status, priority });
  const mutation = useUpdateTaskStatus();

  const total = data?.total ?? 0;
  const rows = data?.data ?? [];

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "open", label: "To do" },
      { value: "in_progress", label: "In progress" },
      { value: "blocked", label: "Blocked" },
      { value: "done", label: "Completed" },
    ],
    [],
  );

  const priorityOptions = useMemo(
    () => [
      { value: "all", label: "All priorities" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
    [],
  );

  const handleUpdateStatus = (taskId: string, nextStatus: string) => {
    mutation.mutate({ taskId, status: nextStatus });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5 text-primary" /> Tasks & Workflows
          </CardTitle>
          <CardDescription>Stay on top of deadlines with Zoe-assisted triage.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(value) => { setPriority(value); setPage(1); }}>
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {(isLoading || isFetching) && rows.length === 0 && (
            <div className="space-y-3 rounded-xl border bg-background p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!isLoading && rows.length === 0 && (
            <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Zoe has no tasks for you right now.
            </div>
          )}

          {rows.map((task) => {
            const statusDetail = statusLabels[task.status ?? "open"] ?? statusLabels.open;
            const priorityClass = priorityBadges[task.priority ?? "medium"] ?? priorityBadges.medium;
            return (
              <div key={task.id} className="rounded-xl border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusDetail.variant}>{statusDetail.label}</Badge>
                      <Badge className={priorityClass}>Priority {task.priority ?? "medium"}</Badge>
                    </div>
                    <p className="mt-2 text-base font-semibold">{task.title}</p>
                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}
                      </span>
                      {task.assigneeName && <span>Assigned to {task.assigneeName}</span>}
                      {task.applicationId && <span>Application #{task.applicationId.slice(0, 8)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.entries(statusLabels)
                      .filter(([value]) => value !== task.status)
                      .map(([value, detail]) => (
                        <Button
                          key={value}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleUpdateStatus(task.id, value)}
                          disabled={mutation.isPending}
                        >
                          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />} {detail.label}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <StaffPagination page={page} total={total} pageSize={STAFF_PAGE_SIZE} onChange={setPage} />
      </CardContent>
    </Card>
  );
}

export default StaffTasksBoard;
