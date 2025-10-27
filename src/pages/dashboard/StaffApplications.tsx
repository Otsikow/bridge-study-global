import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import BackButton from '@/components/BackButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, FileText, Download, Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  studentName: string;
  studentId: string;
  program: string;
  university: string;
  status: string;
  submittedDate: string;
  lastUpdated: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
}

export default function StaffApplications() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Mock data - replace with actual data from your backend
  const applications: Application[] = [
    {
      id: 'APP-001',
      studentName: 'John Smith',
      studentId: 'STU-2024-001',
      program: 'MSc Computer Science',
      university: 'University of Oxford',
      status: 'screening',
      submittedDate: '2024-01-15',
      lastUpdated: '2024-01-18',
      assignedTo: 'You',
      priority: 'high',
    },
    {
      id: 'APP-002',
      studentName: 'Sarah Johnson',
      studentId: 'STU-2024-002',
      program: 'MBA',
      university: 'Cambridge University',
      status: 'submitted',
      submittedDate: '2024-01-16',
      lastUpdated: '2024-01-17',
      assignedTo: 'You',
      priority: 'medium',
    },
    {
      id: 'APP-003',
      studentName: 'Michael Chen',
      studentId: 'STU-2024-003',
      program: 'MA International Business',
      university: 'Imperial College London',
      status: 'conditional_offer',
      submittedDate: '2024-01-10',
      lastUpdated: '2024-01-19',
      assignedTo: 'Jane Doe',
      priority: 'low',
    },
    {
      id: 'APP-004',
      studentName: 'Emily Davis',
      studentId: 'STU-2024-004',
      program: 'MSc Data Science',
      university: 'University College London',
      status: 'screening',
      submittedDate: '2024-01-17',
      lastUpdated: '2024-01-17',
      assignedTo: 'You',
      priority: 'high',
    },
    {
      id: 'APP-005',
      studentName: 'David Wilson',
      studentId: 'STU-2024-005',
      program: 'LLM International Law',
      university: 'London School of Economics',
      status: 'visa',
      submittedDate: '2024-01-05',
      lastUpdated: '2024-01-20',
      assignedTo: 'John Smith',
      priority: 'medium',
    },
  ];

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.program.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || app.priority === priorityFilter;
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

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        {/* Header */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Applications Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Review and manage student applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assigned to Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter((app) => app.assignedTo === 'You').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {applications.filter((app) => app.priority === 'high').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter((app) => app.status === 'submitted' || app.status === 'screening').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, ID, or program..."
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="conditional_offer">Conditional Offer</SelectItem>
                  <SelectItem value="unconditional_offer">Unconditional Offer</SelectItem>
                  <SelectItem value="visa">Visa Stage</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
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

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications List</CardTitle>
                <CardDescription>
                  {filteredApplications.length} application(s) found
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{app.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{app.studentName}</div>
                          <div className="text-xs text-muted-foreground">{app.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={app.program}>
                          {app.program}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="truncate" title={app.university}>
                          {app.university}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityBadge(app.priority)}>
                          {app.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.assignedTo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(app.lastUpdated).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/applications/${app.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredApplications.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No applications found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
