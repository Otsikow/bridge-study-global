"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import {
  format,
  endOfDay,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import BackButton from "@/components/BackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Plus,
  Calendar,
  User,
  FileText,
  Loader2,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import StaffTasksBoard from "@/components/staff/StaffTasksBoard";
import { formatErrorForToast, logError } from "@/lib/errorUtils";

type TaskPriority = "high" | "medium" | "low";
type UiTaskStatus = "todo" | "in_progress" | "completed" | "blocked";
type DbTaskStatus = "open" | "in_progress" | "done" | "blocked";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: UiTaskStatus;
  dueDate: string | null;
  assignedTo: string;
  assigneeId: string | null;
  relatedTo?: string;
  applicationId?: string | null;
  createdAt: string;
  updatedAt: string | null;
  isBlocked?: boolean;
}

interface NewTaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
}

interface AssigneeOption {
  id: string;
  label: string;
}

type StatusFilter = "all" | UiTaskStatus;
type PriorityFilter = "all" | TaskPriority;
type DeadlineFilter = "all" | "overdue" | "due_today" | "due_this_week" | "no_due";

const dbStatusToUi = (status: string | null): UiTaskStatus => {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "done":
      return "completed";
    case "blocked":
      return "blocked";
    default:
      return "todo";
  }
};

const uiStatusToDb = (status: UiTaskStatus): DbTaskStatus => {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "completed":
      return "done";
    case "blocked":
      return "blocked";
    default:
      return "open";
  }
};

const normalizePriority = (priority: string | null): TaskPriority => {
  if (priority === "high" || priority === "low") return priority;
  return "medium";
};

const getInitialNewTask = (assigneeId: string | null): NewTaskForm => ({
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assigneeId: assigneeId ?? "",
});

export default function StaffTasks() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>(() => getInitialNewTask(null));

  const canManageTasks = profile?.role === "staff" || profile?.role === "admin";

  useEffect(() => {
    if (profile?.id) {
      setNewTask((prev) => ({
        ...prev,
        assigneeId: prev.assigneeId || profile.id,
      }));
    }
  }, [profile?.id]);

  const loadAssignees = useCallback(async () => {
    if (!profile) return;
    try {
      if (!canManageTasks) {
        const selfLabel = profile.full_name
          ? `${profile.full_name} (You)`
          : "You";
        setAssignees([{ id: profile.id, label: selfLabel }]);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("tenant_id", profile.tenant_id)
        .in("role", ["staff", "admin", "agent"]);

      if (error) throw error;

      const options: AssigneeOption[] = data?.map((m) => ({
        id: m.id,
        label:
          m.id === profile.id
            ? `${m.full_name ?? "You"} (You)`
            : m.full_name ?? "Unnamed User",
      })) ?? [];

      options.push({ id: "unassigned", label: "Unassigned" });
      setAssignees(options);
    } catch (error) {
      logError(error, "StaffTasks.loadAssignees");
      toast(formatErrorForToast(error, "Failed to load assignees"));
    }
  }, [profile, canManageTasks, toast]);

  const loadTasks = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase
        .from("tasks")
        .select(
          "id, title, description, status, priority, due_at, assignee_id, application_id, created_at, updated_at, tenant_id"
        )
        .order("due_at", { ascending: true, nullsFirst: false });

      if (canManageTasks) query = query.eq("tenant_id", profile.tenant_id);
      else query = query.eq("assignee_id", profile.id);

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Task[] = (data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? "",
        priority: normalizePriority(t.priority),
        status: dbStatusToUi(t.status),
        dueDate: t.due_at,
        assignedTo: t.assignee_id === profile.id ? "You" : "Unassigned",
        assigneeId: t.assignee_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at ?? null,
      }));
      setTasks(mapped);
    } catch (error) {
      logError(error, "StaffTasks.loadTasks");
      toast(formatErrorForToast(error, "Failed to load tasks"));
    } finally {
      setLoading(false);
    }
  }, [profile, canManageTasks, toast]);

  useEffect(() => {
    if (!profile) return;
    void loadAssignees();
    void loadTasks();
  }, [profile, loadAssignees, loadTasks]);

  const totals = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed");
    const rate = tasks.length
      ? Math.round((completed.length / tasks.length) * 100)
      : 0;
    return {
      total: tasks.length,
      completed: completed.length,
      completionRate: rate,
    };
  }, [tasks]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackButton to="/dashboard" label="Back" />

        {/* Suspense wrapper for lazy board render */}
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <StaffTasksBoard
            tasks={tasks}
            loading={loading}
            totals={totals}
            assignees={assignees}
            canManageTasks={canManageTasks}
            onReload={loadTasks}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
