import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlarmClock,
  BellDot,
  Bot,
  Building2,
  CalendarRange,
  CheckCircle2,
  CheckSquare,
  FileText,
  Filter,
  LineChart,
  Loader2,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

import BackButton from '@/components/BackButton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

type AssignedAgent = {
  id: string;
  company: string;
  country: string;
  leadsSubmitted: number;
  activeStudents: number;
  commissionRate: string;
  verificationStatus: 'approved' | 'pending';
  conversionRate: number;
  latestSubmission: {
    description: string;
    time: string;
  };
};

const overviewStats = [
  { title: 'Active Students', value: '128', description: 'Across all intakes', icon: Users, to: '/dashboard/students' },
  { title: 'Applications in Review', value: '46', description: '12 urgent actions', icon: FileText, to: '/dashboard/applications' },
  { title: 'Tasks Due Today', value: '9', description: '3 critical items', icon: CheckSquare, to: '/dashboard/tasks' },
  { title: 'Avg. SLA', value: '2.8 days', description: 'Goal: 3 days', icon: AlarmClock, to: '/dashboard/reports' },
];

const productivityMetrics = [
  { label: 'Daily Tasks Closed', value: 14, target: 18 },
  { label: 'Weekly Offers Secured', value: 6, target: 8 },
  { label: 'Pending Verifications', value: 5, target: 0 },
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

const assignedAgents: AssignedAgent[] = [
  {
    id: 'AG-001',
    company: 'Bridge Lagos',
    country: 'Nigeria',
    leadsSubmitted: 34,
    activeStudents: 12,
    commissionRate: '18%',
    verificationStatus: 'approved',
    conversionRate: 42,
    latestSubmission: {
      description: 'Submitted 3 new undergraduate leads',
      time: '2h ago',
    },
  },
  {
    id: 'AG-003',
    company: 'LatAm Partners',
    country: 'Mexico',
    leadsSubmitted: 21,
    activeStudents: 9,
    commissionRate: '16%',
    verificationStatus: 'approved',
    conversionRate: 37,
    latestSubmission: {
      description: 'Uploaded visa documents for 2 students',
      time: '1d ago',
    },
  },
  {
    id: 'AG-004',
    company: 'Bridge Dubai',
    country: 'UAE',
    leadsSubmitted: 18,
    activeStudents: 7,
    commissionRate: '17%',
    verificationStatus: 'pending',
    conversionRate: 33,
    latestSubmission: {
      description: 'Shared financial proof updates',
      time: '3d ago',
    },
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

const notifications = [
  { id: 'NT-001', title: 'Visa stage update', detail: 'Emily Davis visa approved.', priority: 'high', time: 'Just now' },
  { id: 'NT-002', title: 'New agent lead', detail: 'Bridge Lagos submitted 3 new candidates.', priority: 'medium', time: '15m ago' },
  { id: 'NT-003', title: 'Document verification', detail: 'Upload proof of funds for John Smith.', priority: 'high', time: '45m ago' },
  { id: 'NT-004', title: 'Finance reminder', detail: 'Review commissions pending for LatAm Partners.', priority: 'medium', time: '1h ago' },
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AssignedAgent | null>(null);
  const [messageDraft, setMessageDraft] = useState('');

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

  const totalAgentLeads = assignedAgents.reduce((sum, agent) => sum + agent.leadsSubmitted, 0);
  const totalAgentStudents = assignedAgents.reduce((sum, agent) => sum + agent.activeStudents, 0);
  const averageAgentConversion = assignedAgents.length
    ? Math.round(assignedAgents.reduce((sum, agent) => sum + agent.conversionRate, 0) / assignedAgents.length)
    : 0;

  const handleOpenAgentChat = (agent: AssignedAgent) => {
    setSelectedAgent(agent);
    setIsChatOpen(true);
  };

  const handleChatOpenChange = (open: boolean) => {
    setIsChatOpen(open);

    if (!open) {
      setMessageDraft('');
      setSelectedAgent(null);
    }
  };

  const handleSendAgentMessage = () => {
    if (!messageDraft.trim()) return;

    setIsChatOpen(false);
    setMessageDraft('');
    setSelectedAgent(null);
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

        <section aria-label="Staff KPIs" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <LineChart className="h-5 w-5 text-primary" /> Staff productivity snapshot
              </CardTitle>
              <CardDescription>Daily and weekly performance across your queues.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/reports" className="gap-2">
                <TrendingUp className="h-4 w-4" /> View full analytics
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {productivityMetrics.map((metric) => {
              const progress = Math.min(100, Math.round((metric.value / metric.target) * 100));

              return (
                <div key={metric.label} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{metric.label}</p>
                      <p className="text-xs text-muted-foreground">Target {metric.target}</p>
                    </div>
                    <Badge variant={progress >= 100 ? 'secondary' : 'outline'}>{progress}%</Badge>
                  </div>
                  <Progress value={progress} aria-label={`${metric.label} progress`} />
                  <p className="text-xs text-muted-foreground">Completed {metric.value} of {metric.target} goal.</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
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
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Live notifications
                  </CardTitle>
                  <CardDescription>Realtime events sourced from Supabase.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notifications.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'outline'} className="capitalize">
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" /> Action queue
                  </CardTitle>
                  <CardDescription>Next best actions suggested by Zoe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Sparkles className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Prioritize pending document verifications.</p>
                      <p className="text-xs text-muted-foreground">3 students waiting &mdash; due by tomorrow.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <MessageCircle className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Follow up with Bridge Lagos about new leads.</p>
                      <p className="text-xs text-muted-foreground">Schedule call or send message from the agent tab.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <CalendarRange className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Check payments due in the next 7 days.</p>
                      <p className="text-xs text-muted-foreground">3 commission items still require approval.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          <div className="grid gap-6 xl:grid-cols-[3fr,2fr]">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Assigned agents
                  </CardTitle>
                  <CardDescription>Track the partners directly assigned to your portfolio.</CardDescription>
                </div>
                <Badge variant="outline" className="px-3 text-xs">
                  {assignedAgents.length} active partnerships
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Company Name</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Leads Submitted</TableHead>
                        <TableHead>Active Students</TableHead>
                        <TableHead>Commission Rate</TableHead>
                        <TableHead>Verification Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedAgents.map((agent) => (
                        <TableRow key={agent.id} className="align-top hover:bg-muted/50">
                          <TableCell className="space-y-3">
                            <div>
                              <p className="text-sm font-semibold">{agent.company}</p>
                              <p className="text-xs text-muted-foreground">ID {agent.id}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-fit px-3 text-xs"
                              onClick={() => handleOpenAgentChat(agent)}
                            >
                              Message Agent
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm">{agent.country}</TableCell>
                          <TableCell className="text-sm">{agent.leadsSubmitted}</TableCell>
                          <TableCell className="text-sm">{agent.activeStudents}</TableCell>
                          <TableCell className="text-sm">{agent.commissionRate}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                agent.verificationStatus === 'approved'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                              }
                            >
                              {agent.verificationStatus === 'approved' ? 'Approved' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Agent performance
                </CardTitle>
                <CardDescription>Conversion trends and recent partner activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Avg. conversion rate</p>
                    <p className="text-xl font-semibold">{averageAgentConversion}%</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Leads this quarter</p>
                    <p className="text-xl font-semibold">{totalAgentLeads}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Active students</p>
                    <p className="text-xl font-semibold">{totalAgentStudents}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Latest submissions</p>
                  <div className="space-y-2">
                    {assignedAgents.map((agent) => (
                      <div key={`${agent.id}-submission`} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{agent.company}</p>
                            <p className="text-xs text-muted-foreground">{agent.latestSubmission.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {agent.latestSubmission.time}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
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
        <Dialog open={isChatOpen} onOpenChange={handleChatOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Message {selectedAgent?.company ?? 'agent'}</DialogTitle>
              <DialogDescription>Send a quick update without leaving the staff workspace.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAgent ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedAgent.company
                        .split(' ')
                        .map((word) => word[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{selectedAgent.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAgent.country} • {selectedAgent.activeStudents} active students
                    </p>
                  </div>
                </div>
              ) : null}
              <Textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Share an update, request documents, or schedule a call."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleChatOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendAgentMessage} disabled={!messageDraft.trim()}>
                Send message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
