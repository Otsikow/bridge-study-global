import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Search, Filter, Mail, Phone, Eye, UserCircle, Download, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  status: 'active' | 'inactive' | 'graduated' | 'withdrawn';
  enrollmentDate: string;
  totalApplications: number;
  activeApplications: number;
  assignedStaff: string;
}

export default function StaffStudents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');

  // Mock data - replace with actual data from your backend
  const students: Student[] = [
    {
      id: 'STU-2024-001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+44 7700 900123',
      nationality: 'United Kingdom',
      status: 'active',
      enrollmentDate: '2024-01-15',
      totalApplications: 3,
      activeApplications: 2,
      assignedStaff: 'You',
    },
    {
      id: 'STU-2024-002',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 555 0123',
      nationality: 'United States',
      status: 'active',
      enrollmentDate: '2024-01-16',
      totalApplications: 2,
      activeApplications: 1,
      assignedStaff: 'You',
    },
    {
      id: 'STU-2024-003',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+86 138 0000 0000',
      nationality: 'China',
      status: 'active',
      enrollmentDate: '2024-01-10',
      totalApplications: 4,
      activeApplications: 3,
      assignedStaff: 'Jane Doe',
    },
    {
      id: 'STU-2024-004',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+61 4 0000 0000',
      nationality: 'Australia',
      status: 'active',
      enrollmentDate: '2024-01-17',
      totalApplications: 1,
      activeApplications: 1,
      assignedStaff: 'You',
    },
    {
      id: 'STU-2023-125',
      name: 'David Wilson',
      email: 'david.w@email.com',
      phone: '+44 7700 900456',
      nationality: 'United Kingdom',
      status: 'graduated',
      enrollmentDate: '2023-09-01',
      totalApplications: 2,
      activeApplications: 0,
      assignedStaff: 'John Smith',
    },
    {
      id: 'STU-2024-005',
      name: 'Priya Patel',
      email: 'priya.patel@email.com',
      phone: '+91 98765 43210',
      nationality: 'India',
      status: 'active',
      enrollmentDate: '2024-01-12',
      totalApplications: 3,
      activeApplications: 2,
      assignedStaff: 'You',
    },
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesNationality =
      nationalityFilter === 'all' || student.nationality === nationalityFilter;
    return matchesSearch && matchesStatus && matchesNationality;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-success/10 text-success border-success/20',
      inactive: 'bg-muted text-muted-foreground border-muted',
      graduated: 'bg-primary/10 text-primary border-primary/20',
      withdrawn: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const uniqueNationalities = Array.from(new Set(students.map((s) => s.nationality))).sort();

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        {/* Header */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Students Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track student information
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {students.filter((s) => s.status === 'active').length}
              </div>
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
                {students.filter((s) => s.assignedStaff === 'You').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Graduated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {students.filter((s) => s.status === 'graduated').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or email..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nationalities</SelectItem>
                  {uniqueNationalities.map((nationality) => (
                    <SelectItem key={nationality} value={nationality}>
                      {nationality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students List</CardTitle>
                <CardDescription>
                  {filteredStudents.length} student(s) found
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
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{student.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium">{student.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]" title={student.email}>
                              {student.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.nationality}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{student.activeApplications} active</div>
                          <div className="text-xs text-muted-foreground">
                            {student.totalApplications} total
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.assignedStaff}</TableCell>
                      <TableCell>
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/profile`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No students found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
