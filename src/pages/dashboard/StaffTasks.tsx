import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Filter,
  CheckSquare,
  Plus,
  Calendar,
  User,
  FileText,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatErrorForToast, logError } from '@/lib/errorUtils';

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

      setAssignees(options);
    } catch (error) {
      logError(error, 'StaffTasks.loadAssignees');
      toast(formatErrorForToast(error, 'Failed to load team members'));
      if (profile) {
        const fallback = profile.full_name ? `${profile.full_name} (You)` : 'You';
        setAssignees([{ id: profile.id, label: fallback }]);
      }
    }
  }, [profile, canManageTasks, toast]);

  const loadTasks = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('id, title, description, status, priority, due_at, assignee_id, application_id, created_at, tenant_id')
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

        return {
          id: task.id,
          title: task.title,
          description: task.description ?? '',
          priority: normalizePriority(task.priority),
          status: dbStatusToUi(task.status),
          dueDate: task.due_at ?? null,
          assignedTo: assignedName,
          assigneeId: task.assignee_id,
          relatedTo: task.application_id ? relatedMap.get(task.application_id) : undefined,
          applicationId: task.application_id,
          createdAt: task.created_at,
        };
      });

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
      const payload = {
        tenant_id: profile.tenant_id,
        title: newTask.title.trim(),
        description: newTask.description.trim() ? newTask.description.trim() : null,
        priority: newTask.priority,
        status: 'open' as DbTaskStatus,
        due_at: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        assignee_id: newTask.assigneeId || null,
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

  const handleStatusChange = useCallback(
    async (task: Task, nextStatus: UiTaskStatus) => {
      if (!profile) return;
      if (!canUpdateTask(task)) return;
      if (task.status === nextStatus) return;

      setUpdatingTaskId(task.id);
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: uiStatusToDb(nextStatus) })
          .eq('id', task.id);

        if (error) throw error;

        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
        );
        toast({ title: 'Task updated', description: 'Task status has been updated.' });
      } catch (error) {
        logError(error, 'StaffTasks.handleStatusChange');
        toast(formatErrorForToast(error, 'Failed to update task'));
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [profile, canUpdateTask, toast],
  );

  const filteredTasks = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        search.length === 0 ||
        [task.title, task.description, task.id, task.assignedTo, task.relatedTo ?? '']
          .map((value) => value.toLowerCase())
          .some((value) => value.includes(search));

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const totals = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }),
    [tasks],
  );

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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totals.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                To Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                  {totals.todo}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                  {totals.inProgress}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-success">
                  {totals.completed}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks List</CardTitle>
              <CardDescription>
                {loading ? 'Loading tasks...' : `${filteredTasks.length} task(s) found`}
              </CardDescription>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading tasks...
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredTasks.map((task) => {
                      const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                      const dueToday = isDueToday(task.dueDate) && task.status !== 'completed';
                      const dueLabel = task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'No due date';
                      const allowStart = task.status === 'todo' && canUpdateTask(task);
                      const allowComplete = task.status === 'in_progress' && canUpdateTask(task);

                      return (
                        <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                <CheckSquare
                                  className={`h-5 w-5 ${
                                    task.status === 'completed'
                                      ? 'text-success'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-base">{task.title}</h3>
                                      <Badge
                                        variant="outline"
                                        className={getPriorityBadge(task.priority)}
                                      >
                                        {task.priority}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={getStatusBadge(task.status)}
                                      >
                                        {getStatusLabel(task.status)}
                                      </Badge>
                                    </div>
                                    {task.description && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {task.description}
                                      </p>
                                    )}
                                    {task.relatedTo && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <FileText className="h-3 w-3" />
                                        Related to: {task.relatedTo}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right space-y-2">
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
                                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      {task.assignedTo}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" disabled>
                                    View Details
                                  </Button>
                                  {task.status !== 'completed' && (
                                    <>
                                      {task.status === 'todo' && (
                                        <Button
                                          size="sm"
                                          onClick={() => void handleStatusChange(task, 'in_progress')}
                                          disabled={!allowStart || updatingTaskId === task.id}
                                        >
                                          {updatingTaskId === task.id && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          )}
                                          Start Task
                                        </Button>
                                      )}
                                      {task.status === 'in_progress' && (
                                        <Button
                                          size="sm"
                                          onClick={() => void handleStatusChange(task, 'completed')}
                                          disabled={!allowComplete || updatingTaskId === task.id}
                                        >
                                          {updatingTaskId === task.id && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          )}
                                          Mark Complete
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {!filteredTasks.length && (
                    <div className="text-center py-12 text-muted-foreground">
                      No tasks found matching your criteria
                    </div>
                  )}
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
