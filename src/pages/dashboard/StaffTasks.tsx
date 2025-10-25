import { useState } from 'react';
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
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  FileText,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  assignedTo: string;
  relatedTo?: string;
  relatedType?: 'application' | 'student';
  createdDate: string;
}

export default function StaffTasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data - replace with actual data from your backend
  const tasks: Task[] = [
    {
      id: 'TASK-001',
      title: 'Verify transcripts for John Smith',
      description: 'Review and verify academic transcripts submitted by the student',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2024-01-25',
      assignedTo: 'You',
      relatedTo: 'John Smith (APP-001)',
      relatedType: 'application',
      createdDate: '2024-01-20',
    },
    {
      id: 'TASK-002',
      title: 'Review application - Sarah Johnson',
      description: 'Complete initial application screening and document verification',
      priority: 'medium',
      status: 'todo',
      dueDate: '2024-01-26',
      assignedTo: 'You',
      relatedTo: 'Sarah Johnson (APP-002)',
      relatedType: 'application',
      createdDate: '2024-01-20',
    },
    {
      id: 'TASK-003',
      title: 'Contact university partner about delays',
      description: 'Follow up with Oxford regarding delayed offer letters',
      priority: 'high',
      status: 'todo',
      dueDate: '2024-01-25',
      assignedTo: 'You',
      relatedTo: 'University of Oxford',
      createdDate: '2024-01-21',
    },
    {
      id: 'TASK-004',
      title: 'Process payment confirmation',
      description: 'Verify payment receipt and update application status',
      priority: 'low',
      status: 'todo',
      dueDate: '2024-01-30',
      assignedTo: 'You',
      relatedTo: 'Emily Davis (APP-004)',
      relatedType: 'application',
      createdDate: '2024-01-22',
    },
    {
      id: 'TASK-005',
      title: 'Update visa guidance document',
      description: 'Revise visa application checklist with new requirements',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2024-01-28',
      assignedTo: 'Jane Doe',
      createdDate: '2024-01-18',
    },
    {
      id: 'TASK-006',
      title: 'Send reminder to Michael Chen',
      description: 'Remind student about pending document submission',
      priority: 'medium',
      status: 'completed',
      dueDate: '2024-01-23',
      assignedTo: 'You',
      relatedTo: 'Michael Chen (STU-2024-003)',
      relatedType: 'student',
      createdDate: '2024-01-19',
    },
  ];

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
    };
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string) => {
    return new Date(dueDate).toDateString() === new Date().toDateString();
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
                  <Input id="task-title" placeholder="Enter task title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select defaultValue="medium">
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
                    <Input id="task-due" type="date" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-assigned">Assign To</Label>
                  <Select defaultValue="me">
                    <SelectTrigger id="task-assigned">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="me">Me</SelectItem>
                      <SelectItem value="jane">Jane Doe</SelectItem>
                      <SelectItem value="john">John Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Create Task</Button>
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
              <div className="text-2xl font-bold">{tasks.length}</div>
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
                {tasks.filter((t) => t.status === 'todo').length}
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
                {tasks.filter((t) => t.status === 'in_progress').length}
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
                {tasks.filter((t) => t.status === 'completed').length}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
              {filteredTasks.length} task(s) found
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
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
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
                                  isOverdue(task.dueDate) && task.status !== 'completed'
                                    ? 'text-destructive font-medium'
                                    : isDueToday(task.dueDate) && task.status !== 'completed'
                                    ? 'text-warning font-medium'
                                    : ''
                                }
                              >
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {task.assignedTo}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {task.status !== 'completed' && (
                            <>
                              {task.status === 'todo' && (
                                <Button size="sm">Start Task</Button>
                              )}
                              {task.status === 'in_progress' && (
                                <Button size="sm">Mark Complete</Button>
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
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No tasks found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
