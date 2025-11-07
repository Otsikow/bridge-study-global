import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlarmClock,
  BellDot,
  Bot,
  Building2,
  ChevronRight,
  CheckCircle2,
  CheckSquare,
  FileText,
  Filter,
  LifeBuoy,
  LineChart,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Settings,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import BackButton from '@/components/BackButton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const personalOverviewKpis = [
  {
    title: 'Students Assigned',
    value: '32',
    description: 'vs. last week',
    icon: Users,
    trend: { value: 12, isPositive: true },
    to: '/dashboard/students',
  },
  {
    title: 'Applications Processed',
    value: '18',
    description: 'Completed in the last 7 days',
    icon: FileText,
    trend: { value: 8, isPositive: true },
    to: '/dashboard/applications',
  },
  {
    title: 'Tasks Pending',
    value: '7',
    description: '2 flagged as urgent',
    icon: CheckSquare,
    trend: { value: 5, isPositive: false },
    to: '/dashboard/tasks',
  },
  {
    title: 'Approvals Today',
    value: '5',
    description: 'Across student finances',
    icon: AlarmClock,
    trend: { value: 3, isPositive: true },
    to: '/dashboard/payments',
  },
];

const applicationProgressData = [
  { status: 'Submitted', value: 12 },
  { status: 'Screening', value: 9 },
  { status: 'Documents', value: 7 },
  { status: 'Offer', value: 6 },
  { status: 'Visa', value: 4 },
  { status: 'Enrolled', value: 3 },
];

const dailyActivityTrendData = [
  { day: 'Mon', tasks: 9, approvals: 2 },
  { day: 'Tue', tasks: 12, approvals: 3 },
  { day: 'Wed', tasks: 10, approvals: 3 },
  { day: 'Thu', tasks: 14, approvals: 4 },
  { day: 'Fri', tasks: 11, approvals: 3 },
  { day: 'Sat', tasks: 6, approvals: 1 },
  { day: 'Sun', tasks: 5, approvals: 1 },
];

const quickLinks = [
  { label: 'My Students', description: 'Review assigned cases and next actions', to: '/dashboard/students', icon: Users },
  { label: 'My Tasks', description: 'Update task progress and workflows', to: '/dashboard/tasks', icon: CheckSquare },
  { label: 'My Agents', description: 'Coordinate with partner agents', to: '/dashboard/agents', icon: Building2 },
];

const zoeSuggestions = [
  { id: 'tip-1', message: '3 students need document verification before Friday.' },
  { id: 'tip-2', message: 'Follow up with Bridge Lagos about two new applicants waiting for screening.' },
  { id: 'tip-3', message: 'Schedule a payment approval review for commissions logged today.' },
];

const studentRecords = [
  {
    id: 'STU-2024-001',
    name: 'John Smith',
    country: 'Nigeria',
    status: 'screening',
    intake: 'Fall 2025',
    agent: 'Bridge Lagos',
    updatedAt: '2h ago',
  },
  {
    id: 'STU-2024-002',
    name: 'Sarah Johnson',
    country: 'Kenya',
    status: 'offer',
    intake: 'Fall 2025',
    agent: 'Bridge Nairobi',
    updatedAt: '1d ago',
  },
  {
    id: 'STU-2024-003',
    name: 'Michael Chen',
    country: 'China',
    status: 'visa',
    intake: 'Spring 2025',
    agent: 'Global Pathways',
    updatedAt: '3h ago',
  },
  {
    id: 'STU-2024-004',
    name: 'Emily Davis',
    country: 'Ghana',
    status: 'submitted',
    intake: 'Fall 2024',
    agent: 'Bridge Accra',
    updatedAt: '30m ago',
  },
  {
    id: 'STU-2024-005',
    name: 'David Wilson',
    country: 'India',
    status: 'enrolled',
    intake: 'Fall 2024',
    agent: 'You',
    updatedAt: '1w ago',
  },
  {
    id: 'STU-2024-006',
    name: 'Amina Hassan',
    country: 'Nigeria',
    status: 'documents_pending',
    intake: 'Fall 2025',
    agent: 'Bridge Lagos',
    updatedAt: '10m ago',
  },
  {
    id: 'STU-2024-007',
    name: 'Luis Martinez',
    country: 'Mexico',
    status: 'offer',
    intake: 'Spring 2025',
    agent: 'LatAm Partners',
    updatedAt: '5h ago',
  },
  {
    id: 'STU-2024-008',
    name: 'Fatima Al Zahra',
    country: 'UAE',
    status: 'visa',
    intake: 'Fall 2025',
    agent: 'Bridge Dubai',
    updatedAt: '4h ago',
  },
];

const partnerLeads = [
  {
    id: 'AG-001',
    name: 'Bridge Lagos',
    region: 'West Africa',
    owner: 'You',
    newLeads: 4,
    lastContact: 'Today, 09:20',
    focus: 'Undergraduate STEM',
  },
  {
    id: 'AG-002',
    name: 'Global Pathways',
    region: 'Asia',
    owner: 'Jane Doe',
    newLeads: 7,
    lastContact: 'Yesterday',
    focus: 'Postgraduate Business',
  },
  {
    id: 'AG-003',
    name: 'LatAm Partners',
    region: 'Latin America',
    owner: 'You',
    newLeads: 2,
    lastContact: '3 days ago',
    focus: 'Scholarship Seekers',
  },
];

const workflowTasks = [
  { id: 'WF-001', title: 'Verify transcripts - John Smith', due: 'Today', owner: 'You', status: 'in_progress' },
  { id: 'WF-002', title: 'Schedule visa interview - Michael Chen', due: 'Tomorrow', owner: 'You', status: 'pending' },
  { id: 'WF-003', title: 'Send conditional offer package - Sarah Johnson', due: 'In 2 days', owner: 'Jane Doe', status: 'blocked' },
];

const channelMessages = [
  {
    id: 'MSG-001',
    sender: 'Zoe',
    preview: 'John Smith is missing bank statement verification. Recommend sending reminder.',
    timestamp: '2m ago',
    type: 'ai',
  },
  {
    id: 'MSG-002',
    sender: 'Bridge Lagos',
    preview: 'Shared updated IELTS score for Amina Hassan.',
    timestamp: '20m ago',
    type: 'agent',
  },
  {
    id: 'MSG-003',
    sender: 'Finance Bot',
    preview: 'Commission payout for LatAm Partners scheduled for Jan 28.',
    timestamp: '1h ago',
    type: 'system',
  },
  {
    id: 'MSG-004',
    sender: 'Support',
    preview: 'Reminder: Visa document training tomorrow at 10:00 AM.',
    timestamp: '3h ago',
    type: 'internal',
  },
];

const paymentRows = [
  {
    id: 'PAY-001',
    student: 'Emily Davis',
    agent: 'Bridge Accra',
    amount: '$1,200',
    status: 'pending',
    dueDate: 'Jan 24',
  },
  {
    id: 'PAY-002',
    student: 'Luis Martinez',
    agent: 'LatAm Partners',
    amount: '$2,450',
    status: 'approved',
    dueDate: 'Jan 18',
  },
  {
    id: 'PAY-003',
    student: 'John Smith',
    agent: 'Bridge Lagos',
    amount: '$980',
    status: 'review',
    dueDate: 'Jan 23',
  },
  {
    id: 'PAY-004',
    student: 'Amina Hassan',
    agent: 'Bridge Lagos',
    amount: '$1,150',
    status: 'pending',
    dueDate: 'Jan 26',
  },
  {
    id: 'PAY-005',
    student: 'Sarah Johnson',
    agent: 'Bridge Nairobi',
    amount: '$1,800',
    status: 'paid',
    dueDate: 'Jan 10',
  },
  {
    id: 'PAY-006',
    student: 'Michael Chen',
    agent: 'Global Pathways',
    amount: '$2,200',
    status: 'pending',
    dueDate: 'Jan 29',
  },
];

const resourceLinks = [
  {
    name: 'Admissions SOP',
    description: 'Step-by-step guide for screening and offer issuance.',
    category: 'Admissions',
  },
  {
    name: 'Visa Document Checklist',
    description: 'Country-specific requirements for visa submissions.',
    category: 'Student Support',
  },
  {
    name: 'Commission Policy 2025',
    description: 'Updated payout rules and approval workflow.',
    category: 'Finance',
  },
  {
    name: 'Zoe Prompt Library',
    description: 'Suggested prompts for faster AI-assisted actions.',
    category: 'Productivity',
  },
];

export default function StaffDashboard() {
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [intakeFilter, setIntakeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('assigned');
  const [studentPage, setStudentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [zoeQuestion, setZoeQuestion] = useState('');
  const [zoeResponse, setZoeResponse] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const studentsQuery = useQuery({
    queryKey: ['staff-dashboard', 'students'],
    queryFn: async () => {
      return studentRecords;
    },
    initialData: studentRecords,
    staleTime: 1000 * 60 * 5,
  });

  const paymentsQuery = useQuery({
    queryKey: ['staff-dashboard', 'payments'],
    queryFn: async () => {
      return paymentRows;
    },
    initialData: paymentRows,
    staleTime: 1000 * 60 * 5,
  });

  const filteredStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    return (studentsQuery.data ?? []).filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.id.toLowerCase().includes(normalizedSearch) ||
        student.agent.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesCountry = countryFilter === 'all' || student.country === countryFilter;
      const matchesIntake = intakeFilter === 'all' || student.intake === intakeFilter;
      const matchesAgent = agentFilter === 'assigned' ? student.agent === 'You' : agentFilter === 'all' || student.agent === agentFilter;

      return matchesSearch && matchesStatus && matchesCountry && matchesIntake && matchesAgent;
    });
  }, [agentFilter, countryFilter, intakeFilter, statusFilter, studentSearch, studentsQuery.data]);

  const studentPageSize = 4;
  const studentTotalPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const studentOffset = (studentPage - 1) * studentPageSize;
  const paginatedStudents = filteredStudents.slice(studentOffset, studentOffset + studentPageSize);

  const paymentPageSize = 4;
  const paymentTotalPages = Math.max(1, Math.ceil((paymentsQuery.data ?? []).length / paymentPageSize));
  const paymentOffset = (paymentPage - 1) * paymentPageSize;
  const paginatedPayments = (paymentsQuery.data ?? []).slice(paymentOffset, paymentOffset + paymentPageSize);

  const handleStudentPageChange = (nextPage: number) => {
    setStudentPage(Math.min(Math.max(1, nextPage), studentTotalPages));
  };

  const handlePaymentPageChange = (nextPage: number) => {
    setPaymentPage(Math.min(Math.max(1, nextPage), paymentTotalPages));
  };

  const handleResetFilters = () => {
    setStudentSearch('');
    setStatusFilter('all');
    setCountryFilter('all');
    setIntakeFilter('all');
    setAgentFilter('assigned');
    setStudentPage(1);
  };

  const handleAskZoe = () => {
    if (!zoeQuestion.trim()) return;

    setZoeResponse(
      'Here is what I recommend next: 1) Confirm pending document verification for John Smith before Friday. 2) Send visa preparation checklist to Michael Chen. 3) Follow up with LatAm Partners about commission invoice support.',
    );
    setZoeQuestion('');
  };

  const renderPagination = (
    page: number,
    totalPages: number,
    onPageChange: (value: number) => void,
    queryKey: string,
  ) => (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onPageChange(page - 1);
            }}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }).map((_, index) => {
          const nextPage = index + 1;
          const isActive = page === nextPage;

          return (
            <PaginationItem key={`${queryKey}-${nextPage}`}>
              <PaginationLink
                href="#"
                isActive={isActive}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(nextPage);
                }}
              >
                {nextPage}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Staff Command Center</h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Track your assigned students, agents, finances, and workflows in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <BellDot className="h-3.5 w-3.5" />
                Supabase Realtime
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Zoe Enabled
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto rounded-lg border bg-background p-1">
            <TabsTrigger value="overview" className="px-4">🏠 Overview</TabsTrigger>
            <TabsTrigger value="students" className="px-4">🎓 Students</TabsTrigger>
            <TabsTrigger value="agents" className="px-4">🤝 Agents</TabsTrigger>
            <TabsTrigger value="tasks" className="px-4">📁 Tasks & Workflows</TabsTrigger>
            <TabsTrigger value="messages" className="px-4">💬 Messages</TabsTrigger>
            <TabsTrigger value="payments" className="px-4">💸 Payments</TabsTrigger>
            <TabsTrigger value="resources" className="px-4">📑 Resources</TabsTrigger>
            <TabsTrigger value="ai" className="px-4">🧠 Zoe</TabsTrigger>
            <TabsTrigger value="settings" className="px-4">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {personalOverviewKpis.map((stat) => (
                  <StatsCard key={stat.title} {...stat} />
                ))}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <LineChart className="h-5 w-5 text-primary" /> Application progress
                    </CardTitle>
                    <CardDescription>Status mix across your assigned students.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={applicationProgressData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="status" tickLine={false} axisLine={false} className="text-xs" />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" />
                        <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quick links</CardTitle>
                    <CardDescription>Jump straight into your most-used views.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <div>
                      <CardTitle className="text-lg">Daily activity trend</CardTitle>
                      <CardDescription>Track throughput and approvals over the last 7 days.</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Last 7 days
                    </Badge>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={dailyActivityTrendData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} className="text-xs" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend verticalAlign="top" align="left" iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="tasks"
                          name="Tasks completed"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="approvals"
                          name="Approvals"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" /> Zoe’s AI tips
                    </CardTitle>
                    <CardDescription>Smart nudges tailored to today’s workload.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {zoeSuggestions.map((tip) => (
                      <div key={tip.id} className="rounded-lg border p-3 text-sm leading-relaxed text-muted-foreground">
                        {tip.message}
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setActiveTab('ai')}
                    >
                      <Bot className="h-4 w-4" /> Ask Zoe for more
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Assigned students
                    </CardTitle>
                    <CardDescription>Role-based list showing only students assigned to you or your pod.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link to="/dashboard/students">
                      <Filter className="h-4 w-4" /> Advanced view
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <Input
                      value={studentSearch}
                      onChange={(event) => {
                        setStudentSearch(event.target.value);
                        setStudentPage(1);
                      }}
                      placeholder="Search by name, ID, or agent"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setStudentPage(1);
                    }}
                  >
                    <SelectTrigger className="lg:col-span-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="documents_pending">Documents pending</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={countryFilter}
                    onValueChange={(value) => {
                      setCountryFilter(value);
                      setStudentPage(1);
                    }}
                  >
                    <SelectTrigger className="lg:col-span-1">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All countries</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="UAE">UAE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={intakeFilter}
                    onValueChange={(value) => {
                      setIntakeFilter(value);
                      setStudentPage(1);
                    }}
                  >
                    <SelectTrigger className="lg:col-span-1">
                      <SelectValue placeholder="Intake" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All intakes</SelectItem>
                      <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                      <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                      <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={agentFilter}
                    onValueChange={(value) => {
                      setAgentFilter(value);
                      setStudentPage(1);
                    }}
                  >
                    <SelectTrigger className="lg:col-span-1">
                      <SelectValue placeholder="Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Assigned to me</SelectItem>
                      <SelectItem value="all">All agents</SelectItem>
                      <SelectItem value="Bridge Lagos">Bridge Lagos</SelectItem>
                      <SelectItem value="Bridge Nairobi">Bridge Nairobi</SelectItem>
                      <SelectItem value="Bridge Accra">Bridge Accra</SelectItem>
                      <SelectItem value="Bridge Dubai">Bridge Dubai</SelectItem>
                      <SelectItem value="Global Pathways">Global Pathways</SelectItem>
                      <SelectItem value="LatAm Partners">LatAm Partners</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="lg:col-span-1 flex items-center">
                    <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Intake</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsQuery.isPending ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                            No students match the selected filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedStudents.map((student) => (
                          <TableRow key={student.id} className="hover:bg-muted/50">
                            <TableCell className="space-y-1">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.id}</p>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={student.status} />
                            </TableCell>
                            <TableCell className="text-sm">{student.country}</TableCell>
                            <TableCell className="text-sm">{student.intake}</TableCell>
                            <TableCell className="text-sm">{student.agent}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{student.updatedAt}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {renderPagination(studentPage, studentTotalPages, handleStudentPageChange, 'students')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Partner pipelines
                  </CardTitle>
                  <CardDescription>Focus on the agents you manage directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {partnerLeads.map((partner) => (
                    <div key={partner.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{partner.name}</p>
                          <p className="text-xs text-muted-foreground">{partner.region} &bull; Focus: {partner.focus}</p>
                          <p className="text-xs text-muted-foreground">Last contacted {partner.lastContact}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="secondary">{partner.owner === 'You' ? 'Assigned to you' : partner.owner}</Badge>
                          <p className="text-xs text-muted-foreground">New leads: {partner.newLeads}</p>
                          <Button size="sm" variant="outline" className="mt-1" asChild>
                            <Link to="/dashboard/messages">Open chat</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-primary" /> Agent health
                  </CardTitle>
                  <CardDescription>Quick signals for agent engagement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">New lead response time</p>
                        <p className="text-xs text-muted-foreground">Average across your agents</p>
                      </div>
                      <Badge variant="outline">1.4 hours</Badge>
                    </div>
                    <Progress value={72} className="mt-3" aria-label="Lead response progress" />
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Unread partner messages</p>
                        <p className="text-xs text-muted-foreground">Action in the messages tab</p>
                      </div>
                      <Badge variant="destructive">5</Badge>
                    </div>
                    <Progress value={40} className="mt-3" aria-label="Messages progress" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Workflow queue
                  </CardTitle>
                  <CardDescription>Prioritized by due date and risk.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflowTasks.map((task) => (
                    <div key={task.id} className="flex flex-col gap-2 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{task.title}</p>
                          <p className="text-xs text-muted-foreground">Owned by {task.owner}</p>
                        </div>
                        <Badge
                          variant={
                            task.status === 'in_progress' ? 'secondary' : task.status === 'pending' ? 'outline' : 'destructive'
                          }
                          className="capitalize"
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Due {task.due}</span>
                        <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
                          <Link to="/dashboard/tasks">Open task</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Application pipeline
                  </CardTitle>
                  <CardDescription>Snapshot of current student progression.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { stage: 'Screening', value: 18 },
                    { stage: 'Offers', value: 12 },
                    { stage: 'Visa', value: 9 },
                    { stage: 'Enrolled', value: 5 },
                  ].map((row) => (
                    <div key={row.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{row.stage}</p>
                        <Badge variant="outline">{row.value}</Badge>
                      </div>
                      <Progress value={Math.min(row.value * 6, 100)} aria-label={`${row.stage} pipeline`} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" /> Unified inbox
                  </CardTitle>
                  <CardDescription>Messages from Zoe, partners, and internal teams.</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link to="/dashboard/messages" className="gap-2">
                    <Bot className="h-4 w-4" /> Ask Zoe inside chat
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-3">
                    {channelMessages.map((message) => (
                      <div key={message.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {message.sender
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{message.sender}</p>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{message.preview}</p>
                          <Badge variant={message.type === 'ai' ? 'secondary' : message.type === 'system' ? 'outline' : 'default'}>
                            {message.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Payments & commissions
                  </CardTitle>
                  <CardDescription>Track payouts and approval status per agent.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link to="/dashboard/payments">
                    <FileText className="h-4 w-4" /> Export CSV
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Due date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsQuery.isPending ? (
                        Array.from({ length: paymentPageSize }).map((_, index) => (
                          <TableRow key={`payment-skeleton-${index}`}>
                            <TableCell colSpan={6}>
                              <Skeleton className="h-10 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : paginatedPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                            No payment data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPayments.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-muted/50">
                            <TableCell className="text-sm font-medium">{payment.id}</TableCell>
                            <TableCell className="text-sm">{payment.student}</TableCell>
                            <TableCell className="text-sm">{payment.agent}</TableCell>
                            <TableCell className="text-sm">{payment.amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payment.status === 'paid'
                                    ? 'secondary'
                                    : payment.status === 'approved'
                                    ? 'outline'
                                    : payment.status === 'pending'
                                    ? 'default'
                                    : 'destructive'
                                }
                                className="capitalize"
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{payment.dueDate}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {renderPagination(paymentPage, paymentTotalPages, handlePaymentPageChange, 'payments')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Resources center
                </CardTitle>
                <CardDescription>Access the latest SOPs, forms, and policies.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {resourceLinks.map((resource) => (
                  <div key={resource.name} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">{resource.description}</p>
                      </div>
                      <Badge variant="outline">{resource.category}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-3" asChild>
                      <Link to="/resources">Open</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" /> Zoe intelligence
                </CardTitle>
                <CardDescription>Use Zoe for next-step guidance and document insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={zoeQuestion}
                    onChange={(event) => setZoeQuestion(event.target.value)}
                    placeholder="Ask Zoe: e.g. What’s next for John Smith?"
                    rows={4}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <p>Try: “Show me pending verifications for Fall 2025 intake.”</p>
                    <Button size="sm" className="gap-2" onClick={handleAskZoe}>
                      <Sparkles className="h-4 w-4" /> Ask Zoe
                    </Button>
                  </div>
                </div>
                {zoeResponse ? (
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
                    {zoeResponse}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
                    Zoe responses will appear here with suggested tasks, document flags, and key metrics.
                  </div>
                )}
                <Separator />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-sm text-foreground">Suggested prompts</p>
                  <ul className="grid gap-2 md:grid-cols-2">
                    <li className="rounded-md border p-2">“Summarize today’s pending approvals.”</li>
                    <li className="rounded-md border p-2">“Which students need financial documents?”</li>
                    <li className="rounded-md border p-2">“Show agents with stalled applications.”</li>
                    <li className="rounded-md border p-2">“Draft a follow-up email for visa readiness.”</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Preferences
                </CardTitle>
                <CardDescription>Adjust personal preferences, localization, and access controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Language</p>
                    <p className="text-xs text-muted-foreground">Current: English (UK). Additional languages coming soon.</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Realtime notifications</p>
                    <p className="text-xs text-muted-foreground">Receive alerts for updates on your assigned agents and students.</p>
                  </div>
                  <Switch defaultChecked aria-label="Toggle realtime notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Auto-sync with Zoe insights</p>
                    <p className="text-xs text-muted-foreground">Allow Zoe to push recommended actions into your task queue.</p>
                  </div>
                  <Switch aria-label="Toggle Zoe auto sync" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
