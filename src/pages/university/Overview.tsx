import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarPlus,
  FileStack,
  Inbox,
  Sparkles,
  Target,
  ClipboardList,
  CheckCircle2,
  Stamp,
  GraduationCap,
} from "lucide-react";
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
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/university/panels/MetricCard";
import { ApplicationSourcesChart } from "@/components/university/panels/ApplicationSourcesChart";
import { ApplicationStatusChart } from "@/components/university/panels/ApplicationStatusChart";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";
import {
  withUniversityCardStyles,
  withUniversitySurfaceSubtle,
  withUniversitySurfaceTint,
} from "@/components/university/common/cardStyles";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const pipelineIcons: Record<string, ComponentType<{ className?: string }>> = {
  submitted: FileStack,
  screening: ClipboardList,
  offers: CheckCircle2,
  cas: Stamp,
  enrolled: GraduationCap,
};

const OverviewPage = () => {
  const { data } = useUniversityDashboard();

  if (!data?.university) {
    return (
      <StatePlaceholder
        icon={<Building2 className="h-10 w-10 text-blue-400" />}
        title="No university profile connected"
        description="Connect your institution to unlock the Global Education Gateway dashboard experience."
      />
    );
  }

  const {
    university,
    metrics,
    pipeline,
    conversion,
    recentApplications,
    documentRequests,
    programs,
    agents,
    countrySummary,
    statusSummary,
  } = data;

  return (
    <div className="space-y-8">
      <Card className={withUniversityCardStyles("overflow-hidden rounded-3xl text-slate-100 shadow-[0_28px_72px_-36px_rgba(30,64,175,0.5)]")}>
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/40 via-indigo-600/30 to-slate-900/80 shadow-lg shadow-blue-900/40">
                {university.logo_url ? (
                  <img
                    src={university.logo_url}
                    alt={university.name}
                    className="h-16 w-16 rounded-xl object-contain"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-blue-200" />
                )}
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-white lg:text-3xl">
                  {university.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  {university.city ? (
                    <Badge variant="outline" className="border-blue-900/50 bg-blue-950/60">
                      {university.city}, {university.country}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-900/50 bg-blue-950/60">
                      {university.country}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-blue-500/40 text-blue-200">
                    {programs.length} Programs
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-200">
                    {agents.length} Partner Agents
                  </Badge>
                </div>
                {university.description ? (
                  <p className="max-w-3xl text-sm text-slate-400">
                    {university.description}
                  </p>
                ) : null}
                {university.website ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-2 text-blue-200 hover:text-white"
                    asChild
                  >
                    <a href={university.website} target="_blank" rel="noreferrer">
                      Visit University Site
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className={withUniversitySurfaceTint("flex flex-col gap-4 rounded-2xl p-6 text-sm text-slate-300 bg-blue-950/60")}>
              <div className="flex items-center justify-between">
                <span>Total Applications</span>
                <span className="text-lg font-semibold text-white">
                  {formatNumber(metrics.totalApplications)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending Documents</span>
                <span className="text-lg font-semibold text-white">
                  {formatNumber(metrics.pendingDocuments)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Acceptance Rate</span>
                <span className="text-lg font-semibold text-emerald-300">
                  {metrics.acceptanceRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>New This Week</span>
                <span className="text-lg font-semibold text-blue-300">
                  {formatNumber(metrics.newApplicationsThisWeek)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Applications"
          value={formatNumber(metrics.totalApplications)}
          description="Total applications connected to your programs"
          icon={<FileStack className="h-5 w-5" />}
          tone="info"
        />
        <MetricCard
          label="Acceptance Rate"
          value={`${metrics.acceptanceRate}%`}
          description="Offer issuance vs total applications"
          icon={<Target className="h-5 w-5" />}
          tone="success"
        />
        <MetricCard
          label="New applications (7 days)"
          value={formatNumber(metrics.newApplicationsThisWeek)}
          description="Fresh submissions in the last week"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <MetricCard
          label="Pending document requests"
          value={formatNumber(metrics.pendingDocuments)}
          description="Awaiting student uploads or verification"
          icon={<Inbox className="h-5 w-5" />}
          tone="warning"
          footer={
            <Link
              to="/university/documents"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-100"
            >
              Manage requests →
            </Link>
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className={withUniversityCardStyles("lg:col-span-3 rounded-2xl text-slate-100")}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">
              Applicant Pipeline
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Track progression across each recruitment stage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipeline.map((stage) => {
              const Icon = pipelineIcons[stage.key] ?? FileStack;
              return (
                <div
                  key={stage.key}
                  className={withUniversitySurfaceTint("rounded-xl p-4")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={withUniversitySurfaceSubtle("inline-flex h-9 w-9 items-center justify-center rounded-xl")}>
                        <Icon className="h-4 w-4 text-blue-300" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {stage.label}
                        </p>
                        <p className="text-xs text-slate-400">{stage.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {formatNumber(stage.count)}
                      </p>
                      <p className="text-xs text-slate-400">{stage.percentage}% of total</p>
                    </div>
                  </div>
                  <Progress value={stage.percentage} className="mt-3 h-2 bg-blue-900/60" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className={withUniversityCardStyles("lg:col-span-2 rounded-2xl text-slate-100")}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">
              Conversion Health
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Offer-to-enrolment conversion funnel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversion.map((metric) => (
              <div
                key={metric.key}
                className={withUniversitySurfaceTint("rounded-xl p-4 bg-blue-950/50")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{metric.label}</p>
                    <p className="text-xs text-slate-400">{metric.description}</p>
                  </div>
                  <p className="text-2xl font-semibold text-emerald-300">
                    {metric.value}%
                  </p>
                </div>
                <Progress value={metric.value} className="mt-3 h-2 bg-blue-900/60" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ApplicationSourcesChart data={countrySummary} />
        <ApplicationStatusChart data={statusSummary} />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className={withUniversityCardStyles("lg:col-span-3 rounded-2xl text-slate-100")}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-medium text-slate-300">
                  Recent Applications
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Latest five submissions across your programs
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-300" asChild>
                <Link to="/university/applications">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <StatePlaceholder
                icon={<CalendarPlus className="h-8 w-8 text-slate-500" />}
                title="No applications yet"
                description="Your most recent applications will appear here once agents or students submit them."
                className="bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-blue-900/50 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="py-2">Application</th>
                      <th className="py-2">Student</th>
                      <th className="py-2">Program</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentApplications.map((application) => (
                      <tr key={application.id} className="text-slate-300">
                        <td className="py-3 font-medium text-white">
                          {application.appNumber}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span>{application.studentName}</span>
                            <span className="text-xs text-slate-500">
                              {application.studentNationality}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span>{application.programName}</span>
                            <span className="text-xs text-slate-500">
                              {application.programLevel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={application.status} />
                        </td>
                        <td className="py-3 text-right text-sm text-slate-400">
                          {formatDate(application.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={withUniversityCardStyles("lg:col-span-2 rounded-2xl text-slate-100")}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">
              Document Requests Snapshot
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Prioritise outstanding uploads to keep applications moving
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={withUniversitySurfaceTint("flex items-center justify-between rounded-xl p-4 bg-blue-950/50")}>
              <div>
                <p className="text-sm font-semibold text-white">Pending requests</p>
                <p className="text-xs text-slate-400">
                  Awaiting student or agent uploads
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-amber-500/50 bg-amber-500/10 text-amber-200"
              >
                {formatNumber(metrics.pendingDocuments)}
              </Badge>
            </div>
            <div className={withUniversitySurfaceTint("flex items-center justify-between rounded-xl p-4 bg-blue-950/50")}>
              <div>
                <p className="text-sm font-semibold text-white">Documents received</p>
                <p className="text-xs text-slate-400">
                  Ready for compliance verification
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
              >
                {formatNumber(metrics.receivedDocuments)}
              </Badge>
            </div>
            <div className={withUniversitySurfaceTint("rounded-xl p-4 bg-blue-950/50")}>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Latest requests
              </p>
              <div className="mt-3 space-y-3">
                {documentRequests.slice(0, 3).length === 0 ? (
                  <p className="text-sm text-slate-500">
                    All document requests are up to date.
                  </p>
                ) : (
                  documentRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-3 text-sm text-slate-300"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {request.studentName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {request.requestType}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-blue-900/50 bg-blue-950/60 text-xs"
                      >
                        {request.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full justify-between text-blue-300 hover:text-white"
                asChild
              >
                <Link to="/university/documents">
                  Review document queue <span aria-hidden>→</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default OverviewPage;
