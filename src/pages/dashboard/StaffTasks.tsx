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
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, logError } from '@/lib/errorUtils';

type TaskStatus = 'open' | 'in_progress' | 'done' | 'blocked';
type TaskPriority = 'high' | 'medium' | 'low' | 'urgent';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  due_at: string | null;
  created_at: string;
  profile_id: string | null;
  tenant_id: string;
}

const INITIAL_FORM = {
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  dueDate: '',
};

export default function StaffTasks() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const activeTenantId = profile?.tenant_id ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskCreated, setTaskCreated] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM }));

  const fetchTasks = useCallback(async () => {
    if (!activeTenantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks((data ?? []) as Task[]);
    } catch (error) {
      logError(error, 'StaffTasks.fetchTasks');
      toast({
        title: 'Unable to load tasks',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTenantId, toast]);

  useEffect(() => {
    if (!activeTenantId) return;
    void fetchTasks();
  }, [activeTenantId, taskCreated, fetchTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const search = searchQuery.trim().toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        task.title.toLowerCase().includes(search) ||
        (task.description ?? '').toLowerCase().includes(search) ||
        task.id.toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || (task.priority ?? 'medium') === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'open').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: tasks.filter((task) => task.status === 'done').length,
    }),
    [tasks]
  );

  const getPriorityBadge = (priority: TaskPriority | null | undefined) => {
    const colors: Record<TaskPriority, string> = {
      high: 'bg-destructive/10 text-destructive border-destructive/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-muted text-muted-foreground border-muted',
      urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    const key = (priority ?? 'medium') as TaskPriority;
    return colors[key];
  };

  const getStatusBadge = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      open: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      done: 'bg-success/10 text-success border-success/20',
      blocked: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status];
  };

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      open: 'To Do',
      in_progress: 'In Progress',
      done: 'Completed',
      blocked: 'Blocked',
    };
    return labels[status];
  };

  const isOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    const dueDate = new Date(dueAt);
    const today = new Date();
    return dueDate < today && dueDate.toDateString() !== today.toDateString();
  };

  const isDueToday = (dueAt: string | null) => {
    if (!dueAt) return false;
    const dueDate = new Date(dueAt);
    return dueDate.toDateString() === new Date().toDateString();
  };

  const assignedLabel = (task: Task) => {
    if (!user) return '—';
    if (task.profile_id === user.id) return 'You';
    return 'Team member';
  };

  const handleCreateTask = async () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'You must be signed in to create tasks.',
        variant: 'destructive',
      });
      return;
    }

    if (!activeTenantId) {
      toast({
        title: 'Missing tenant',
        description: 'Could not determine your tenant. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: 'Task title required',
        description: 'Please provide a title for the task before creating it.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        status: 'open',
        due_at: formData.dueDate ? new Date(`${formData.dueDate}T00:00:00Z`).toISOString() : null,
        tenant_id: activeTenantId,
        profile_id: user.id,
      };

      const { error } = await supabase.from('tasks').insert(payload);

      if (error) {
        throw error;
      }

      toast({ title: 'Task created', description: 'Your task has been added successfully.' });
      setFormData({ ...INITIAL_FORM });
      setIsCreateDialogOpen(false);
      setTaskCreated((prev) => prev + 1);
    } catch (error) {
      logError(error, 'StaffTasks.createTask');
      toast({
        title: 'Unable to create task',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Enter task description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, priority: value as TaskPriority }))
                      }
                    >
                      <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-due">Due Date</Label>
                    <Input
                      id="task-due"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                To Do
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.todo}</div>
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
                  {stats.inProgress}
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
                <div className="text-2xl font-bold text-success">{stats.completed}</div>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | TaskStatus)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as 'all' | TaskPriority)}
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
                  <SelectItem value="urgent">Urgent</SelectItem>
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
              {loading ? 'Loading tasks…' : `${filteredTasks.length} task(s) found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <CheckSquare
                          className={`h-5 w-5 ${
                            task.status === 'done' ? 'text-success' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">{task.title}</h3>
                              <Badge variant="outline" className={getPriorityBadge(task.priority)}>
                                {(task.priority ?? 'medium').toLowerCase()}
                              </Badge>
                              <Badge variant="outline" className={getStatusBadge(task.status)}>
                                {getStatusLabel(task.status)}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <div className="flex items-center justify-end gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              <span
                                className={
                                  task.due_at && task.status !== 'done'
                                    ? isOverdue(task.due_at)
                                      ? 'text-destructive font-medium'
                                      : isDueToday(task.due_at)
                                        ? 'text-warning font-medium'
                                        : ''
                                    : ''
                                }
                              >
                                {task.due_at
                                  ? new Date(task.due_at).toLocaleDateString()
                                  : 'No due date'}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {assignedLabel(task)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {task.status !== 'done' && task.status !== 'blocked' && (
                            <>
                              {task.status === 'open' && (
                                <Button size="sm" variant="secondary">
                                  Start Task
                                </Button>
                              )}
                              {task.status === 'in_progress' && (
                                <Button size="sm" variant="secondary">
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
              ))}
            </div>
            {filteredTasks.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                No tasks found matching your criteria
              </div>
            )}
            {loading && tasks.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
