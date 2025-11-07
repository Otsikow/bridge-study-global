import { useEffect, useMemo } from "react";
import type { ComponentType, SVGProps } from "react";
import { useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText as FileTextIcon,
  Filter,
  Mail,
  MessageCircle,
  TrendingUp,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const partnerDashboardViews = [
  "overview",
  "applications",
  "documents",
  "offers",
  "messages",
  "analytics",
] as const;

type PartnerDashboardView = (typeof partnerDashboardViews)[number];

const isPartnerDashboardView = (value: string | null): value is PartnerDashboardView =>
  value !== null && partnerDashboardViews.some((view) => view === value);

const getViewFromLocation = (search: string): PartnerDashboardView => {
  const params = new URLSearchParams(search);
  const viewParam = params.get("view");
  return isPartnerDashboardView(viewParam) ? viewParam : "overview";
};

export default function PartnerDashboard() {
  const location = useLocation();

  const currentView = useMemo<PartnerDashboardView>(
    () => getViewFromLocation(location.search),
    [location.search]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentView]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
        <PartnerSidebar />
        <SidebarInset className="flex min-h-screen flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          <PartnerHeader />
          <main className="flex-1 space-y-8 px-4 pb-12 pt-6 md:px-8 lg:px-12">
            {currentView === "overview" && <OverviewView />}
            {currentView === "applications" && <ApplicationsView />}
            {currentView === "documents" && <DocumentsView />}
            {currentView === "offers" && <OffersView />}
            {currentView === "messages" && <MessagesView />}
            {currentView === "analytics" && <AnalyticsView />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

const overviewMetrics = [
  {
    label: "Active Applications",
    value: "428",
    change: "+8.2%",
    sublabel: "Across 42 universities",
    trend: "up" as const,
    icon: FileTextIcon,
  },
  {
    label: "Confirmed CAS",
    value: "92",
    change: "+14",
    sublabel: "Issued in the last 30 days",
    trend: "up" as const,
    icon: CheckCircle2,
  },
  {
    label: "Pending Documents",
    value: "36",
    change: "-4.5%",
    sublabel: "Needing partner follow-up",
    trend: "down" as const,
    icon: Upload,
  },
  {
    label: "Avg. Conversion",
    value: "34%",
    change: "+3.1 pts",
    sublabel: "Offer-to-enrolment rate",
    trend: "up" as const,
    icon: TrendingUp,
  },
] satisfies {
  label: string;
  value: string;
  change: string;
  sublabel: string;
  trend: "up" | "down";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[];

const applicationsTrend = [
  { month: "Jan", submitted: 240, offers: 86, enrolled: 34 },
  { month: "Feb", submitted: 268, offers: 94, enrolled: 42 },
  { month: "Mar", submitted: 310, offers: 112, enrolled: 56 },
  { month: "Apr", submitted: 362, offers: 128, enrolled: 64 },
  { month: "May", submitted: 380, offers: 142, enrolled: 72 },
  { month: "Jun", submitted: 402, offers: 156, enrolled: 81 },
  { month: "Jul", submitted: 428, offers: 172, enrolled: 92 },
];

const pipelineStages = [
  {
    key: "submitted",
    label: "Submitted",
    count: 428,
    percentage: 100,
    change: "+6.4%",
  },
  {
    key: "screening",
    label: "Screening & QA",
    count: 212,
    percentage: 49,
    change: "+3.1%",
  },
  {
    key: "offers",
    label: "Offers Issued",
    count: 156,
    percentage: 36,
    change: "+9.8%",
  },
  {
    key: "cas",
    label: "CAS / Visa Stage",
    count: 104,
    percentage: 24,
    change: "+14.6%",
  },
  {
    key: "enrolled",
    label: "Confirmed Enrolments",
    count: 92,
    percentage: 21,
    change: "+11.2%",
  },
];

const topUniversities = [
  {
    name: "University of Melbourne",
    country: "Australia",
    region: "APAC",
    activePrograms: 18,
    conversion: 42,
  },
  {
    name: "King's College London",
    country: "United Kingdom",
    region: "EMEA",
    activePrograms: 22,
    conversion: 38,
  },
  {
    name: "University of British Columbia",
    country: "Canada",
    region: "North America",
    activePrograms: 16,
    conversion: 35,
  },
  {
    name: "University of Auckland",
    country: "New Zealand",
    region: "APAC",
    activePrograms: 12,
    conversion: 31,
  },
  {
    name: "University of Amsterdam",
    country: "Netherlands",
    region: "EMEA",
    activePrograms: 14,
    conversion: 29,
  },
];

const documentFocus = [
  {
    title: "Financial capacity statements",
    pending: 14,
    sla: "Avg. 3.2 days",
  },
  {
    title: "Passport / ID verification",
    pending: 9,
    sla: "Avg. 1.8 days",
  },
  {
    title: "Academic transcripts",
    pending: 7,
    sla: "Avg. 2.4 days",
  },
];

function OverviewView() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <Card
              key={metric.label}
              className="relative overflow-hidden border border-slate-800/80 bg-slate-900/80 backdrop-blur transition hover:border-slate-700 hover:shadow-lg hover:shadow-blue-950/30"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              <CardHeader className="space-y-1 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-200">
                    {metric.label}
                  </CardTitle>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      metric.trend === "up" ? "text-emerald-300" : "text-red-300"
                    )}
                  >
                    <TrendIcon className="h-3.5 w-3.5" />
                    {metric.change}
                  </span>
                </div>
                <Icon className="h-8 w-8 text-blue-200/60" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-semibold tracking-tight text-slate-100">
                  {metric.value}
                </div>
                <p className="text-xs text-slate-400">{metric.sublabel}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Application Momentum
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Submissions vs offers vs enrolments (rolling 6 months)
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-200">
                University intake cycle sync
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationsTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="submittedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="offersColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="enrolledColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  stroke="#38bdf8"
                  fill="url(#submittedColor)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="offers"
                  stroke="#6366f1"
                  fill="url(#offersColor)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="enrolled"
                  stroke="#22c55e"
                  fill="url(#enrolledColor)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              Strategic Partner Insights
            </CardTitle>
            <CardDescription className="text-slate-400">
              Performance across priority universities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-4">
                {topUniversities.map((uni) => (
                  <div
                    key={uni.name}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{uni.name}</h3>
                        <p className="text-xs text-slate-400">{uni.country}</p>
                      </div>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-[10px] uppercase tracking-wide">
                        {uni.region}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-xs text-slate-400">Active programs</p>
                        <p className="text-base font-semibold text-slate-100">{uni.activePrograms}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                        <p className="text-xs text-slate-400">Conversion</p>
                        <p className="text-base font-semibold text-emerald-300">{uni.conversion}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              Application Pipeline Health
            </CardTitle>
            <CardDescription className="text-slate-400">
              Stage distribution and weekly delta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {pipelineStages.map((stage) => (
              <div
                key={stage.key}
                className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/70"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{stage.label}</p>
                    <p className="text-xs text-slate-400">Active records: {stage.count}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-300">{stage.change}</span>
                </div>
                <Progress
                  value={stage.percentage}
                  className="mt-3 h-2 bg-slate-800"
                  indicatorClassName="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              Document Compliance Focus
            </CardTitle>
            <CardDescription className="text-slate-400">
              SLA performance across requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">On-time submission</p>
                  <p className="text-2xl font-semibold text-slate-100">86%</p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  +4.5% this month
                </Badge>
              </div>
              <Progress
                value={86}
                className="mt-3 h-2 bg-slate-800"
                indicatorClassName="bg-gradient-to-r from-emerald-400 to-emerald-600"
              />
            </div>
            <div className="space-y-4">
              {documentFocus.map((item) => (
                <div key={item.title} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-100">
                    <span>{item.title}</span>
                    <span className="text-xs text-amber-300">{item.pending} pending</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{item.sla}</p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Export outstanding checklist
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const applicationRows = [
  {
    id: "APP-2025-0048",
    student: "Sarah Johnson",
    program: "MSc Data Science",
    university: "University of Warwick",
    status: "Screening",
    stage: "Document QA",
    intake: "Sep 2025",
    submittedOn: "Apr 12, 2025",
  },
  {
    id: "APP-2025-0041",
    student: "Deepak Mehta",
    program: "MBA Global",
    university: "University of Melbourne",
    status: "Offer",
    stage: "Offer Accepted",
    intake: "Jan 2026",
    submittedOn: "Mar 28, 2025",
  },
  {
    id: "APP-2025-0036",
    student: "Aisha Rahman",
    program: "BSc Computer Science",
    university: "University of British Columbia",
    status: "Documents",
    stage: "Awaiting Financials",
    intake: "Sep 2025",
    submittedOn: "Mar 18, 2025",
  },
  {
    id: "APP-2025-0033",
    student: "Matheus Silva",
    program: "MEng Mechanical",
    university: "University of Auckland",
    status: "CAS",
    stage: "CAS Issued",
    intake: "Jul 2025",
    submittedOn: "Feb 04, 2025",
  },
  {
    id: "APP-2025-0027",
    student: "Emily Chen",
    program: "BA Economics",
    university: "King's College London",
    status: "Enrolled",
    stage: "Confirmed",
    intake: "Sep 2025",
    submittedOn: "Jan 14, 2025",
  },
] as const;

type ApplicationStatus = "Screening" | "Offer" | "Documents" | "CAS" | "Enrolled";

const applicationStatusStyles: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  Screening: {
    label: "In Screening",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  Documents: {
    label: "Pending Docs",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  Offer: {
    label: "Offer Issued",
    className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  },
  CAS: {
    label: "CAS Stage",
    className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
  },
  Enrolled: {
    label: "Enrolled",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
};

function ApplicationsView() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Applications</h2>
          <p className="text-sm text-slate-400">Track partner applications through the recruitment pipeline.</p>
        </div>
        <Button className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-indigo-400">
          <Upload className="mr-2 h-4 w-4" />
          Bulk upload
        </Button>
      </div>

      <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-100">Application queue</CardTitle>
              <CardDescription className="text-slate-400">
                Filter by stage, intake window, or partner university alignment.
              </CardDescription>
            </div>
            <Button variant="outline" className="border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
              <Filter className="mr-2 h-4 w-4" />
              Advanced filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[220px] flex-1">
              <Input
                placeholder="Search by student, program, or ID..."
                className="h-10 rounded-lg border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-[150px] rounded-lg border-slate-800 bg-slate-950/70 text-slate-100">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="offer">Offers</SelectItem>
                <SelectItem value="cas">CAS</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="sep25">
              <SelectTrigger className="h-10 w-[150px] rounded-lg border-slate-800 bg-slate-950/70 text-slate-100">
                <SelectValue placeholder="Intake" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                <SelectItem value="all">All intakes</SelectItem>
                <SelectItem value="sep25">Sep 2025</SelectItem>
                <SelectItem value="jan26">Jan 2026</SelectItem>
                <SelectItem value="may26">May 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800/80">
                  <TableHead className="text-slate-300">Application ID</TableHead>
                  <TableHead className="text-slate-300">Student</TableHead>
                  <TableHead className="text-slate-300">Program</TableHead>
                  <TableHead className="text-slate-300">University</TableHead>
                  <TableHead className="text-slate-300">Stage</TableHead>
                  <TableHead className="text-slate-300">Intake</TableHead>
                  <TableHead className="text-slate-300">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationRows.map((row) => (
                  <TableRow key={row.id} className="border-slate-800/60 hover:bg-slate-900/80">
                    <TableCell className="font-medium text-slate-100">{row.id}</TableCell>
                    <TableCell className="space-y-1 text-slate-100">
                      {row.student}
                      <div className="text-xs text-slate-500">{row.stage}</div>
                    </TableCell>
                    <TableCell className="text-slate-200">{row.program}</TableCell>
                    <TableCell className="text-slate-200">{row.university}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", applicationStatusStyles[row.status].className)}>
                        {applicationStatusStyles[row.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-200">{row.intake}</TableCell>
                    <TableCell className="text-slate-300">{row.submittedOn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
            <span>Showing 5 of 428 applications in focus.</span>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-8 rounded-lg text-slate-300 hover:text-white">
                Load more
              </Button>
              <Button variant="outline" className="h-8 rounded-lg border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const documentRequests = [
  {
    student: "Noah Williams",
    request: "Updated bank statement",
    dueDate: "Jun 18, 2025",
    university: "University of Queensland",
    status: "Awaiting upload",
    priority: "High",
  },
  {
    student: "Priya Patel",
    request: "IELTS score verification",
    dueDate: "Jun 12, 2025",
    university: "King's College London",
    status: "In review",
    priority: "Medium",
  },
  {
    student: "Lucas Gomez",
    request: "Passport renewal copy",
    dueDate: "Jun 05, 2025",
    university: "University of British Columbia",
    status: "Overdue",
    priority: "Critical",
  },
  {
    student: "Sofia Anders",
    request: "Academic transcript (sem 5)",
    dueDate: "Jun 20, 2025",
    university: "University of Amsterdam",
    status: "Awaiting upload",
    priority: "Low",
  },
] as const;

function DocumentsView() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Document requests</h2>
          <p className="text-sm text-slate-400">
            Monitor outstanding documentation and SLA compliance for partner applications.
          </p>
        </div>
        <Button variant="outline" className="border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
          <Download className="mr-2 h-4 w-4" />
          Download checklist
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Outstanding documentation</CardTitle>
            <CardDescription className="text-slate-400">Prioritize requests by urgency and intake.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60">
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-slate-800/80">
                    <TableHead className="text-slate-300">Student</TableHead>
                    <TableHead className="text-slate-300">Requirement</TableHead>
                    <TableHead className="text-slate-300">University</TableHead>
                    <TableHead className="text-slate-300">Due</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentRequests.map((item) => (
                    <TableRow key={item.student} className="border-slate-800/60 hover:bg-slate-900/80">
                      <TableCell className="font-medium text-slate-100">
                        {item.student}
                        <div className="text-xs text-slate-500">{item.priority} priority</div>
                      </TableCell>
                      <TableCell className="text-slate-200">{item.request}</TableCell>
                      <TableCell className="text-slate-200">{item.university}</TableCell>
                      <TableCell className="text-slate-300">{item.dueDate}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-xs",
                            item.status === "Overdue"
                              ? "border-red-500/20 bg-red-500/10 text-red-300"
                              : item.status === "In review"
                                ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between text-sm text-slate-400">
              <span>4 open requests. Average turnaround: 2.7 business days.</span>
              <Button variant="ghost" className="h-8 text-slate-300 hover:text-white">
                Send reminders
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Workflow insights</CardTitle>
            <CardDescription className="text-slate-400">
              Partner operations performance this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Average SLA</p>
                  <p className="text-2xl font-semibold text-slate-100">84%</p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  +6% vs last week
                </Badge>
              </div>
              <Progress
                value={84}
                className="mt-3 h-2 bg-slate-800"
                indicatorClassName="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
                <Clock className="mt-1 h-4 w-4 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">Visa financial drafts</p>
                  <p className="text-xs text-slate-400">Fast-track review available for high-priority cases.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
                <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">Auto-approve templates</p>
                  <p className="text-xs text-slate-400">
                    12 documents matched trusted template library in the past 48 hours.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
                <Upload className="mt-1 h-4 w-4 text-blue-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">Bulk intake reminder</p>
                  <p className="text-xs text-slate-400">Send consolidated reminders for Sep 2025 intake cohort.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const offersData = [
  {
    student: "Grace Allen",
    university: "University of Melbourne",
    offerType: "Unconditional",
    casStatus: "CAS issued",
    deadline: "Jul 04, 2025",
    notes: "Deposit received",
  },
  {
    student: "Mohammed Ali",
    university: "King's College London",
    offerType: "Conditional",
    casStatus: "Awaiting documents",
    deadline: "Jun 25, 2025",
    notes: "Pending financial statement",
  },
  {
    student: "Hannah Wu",
    university: "University of Auckland",
    offerType: "Conditional",
    casStatus: "Review scheduled",
    deadline: "Jul 10, 2025",
    notes: "Interview booked",
  },
  {
    student: "Kwame Boateng",
    university: "University of Amsterdam",
    offerType: "Unconditional",
    casStatus: "Submitted to CAS",
    deadline: "Jun 30, 2025",
    notes: "Awaiting confirmation",
  },
] as const;

function OffersView() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Offers & CAS</h2>
          <p className="text-sm text-slate-400">Track visa readiness, offer status, and enrolment confirmation.</p>
        </div>
        <Button className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-cyan-400">
          <BadgeCheck className="mr-2 h-4 w-4" />
          Generate CAS pack
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Offer readiness tracker</CardTitle>
            <CardDescription className="text-slate-400">Automated CAS workflow across partner universities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="cas">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-950/60">
                <TabsTrigger value="offers" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-slate-100">
                  Offers Ready (156)
                </TabsTrigger>
                <TabsTrigger value="cas" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-slate-100">
                  CAS In Progress (104)
                </TabsTrigger>
                <TabsTrigger value="visa" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-slate-100">
                  Visa Prep (68)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cas" className="mt-4">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60">
                  <Table>
                    <TableHeader className="bg-slate-950/80">
                      <TableRow className="border-slate-800/80">
                        <TableHead className="text-slate-300">Student</TableHead>
                        <TableHead className="text-slate-300">University</TableHead>
                        <TableHead className="text-slate-300">Offer type</TableHead>
                        <TableHead className="text-slate-300">CAS status</TableHead>
                        <TableHead className="text-slate-300">Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offersData.map((item) => (
                        <TableRow key={item.student} className="border-slate-800/60 hover:bg-slate-900/80">
                          <TableCell className="space-y-1 font-medium text-slate-100">
                            {item.student}
                            <div className="text-xs text-slate-500">{item.notes}</div>
                          </TableCell>
                          <TableCell className="text-slate-200">{item.university}</TableCell>
                          <TableCell className="text-slate-200">{item.offerType}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-xs",
                                item.casStatus === "CAS issued"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                  : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                              )}
                            >
                              {item.casStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{item.deadline}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="offers" className="mt-4 text-sm text-slate-400">
                Offer consolidation data will appear here.
              </TabsContent>
              <TabsContent value="visa" className="mt-4 text-sm text-slate-400">
                Visa readiness stats coming soon.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Next actions</CardTitle>
            <CardDescription className="text-slate-400">
              Automated recommendations for partner success managers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Visa compliance</p>
                  <p className="text-2xl font-semibold text-slate-100">92%</p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  +3% vs last week
                </Badge>
              </div>
              <Progress
                value={92}
                className="mt-3 h-2 bg-slate-800"
                indicatorClassName="bg-gradient-to-r from-emerald-500 to-cyan-500"
              />
            </div>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                <p className="font-medium">Send CAS confirmation to University of Melbourne cohort.</p>
                <p className="mt-1 text-xs text-slate-400">Suggested owner: Asia Enrollment Desk • Auto-generated reminder</p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                <p className="font-medium">Trigger visa support pack for 12 pending confirmations.</p>
                <p className="mt-1 text-xs text-slate-400">Include financial doc templates + accommodation guidance.</p>
              </div>
            </div>
            <Separator className="bg-slate-800/80" />
            <Button variant="outline" className="w-full border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
              View full checklist
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const messageThreads = [
  {
    contact: "University of Melbourne Admissions",
    snippet: "Confirmed: CAS letters for August cohort released this Friday.",
    unread: 2,
    updated: "12m ago",
    channel: "Portal",
  },
  {
    contact: "King's College London Compliance",
    snippet: "Please upload updated financial declarations for 3 pending cases.",
    unread: 0,
    updated: "1h ago",
    channel: "Email",
  },
  {
    contact: "University of Auckland Housing",
    snippet: "Housing allocations need confirmation before June 21 for Sep intake.",
    unread: 1,
    updated: "3h ago",
    channel: "Portal",
  },
  {
    contact: "Partner Success Manager",
    snippet: "Weekly sync: focus on high-priority visa escalations.",
    unread: 0,
    updated: "Yesterday",
    channel: "Slack",
  },
] as const;

function MessagesView() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Messages & alerts</h2>
          <p className="text-sm text-slate-400">Stay aligned with admissions teams and partner stakeholders.</p>
        </div>
        <Button variant="outline" className="border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
          <Mail className="mr-2 h-4 w-4" />
          Compose update
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Partner communication center</CardTitle>
            <CardDescription className="text-slate-400">
              Priority conversations synced from admissions, finance, and CAS teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messageThreads.map((thread) => (
              <div
                key={thread.contact}
                className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{thread.contact}</h3>
                    <p className="mt-1 text-sm text-slate-300">{thread.snippet}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
                    <span>{thread.updated}</span>
                    {thread.unread > 0 && (
                      <Badge className="rounded-full border-blue-500/30 bg-blue-500/10 text-blue-200">
                        {thread.unread} new
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-300" />
                    {thread.channel}
                  </span>
                  <Button variant="ghost" className="h-8 text-slate-300 hover:text-white">
                    Open thread
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Engagement insights</CardTitle>
            <CardDescription className="text-slate-400">
              Pulse on partner responsiveness and critical follow-ups.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Average response time</p>
                  <p className="text-2xl font-semibold text-slate-100">3h 12m</p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  Best-in-class
                </Badge>
              </div>
              <Progress
                value={78}
                className="mt-3 h-2 bg-slate-800"
                indicatorClassName="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"
              />
            </div>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                <p className="font-medium">Visa escalation digest</p>
                <p className="mt-1 text-xs text-slate-400">
                  Consolidated summary sent daily at 18:00 local partner time.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                <p className="font-medium">Automation coverage</p>
                <p className="mt-1 text-xs text-slate-400">64% of reminders triggered automatically by workflow rules.</p>
              </div>
            </div>
            <Separator className="bg-slate-800/80" />
            <Button variant="outline" className="w-full border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800">
              View communications hub
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const regionPerformance = [
  { region: "APAC", applications: 182, offers: 76, enrolments: 34 },
  { region: "EMEA", applications: 148, offers: 62, enrolments: 28 },
  { region: "North America", applications: 96, offers: 38, enrolments: 14 },
  { region: "Latin America", applications: 58, offers: 24, enrolments: 9 },
  { region: "Africa", applications: 44, offers: 18, enrolments: 7 },
];

const offerBreakdown = [
  { label: "Unconditional", value: 92, color: "#22c55e" },
  { label: "Conditional", value: 64, color: "#38bdf8" },
  { label: "Pending", value: 28, color: "#fbbf24" },
  { label: "Deferred", value: 12, color: "#f97316" },
];

const kpiCards = [
  {
    label: "Offer-to-CAS conversion",
    value: "61%",
    change: "+4.2%",
    description: "High conversion driven by APAC partners.",
  },
  {
    label: "CAS turnaround",
    value: "4.6 days",
    change: "-1.2 days",
    description: "Measured from offer acceptance to CAS issued.",
  },
  {
    label: "Enrolment yield",
    value: "34%",
    change: "+3.1 pts",
    description: "Offer to confirmed enrolment yield.",
  },
];

function AnalyticsView() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Analytics</h2>
        <p className="text-sm text-slate-400">
          Benchmark performance across partner regions, universities, and offer cycles.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              Regional conversion performance
            </CardTitle>
            <CardDescription className="text-slate-400">
              Applications, offers, and enrolments across key partner regions.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="region" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="applications" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="offers" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="enrolments" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              Offer outcome breakdown
            </CardTitle>
            <CardDescription className="text-slate-400">Active partner pipeline outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[360px] flex-col justify-between">
            <div className="mx-auto h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={offerBreakdown}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {offerBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 text-sm">
              {offerBreakdown.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-slate-200">{segment.label}</span>
                  </div>
                  <span className="font-semibold text-slate-100">{segment.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Card
            key={kpi.label}
            className="border border-slate-800/80 bg-slate-900/80 backdrop-blur transition hover:border-slate-700 hover:bg-slate-900"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-100">{kpi.label}</CardTitle>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  {kpi.change}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-100">{kpi.value}</div>
              <p className="mt-2 text-xs text-slate-400">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border border-slate-800/80 bg-slate-900/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-100">
            University engagement timeline
          </CardTitle>
          <CardDescription className="text-slate-400">
            High-impact actions tracked across recruitment cycle touchpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Week 1</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">Partner onboarding</p>
              <p className="mt-2 text-xs text-slate-400">
                24 new university partners briefed on upcoming intake priorities.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Week 2</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">Program spotlight</p>
              <p className="mt-2 text-xs text-slate-400">
                APAC webinars driving +18% engagement vs prior intake cycle.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Week 3</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">Offer conversion sprint</p>
              <p className="mt-2 text-xs text-slate-400">
                42 pending offers targeted with nurture campaigns.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Week 4</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">Visa readiness review</p>
              <p className="mt-2 text-xs text-slate-400">
                CAS compliance checklists automated for top 5 regions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
