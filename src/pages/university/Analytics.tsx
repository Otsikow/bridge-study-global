import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import {
  Download,
  Globe2,
  MailCheck,
  PieChart as PieChartIcon,
  Stamp,
  TrendingUp,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";
import { useToast } from "@/hooks/use-toast";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";

const RANGE_OPTIONS = [
  { id: "30d", label: "30 Days" },
  { id: "6m", label: "6 Months" },
  { id: "1y", label: "1 Year" },
] as const;

type DateRangeValue = (typeof RANGE_OPTIONS)[number]["id"];

const RANGE_LABELS: Record<DateRangeValue, string> = {
  "30d": "Last 30 days",
  "6m": "Last 6 months",
  "1y": "Last 12 months",
};

const OFFER_STATUSES = ["conditional_offer", "unconditional_offer"] as const;
const CAS_STATUSES = ["cas_loa", "visa"] as const;

const STATUS_COLOR_MAP: Record<string, string> = {
  submitted: "#38bdf8",
  draft: "#60a5fa",
  screening: "#818cf8",
  conditional_offer: "#22d3ee",
  unconditional_offer: "#0ea5e9",
  cas_loa: "#0ea5e9",
  visa: "#22c55e",
  enrolled: "#10b981",
  withdrawn: "#f97316",
  rejected: "#f97316",
  deferred: "#facc15",
  other: "#94a3b8",
  unknown: "#64748b",
};

const DEFAULT_STATUS_COLORS = [
  "#38bdf8",
  "#818cf8",
  "#22d3ee",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#facc15",
  "#a855f7",
];

const COUNTRY_COLORS = [
  "#38bdf8",
  "#0ea5e9",
  "#818cf8",
  "#a855f7",
  "#f97316",
  "#facc15",
];

const normalizeStatus = (status: string | null | undefined) =>
  status ? status.toLowerCase() : "unknown";

const formatStatusLabel = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getRangeStartDate = (range: DateRangeValue) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === "30d") {
    start.setDate(start.getDate() - 30);
  } else if (range === "6m") {
    start.setMonth(start.getMonth() - 6);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }

  return start;
};

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue}"`;
  }

  return stringValue;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const AnalyticsPage = () => {
  const { data } = useUniversityDashboard();
  const { toast } = useToast();

  const [selectedRange, setSelectedRange] = useState<DateRangeValue>("6m");

  const applications = data?.applications ?? [];

  const filteredApplications = useMemo(() => {
    if (!applications.length) {
      return [];
    }

    const startDate = getRangeStartDate(selectedRange);

    return applications.filter((application) => {
      if (!application.createdAt) {
        return false;
      }

      const createdAt = new Date(application.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      return createdAt >= startDate;
    });
  }, [applications, selectedRange]);

  const rangeMetrics = useMemo(() => {
    const totalApplicants = filteredApplications.length;
    let offersSent = 0;
    let casIssued = 0;

    filteredApplications.forEach((application) => {
      const status = normalizeStatus(application.status);
      if (OFFER_STATUSES.includes(status)) {
        offersSent += 1;
      }
      if (CAS_STATUSES.includes(status)) {
        casIssued += 1;
      }
    });

    const conversionRate =
      totalApplicants > 0 ? Math.round((offersSent / totalApplicants) * 100) : 0;

    return {
      totalApplicants,
      offersSent,
      casIssued,
      conversionRate,
    };
  }, [filteredApplications]);

  const applicationsOverTime = useMemo(() => {
    if (!filteredApplications.length) {
      return [];
    }

    const buckets = new Map<
      number,
      {
        label: string;
        count: number;
      }
    >();

    filteredApplications.forEach((application) => {
      const createdAt = new Date(application.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return;
      }

      const bucketDate = new Date(createdAt);
      bucketDate.setHours(0, 0, 0, 0);

      if (selectedRange !== "30d") {
        bucketDate.setDate(1);
      }

      const bucketKey = bucketDate.getTime();
      const label = format(
        bucketDate,
        selectedRange === "30d" ? "MMM d" : "MMM yyyy",
      );

      if (buckets.has(bucketKey)) {
        buckets.get(bucketKey)!.count += 1;
      } else {
        buckets.set(bucketKey, { label, count: 1 });
      }
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => ({
        period: value.label,
        applications: value.count,
      }));
  }, [filteredApplications, selectedRange]);

  const offersByCountry = useMemo(() => {
    if (!filteredApplications.length) {
      return [];
    }

    const counts = new Map<string, number>();

    filteredApplications.forEach((application) => {
      const status = normalizeStatus(application.status);
      if (!OFFER_STATUSES.includes(status)) {
        return;
      }

      const country = application.studentNationality || "Unknown";
      counts.set(country, (counts.get(country) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((entry, index) => ({
        ...entry,
        fill: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
      }));
  }, [filteredApplications]);

  const statusDistribution = useMemo(() => {
    if (!filteredApplications.length) {
      return [];
    }

    const counts = new Map<string, number>();

    filteredApplications.forEach((application) => {
      const status = normalizeStatus(application.status);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, value], index) => {
        const color =
          STATUS_COLOR_MAP[status] ??
          DEFAULT_STATUS_COLORS[index % DEFAULT_STATUS_COLORS.length];
        return {
          status,
          label: formatStatusLabel(status),
          value,
          color,
        };
      });
  }, [filteredApplications]);

  const handleExport = useCallback(() => {
    if (!filteredApplications.length) {
      toast({
        title: "No data to export",
        description: "Adjust the date range to include applications before exporting.",
      });
      return;
    }

    const headers = [
      "Application Number",
      "Student Name",
      "Student Nationality",
      "Program",
      "Status",
      "Created At",
    ];

    const rows = filteredApplications.map((application) => [
      application.appNumber,
      application.studentName,
      application.studentNationality ?? "Unknown",
      application.programName,
      formatStatusLabel(normalizeStatus(application.status)),
      application.createdAt ? new Date(application.createdAt).toISOString() : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `university-analytics-${selectedRange}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [filteredApplications, selectedRange, toast]);

  const currentRangeLabel = RANGE_LABELS[selectedRange];

  const summaryCards = [
    {
      id: "applicants",
      label: "Total Applicants",
      value: formatNumber(rangeMetrics.totalApplicants),
      icon: Users,
      accent: "border-blue-500/40 bg-blue-500/10 text-blue-200",
    },
    {
      id: "offers",
      label: "Offers Sent",
      value: formatNumber(rangeMetrics.offersSent),
      icon: MailCheck,
      accent: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    },
    {
      id: "cas",
      label: "CAS Letters Issued",
      value: formatNumber(rangeMetrics.casIssued),
      icon: Stamp,
      accent: "border-teal-500/40 bg-teal-500/10 text-teal-200",
    },
    {
      id: "conversion",
      label: "Conversion Rate",
      value: `${rangeMetrics.conversionRate}%`,
      icon: TrendingUp,
      accent: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white lg:text-3xl">
            Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Visualise performance metrics, student engagement, and offer activity
            in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-slate-800/60 bg-slate-900/50 p-1">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant="ghost"
                onClick={() => setSelectedRange(option.id)}
                className={cn(
                  "rounded-full px-3 text-xs font-medium tracking-wide text-slate-300 transition focus-visible:ring-0",
                  selectedRange === option.id
                    ? "bg-blue-500/20 text-blue-100 shadow-sm"
                    : "hover:bg-slate-800/60",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card
            key={card.id}
            className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/30 text-slate-100 shadow-lg shadow-slate-950/30"
          >
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                <p className="text-3xl font-semibold text-white">
                  {card.value}
                </p>
                <p className="text-xs text-slate-500">{currentRangeLabel} snapshot</p>
              </div>
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border",
                  card.accent,
                )}
              >
                <card.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-100">
              Applications Over Time
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {currentRangeLabel} of submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {applicationsOverTime.length === 0 ? (
              <StatePlaceholder
                icon={<TrendingUp className="h-8 w-8 text-slate-500" />}
                title="Waiting for activity"
                description="Application submission trends will appear once students start applying in this period."
                className="h-full bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={applicationsOverTime}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" />
                  <XAxis
                    dataKey="period"
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                  />
                  <YAxis
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      borderColor: "#1f2937",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#60a5fa"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-100">
              Offers by Country
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Top source markets for issued offers in the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {offersByCountry.length === 0 ? (
              <StatePlaceholder
                icon={<Globe2 className="h-8 w-8 text-slate-500" />}
                title="No offers issued yet"
                description="When offers go out, this view will highlight where successful applicants are located."
                className="h-full bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={offersByCountry}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                  />
                  <YAxis
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                    contentStyle={{
                      background: "#0f172a",
                      borderColor: "#1f2937",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {offersByCountry.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-100">
              Application Status Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Breakdown of application statuses for {currentRangeLabel.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {statusDistribution.length === 0 ? (
              <StatePlaceholder
                icon={<PieChartIcon className="h-8 w-8 text-slate-500" />}
                title="No status data yet"
                description="Once applications progress through each stage, their distribution will be displayed here."
                className="h-full bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      borderColor: "#1f2937",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} applications`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AnalyticsPage;
