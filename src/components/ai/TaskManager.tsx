import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Calendar,
  User,
  Flag,
  Filter
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  assignee: string;
  category: string;
  createdAt: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review application documents',
    description: 'Check all submitted documents for completeness and accuracy',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-01-25',
    assignee: 'John Doe',
    category: 'Application Review',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Contact university partner',
    description: 'Follow up on pending application status',
    priority: 'medium',
    status: 'todo',
    dueDate: '2024-01-28',
    assignee: 'Jane Smith',
    category: 'Communication',
    createdAt: '2024-01-22'
  },
  {
    id: '3',
    title: 'Prepare student report',
    description: 'Generate monthly performance report for student',
    priority: 'low',
    status: 'completed',
    dueDate: '2024-01-20',
    assignee: 'Mike Johnson',
    category: 'Reporting',
    createdAt: '2024-01-15'
  }
];

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    assignee: '',
    category: ''
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const addTask = () => {
    if (!newTask.title || !newTask.description) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate,
      assignee: newTask.assignee,
      category: newTask.category,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignee: '',
      category: ''
    });
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: task.status === 'completed' ? 'todo' : 'completed' 
          }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Task Manager
          </h2>
          <p className="text-muted-foreground">Manage and track your tasks efficiently</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="create">Create Task</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => toggleTaskStatus(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {task.dueDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            {task.category}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Task
              </CardTitle>
              <CardDescription>
                Add a new task to your task list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
                    placeholder="Enter assignee name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newTask.category}
                    onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>
              </div>

              <Button onClick={addTask} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
