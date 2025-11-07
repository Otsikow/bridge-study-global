import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, endOfDay, endOfWeek, isWithinInterval, startOfDay, startOfWeek } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import BackButton from '@/components/BackButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Calendar,
  User,
  FileText,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatErrorForToast, logError } from '@/lib/errorUtils';
import { Progress } from '@/components/ui/progress';

type TaskPriority = 'high' | 'medium' | 'low';
type UiTaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
type DbTaskStatus = 'open' | 'in_progress' | 'done' | 'blocked';

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

type StatusFilter = 'all' | UiTaskStatus;
type PriorityFilter = 'all' | TaskPriority;
type DeadlineFilter = 'all' | 'overdue' | 'due_today' | 'due_this_week' | 'no_due';

const dbStatusToUi = (status: string | null): UiTaskStatus => {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'done':
      return 'completed';
    case 'blocked':
      return 'blocked';
    default:
      return 'todo';
  }
};

const uiStatusToDb = (status: UiTaskStatus): DbTaskStatus => {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'done';
    case 'blocked':
      return 'blocked';
    default:
      return 'open';
  }
};

const normalizePriority = (priority: string | null): TaskPriority => {
  if (priority === 'high' || priority === 'low') return priority;
  return 'medium';
};

const getInitialNewTask = (assigneeId: string | null): NewTaskForm => ({
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  assigneeId: assigneeId ?? '',
});

export default function StaffTasks() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>(() => getInitialNewTask(null));
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<Record<UiTaskStatus, string[]>>({
    todo: [],
    in_progress: [],
    completed: [],
    blocked: [],
  });

  const canManageTasks = profile?.role === 'staff' || profile?.role === 'admin';

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
        const selfLabel = profile.full_name ? `${profile.full_name} (You)` : 'You';
        setAssignees([{ id: profile.id, label: selfLabel }]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('tenant_id', profile.tenant_id)
        .in('role', ['staff', 'admin', 'agent'])
        .order('full_name', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const options: AssigneeOption[] = [];
      options.push({ id: profile.id, label: profile.full_name ? `${profile.full_name} (You)` : 'You' });

      (data ?? []).forEach((member) => {
        if (!member) return;
        if (member.id === profile.id) return;
        options.push({ id: member.id, label: member.full_name ?? 'Unnamed User' });
      });

      options.push({ id: 'unassigned', label: 'Unassigned' });

      setAssignees(options);
    } catch (error) {
      logError(error, 'StaffTasks.loadAssignees');
      toast(formatErrorForToast(error, 'Failed to load team members'));
      if (profile) {
        const fallback = profile.full_name ? `${profile.full_name} (You)` : 'You';
        setAssignees([
          { id: profile.id, label: fallback },
          { id: 'unassigned', label: 'Unassigned' },
        ]);
      }
    }
  }, [profile, canManageTasks, toast]);

  const loadTasks = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(
          'id, title, description, status, priority, due_at, assignee_id, application_id, created_at, updated_at, tenant_id',
        )
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (canManageTasks) {
        query = query.eq('tenant_id', profile.tenant_id);
      } else {
        query = query.eq('assignee_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rawTasks = data ?? [];
      const assigneeIds = Array.from(
        new Set(rawTasks.map((task) => task.assignee_id).filter((id): id is string => Boolean(id)))
      );
      const applicationIds = Array.from(
        new Set(rawTasks.map((task) => task.application_id).filter((id): id is string => Boolean(id)))
      );

      const assigneeMap = new Map<string, string>();
      if (assigneeIds.length) {
        const { data: assigneeData, error: assigneeError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', assigneeIds);

        if (assigneeError) throw assigneeError;

        (assigneeData ?? []).forEach((assignee) => {
          if (!assignee) return;
          assigneeMap.set(assignee.id, assignee.full_name ?? 'Unassigned');
        });
      }

      const relatedMap = new Map<string, string>();
      if (applicationIds.length) {
        const { data: applicationData, error: applicationError } = await supabase
          .from('applications')
          .select('id, app_number')
          .in('id', applicationIds);

        if (applicationError) throw applicationError;

        (applicationData ?? []).forEach((app) => {
          if (!app) return;
          const label = app.app_number ? `Application ${app.app_number}` : 'Application';
          relatedMap.set(app.id, label);
        });
      }

      const mappedTasks: Task[] = rawTasks.map((task) => {
        const assignedName =
          task.assignee_id === profile.id
            ? 'You'
            : task.assignee_id
            ? assigneeMap.get(task.assignee_id) ?? 'Unassigned'
            : 'Unassigned';

        const uiStatus = dbStatusToUi(task.status);
        const isBlocked = uiStatus === 'blocked';
        const normalizedStatus: UiTaskStatus = isBlocked ? 'todo' : uiStatus;

        return {
          id: task.id,
          title: task.title,
          description: task.description ?? '',
          priority: normalizePriority(task.priority),
          status: normalizedStatus,
          dueDate: task.due_at ?? null,
          assignedTo: assignedName,
          assigneeId: task.assignee_id,
          relatedTo: task.application_id ? relatedMap.get(task.application_id) : undefined,
          applicationId: task.application_id,
          createdAt: task.created_at,
          updatedAt: task.updated_at ?? null,
          isBlocked,
        };
      });

      const nextOrder: Record<UiTaskStatus, string[]> = {
        todo: [],
        in_progress: [],
        completed: [],
        blocked: [],
      };

      mappedTasks.forEach((task) => {
        if (task.isBlocked) {
          nextOrder.blocked.push(task.id);
        } else {
          nextOrder[task.status]?.push(task.id);
        }
      });

      setColumnOrder(nextOrder);
      setTasks(mappedTasks);
    } catch (error) {
      logError(error, 'StaffTasks.loadTasks');
      toast(formatErrorForToast(error, 'Failed to load tasks'));
    } finally {
      setLoading(false);
    }
  }, [profile, canManageTasks, toast]);

  useEffect(() => {
    if (!profile) return;
    void loadTasks();
  }, [profile, loadTasks]);

  useEffect(() => {
    if (!profile) return;
    void loadAssignees();
  }, [profile, loadAssignees]);

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setNewTask(getInitialNewTask(profile?.id ?? null));
    }
  }, [isCreateDialogOpen, profile?.id]);

  const handleCreateTask = useCallback(async () => {
    if (!profile) return;

    if (!newTask.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title required',
        description: 'Enter a task title before saving.',
      });
      return;
    }

    if (canManageTasks && !newTask.assigneeId) {
      toast({
        variant: 'destructive',
        title: 'Assignee required',
        description: 'Select someone to assign this task.',
      });
      return;
    }

    setCreatingTask(true);
    try {
      const assigneeValue = newTask.assigneeId === 'unassigned' ? null : newTask.assigneeId || null;

      const payload = {
        tenant_id: profile.tenant_id,
        title: newTask.title.trim(),
        description: newTask.description.trim() ? newTask.description.trim() : null,
        priority: newTask.priority,
        status: 'open' as DbTaskStatus,
        due_at: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        assignee_id: assigneeValue,
        created_by: profile.id,
      };

      const { error } = await supabase.from('tasks').insert(payload);
      if (error) throw error;

      toast({ title: 'Task created', description: 'The task has been added to the list.' });
      setIsCreateDialogOpen(false);
      setNewTask(getInitialNewTask(profile.id));
      await loadTasks();
    } catch (error) {
      logError(error, 'StaffTasks.handleCreateTask');
      toast(formatErrorForToast(error, 'Failed to create task'));
    } finally {
      setCreatingTask(false);
    }
  }, [profile, newTask, canManageTasks, toast, loadTasks]);

  const canUpdateTask = useCallback(
    (task: Task) => {
      if (!profile) return false;
      return canManageTasks || task.assigneeId === profile.id;
    },
    [profile, canManageTasks],
  );

  const persistTaskStatus = useCallback(
    async (taskId: string, nextStatus: UiTaskStatus) => {
      setUpdatingTaskId(taskId);
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: uiStatusToDb(nextStatus) })
          .eq('id', taskId);

        if (error) throw error;

        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId
              ? { ...item, status: nextStatus, isBlocked: false, updatedAt: new Date().toISOString() }
              : item,
          ),
        );
        toast({ title: 'Task updated', description: 'Task status has been updated.' });
      } catch (error) {
        logError(error, 'StaffTasks.persistTaskStatus');
        toast(formatErrorForToast(error, 'Failed to update task'));
        await loadTasks();
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [toast, loadTasks],
  );

  const reorderTask = useCallback((taskId: string, targetStatus: UiTaskStatus, beforeTaskId: string | null) => {
    setColumnOrder((prev) => {
      const next: Record<UiTaskStatus, string[]> = {
        todo: [...prev.todo],
        in_progress: [...prev.in_progress],
        completed: [...prev.completed],
        blocked: [...prev.blocked],
      };

      (Object.keys(next) as UiTaskStatus[]).forEach((status) => {
        next[status] = next[status].filter((id) => id !== taskId);
      });

      const list = [...next[targetStatus]];
      if (beforeTaskId) {
        const insertIndex = list.indexOf(beforeTaskId);
        if (insertIndex === -1) {
          list.push(taskId);
        } else {
          list.splice(insertIndex, 0, taskId);
        }
      } else {
        list.push(taskId);
      }

      next[targetStatus] = list;
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (task: Task, nextStatus: UiTaskStatus) => {
      if (!profile) return;
      if (!canUpdateTask(task)) return;
      if (task.status === nextStatus) return;

      reorderTask(task.id, nextStatus, null);
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, status: nextStatus, isBlocked: false } : item,
        ),
      );
      await persistTaskStatus(task.id, nextStatus);
    },
    [profile, canUpdateTask, reorderTask, persistTaskStatus],
  );

  const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
  }, []);

  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const handleDropOnColumn = useCallback(
    (event: React.DragEvent<HTMLDivElement>, status: UiTaskStatus) => {
      event.preventDefault();
      const taskId = event.dataTransfer?.getData('text/plain');
      if (!taskId) return;

      setDraggingTaskId(null);
      const task = taskMap.get(taskId);
      if (!task) return;

      reorderTask(taskId, status, null);
      if (task.status !== status || task.isBlocked) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, status, isBlocked: false } : item,
          ),
        );
        void persistTaskStatus(taskId, status);
      }
    },
    [taskMap, reorderTask, persistTaskStatus],
  );

  const handleDropOnTask = useCallback(
    (event: React.DragEvent<HTMLDivElement>, status: UiTaskStatus, beforeTaskId: string) => {
      event.preventDefault();
      const taskId = event.dataTransfer?.getData('text/plain');
      if (!taskId || taskId === beforeTaskId) return;

      setDraggingTaskId(null);
      const task = taskMap.get(taskId);
      if (!task) return;

      reorderTask(taskId, status, beforeTaskId);
      if (task.status !== status || task.isBlocked) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, status, isBlocked: false } : item,
          ),
        );
        void persistTaskStatus(taskId, status);
      }
    },
    [taskMap, reorderTask, persistTaskStatus],
  );

  const filteredTasks = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const now = new Date();
    const startWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endWeek = endOfWeek(now, { weekStartsOn: 1 });
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    return tasks.filter((task) => {
      const matchesSearch =
        search.length === 0 ||
        [task.title, task.description, task.id, task.assignedTo, task.relatedTo ?? '']
          .map((value) => value.toLowerCase())
          .some((value) => value.includes(search));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'blocked'
          ? Boolean(task.isBlocked)
          : task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === 'all'
          ? true
          : assigneeFilter === 'unassigned'
          ? task.assigneeId === null
          : task.assigneeId === assigneeFilter;

      const matchesDeadline = (() => {
        if (deadlineFilter === 'all') return true;
        if (!task.dueDate) {
          return deadlineFilter === 'no_due';
        }

        const due = new Date(task.dueDate);
        if (Number.isNaN(due.getTime())) {
          return deadlineFilter === 'no_due';
        }

        switch (deadlineFilter) {
          case 'overdue':
            return due < todayStart;
          case 'due_today':
            return isWithinInterval(due, { start: todayStart, end: todayEnd });
          case 'due_this_week':
            return isWithinInterval(due, { start: startWeek, end: endWeek });
          case 'no_due':
            return false;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesPriority && matchesDeadline && matchesAssignee;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, deadlineFilter, assigneeFilter]);

  const totals = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed');
    const now = new Date();
    const startWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endWeek = endOfWeek(now, { weekStartsOn: 1 });

    const completedThisWeek = completed.filter((task) => {
      if (!task.updatedAt) return false;
      const updated = new Date(task.updatedAt);
      if (Number.isNaN(updated.getTime())) return false;
      return isWithinInterval(updated, { start: startWeek, end: endWeek });
    }).length;

    const completionRate = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: completed.length,
      completedThisWeek,
      completionRate,
    };
  }, [tasks]);

  const filteredTaskSet = useMemo(() => new Set(filteredTasks.map((task) => task.id)), [filteredTasks]);

  const boardColumns = useMemo(() => {
    const selectTasks = (ids: string[]) =>
      ids
        .map((id) => taskMap.get(id))
        .filter((task): task is Task => Boolean(task && filteredTaskSet.has(task.id)));

    return {
      todo: [...selectTasks(columnOrder.todo), ...selectTasks(columnOrder.blocked)],
      in_progress: selectTasks(columnOrder.in_progress),
      completed: selectTasks(columnOrder.completed),
    };
  }, [columnOrder, taskMap, filteredTaskSet]);

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-destructive/10 text-destructive border-destructive/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-muted text-muted-foreground border-muted',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      todo: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      completed: 'bg-success/10 text-success border-success/20',
      blocked: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      completed: 'Completed',
      blocked: 'Blocked',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return false;
    const today = new Date();
    return due < today && due.toDateString() !== today.toDateString();
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return false;
    return due.toDateString() === new Date().toDateString();
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        {/* Header */}
          <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Tasks Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track and manage your work tasks
            </p>
          </div>
            {canManageTasks && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to your task list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-title">Title</Label>
                      <Input
                        id="task-title"
                        placeholder="Enter task title"
                        value={newTask.title}
                        onChange={(event) =>
                          setNewTask((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        placeholder="Enter task description"
                        rows={3}
                        value={newTask.description}
                        onChange={(event) =>
                          setNewTask((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="task-priority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value) =>
                            setNewTask((prev) => ({ ...prev, priority: value as TaskPriority }))
                          }
                        >
                          <SelectTrigger id="task-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="task-due">Due Date</Label>
                        <Input
                          id="task-due"
                          type="date"
                          value={newTask.dueDate}
                          onChange={(event) =>
                            setNewTask((prev) => ({ ...prev, dueDate: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-assigned">Assign To</Label>
                      <Select
                        value={newTask.assigneeId}
                        onValueChange={(value) =>
                          setNewTask((prev) => ({ ...prev, assigneeId: value }))
                        }
                      >
                        <SelectTrigger id="task-assigned">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignees.map((assignee) => (
                            <SelectItem key={assignee.id} value={assignee.id}>
                              {assignee.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={creatingTask}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => void handleCreateTask()} disabled={creatingTask}>
                      {creatingTask && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{totals.total}</div>
              <p className="mt-1 text-sm text-muted-foreground">Across all boards</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">To-Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{totals.todo}</div>
              <p className="mt-1 text-sm text-muted-foreground">Awaiting kickoff</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-blue-600">{totals.inProgress}</div>
              <p className="mt-1 text-sm text-muted-foreground">Actively moving forward</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 xl:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                <CardDescription>Completed this week vs total</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-semibold text-success">{totals.completed}</div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{totals.completedThisWeek} completed this week</span>
                <span>{totals.completionRate}% overall</span>
              </div>
              <Progress value={totals.completionRate} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Tasks</CardTitle>
            <CardDescription>Refine the board by assignee, deadline, and priority.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To-Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={deadlineFilter} onValueChange={(value) => setDeadlineFilter(value as DeadlineFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Deadline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any deadline</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due_today">Due today</SelectItem>
                  <SelectItem value="due_this_week">Due this week</SelectItem>
                  <SelectItem value="no_due">No deadline</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={(value) => setAssigneeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignees
                    .filter((option) => option.id !== 'unassigned')
                    .map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Board */}
        <Card>
          <CardHeader>
            <CardTitle>Kanban Board</CardTitle>
            <CardDescription>
              {loading
                ? 'Loading tasks from Supabase...'
                : `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} in view`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Fetching latest tasks...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {(['todo', 'in_progress', 'completed'] as UiTaskStatus[]).map((status) => {
                  const columnTitle =
                    status === 'todo' ? 'To-Do' : status === 'in_progress' ? 'In Progress' : 'Completed';
                  const columnTasks = boardColumns[status];
                  const columnDescription =
                    status === 'todo'
                      ? 'Tasks waiting to be started'
                      : status === 'in_progress'
                      ? 'Work that is currently active'
                      : 'Recently finished work';

                  return (
                    <div key={status} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{columnTitle}</h3>
                          <p className="text-xs text-muted-foreground">{columnDescription}</p>
                        </div>
                        <Badge variant="outline" className={getStatusBadge(status)}>
                          {columnTasks.length}
                        </Badge>
                      </div>
                      <div
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDropOnColumn(event, status)}
                        className="min-h-[260px] rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 shadow-sm"
                      >
                        <div className="space-y-3">
                          {columnTasks.map((task) => {
                            const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                            const dueToday = isDueToday(task.dueDate) && task.status !== 'completed';
                            const dueDateValue = task.dueDate ? new Date(task.dueDate) : null;
                            const dueLabel =
                              dueDateValue && !Number.isNaN(dueDateValue.getTime())
                                ? format(dueDateValue, 'MMM d, yyyy')
                                : 'No deadline';
                            const allowStart = task.status === 'todo' && canUpdateTask(task);
                            const allowComplete = task.status === 'in_progress' && canUpdateTask(task);

                            return (
                              <div
                                key={task.id}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => handleDropOnTask(event, status, task.id)}
                              >
                                <Card
                                  draggable={canUpdateTask(task)}
                                  onDragStart={(event) => handleDragStart(event, task.id)}
                                  onDragEnd={handleDragEnd}
                                  className={`transition-all ${
                                    draggingTaskId === task.id ? 'ring-2 ring-primary shadow-lg' : ''
                                  } ${!canUpdateTask(task) ? 'opacity-60 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                                >
                                  <CardContent className="space-y-3 pt-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="font-semibold leading-tight">{task.title}</h4>
                                          <Badge variant="outline" className={getPriorityBadge(task.priority)}>
                                            {task.priority}
                                          </Badge>
                                          {task.isBlocked && (
                                            <Badge variant="outline" className="border-destructive/40 text-destructive">
                                              Blocked
                                            </Badge>
                                          )}
                                        </div>
                                        {task.description && (
                                          <p className="text-sm text-muted-foreground line-clamp-3">
                                            {task.description}
                                          </p>
                                        )}
                                        {task.relatedTo && (
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <FileText className="h-3 w-3" />
                                            {task.relatedTo}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right text-xs text-muted-foreground space-y-2">
                                        <div className="flex items-center justify-end gap-1 text-sm">
                                          <Calendar className="h-3 w-3" />
                                          <span
                                            className={
                                              overdue
                                                ? 'text-destructive font-medium'
                                                : dueToday
                                                ? 'text-warning font-medium'
                                                : ''
                                            }
                                          >
                                            {dueLabel}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                          <User className="h-3 w-3" />
                                          <span>{task.assignedTo}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {task.status !== 'completed' ? (
                                        <>
                                          {task.status === 'todo' && (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              onClick={() => void handleStatusChange(task, 'in_progress')}
                                              disabled={!allowStart || updatingTaskId === task.id}
                                            >
                                              {updatingTaskId === task.id && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              )}
                                              Start Task
                                            </Button>
                                          )}
                                          {task.status === 'in_progress' && (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              onClick={() => void handleStatusChange(task, 'completed')}
                                              disabled={!allowComplete || updatingTaskId === task.id}
                                            >
                                              {updatingTaskId === task.id && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              )}
                                              Mark Complete
                                            </Button>
                                          )}
                                        </>
                                      ) : (
                                        <Badge variant="outline" className={getStatusBadge('completed')}>
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                          {!columnTasks.length && (
                            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                              No tasks here yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
