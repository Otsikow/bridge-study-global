import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/university/panels/MetricCard";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";
import { GraduationCap, Stamp, CheckCircle2 } from "lucide-react";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const OffersCasPage = () => {
  const { data } = useUniversityDashboard();
  const applications = data?.applications ?? [];

  const offerStatuses = ["conditional_offer", "unconditional_offer"];
  const casStatuses = ["cas_loa", "visa"];
  const enrolledStatuses = ["enrolled"];

  const offerPipeline = applications.filter((app) =>
    offerStatuses.includes(app.status.toLowerCase()),
  );
  const casPipeline = applications.filter((app) =>
    casStatuses.includes(app.status.toLowerCase()),
  );
  const enrolledStudents = applications.filter((app) =>
    enrolledStatuses.includes(app.status.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Offers & CAS</h1>
        <p className="text-sm text-slate-400">
          Monitor offers issued, CAS preparation, and enrolment progress for your
          upcoming intakes.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          label="Offers issued"
          value={offerPipeline.length}
          description="Conditional and unconditional offers sent"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />
        <MetricCard
          label="CAS & Visa in progress"
          value={casPipeline.length}
          description="Students completing CAS or visa steps"
          icon={<Stamp className="h-5 w-5" />}
          tone="info"
        />
        <MetricCard
          label="Confirmed enrolments"
          value={enrolledStudents.length}
          description="Students ready for arrival and onboarding"
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </section>

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-100">
            Offer pipeline
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Offers issued to prospective students. Follow up to secure CAS
            documentation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offerPipeline.length === 0 ? (
            <StatePlaceholder
              title="No offers issued yet"
              description="Once offers are issued to students, they will appear here for tracking."
              className="bg-transparent"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2">Application</th>
                    <th className="py-2">Student</th>
                    <th className="py-2">Programme</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {offerPipeline.map((application) => (
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

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                CAS & visa preparation
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Students currently preparing CAS or visa packaging before enrolment.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-blue-500/40 bg-blue-500/10 text-blue-100"
            >
              {casPipeline.length} active cases
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {casPipeline.length === 0 ? (
            <StatePlaceholder
              title="No CAS or visa cases in progress"
              description="As soon as students move into the CAS or visa stage, they will appear here for monitoring."
              className="bg-transparent"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Programme</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {casPipeline.map((application) => (
                    <tr key={application.id} className="text-slate-300">
                      <td className="py-3 font-medium text-white">
                        {application.studentName}
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
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-300 hover:text-white"
                        >
                          View checklist
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                Confirmed enrolments
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Students who have confirmed enrolment for your next intake.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
            >
              {enrolledStudents.length} confirmed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {enrolledStudents.length === 0 ? (
            <StatePlaceholder
              title="No confirmed enrolments yet"
              description="Keep tracking your offer conversions to move students into confirmed enrolment."
              className="bg-transparent"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Programme</th>
                    <th className="py-2">Application</th>
                    <th className="py-2 text-right">Enrolment date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {enrolledStudents.map((application) => (
                    <tr key={application.id} className="text-slate-300">
                      <td className="py-3 font-medium text-white">
                        {application.studentName}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span>{application.programName}</span>
                          <span className="text-xs text-slate-500">
                            {application.programLevel}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-slate-400">
                        {application.appNumber}
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
    </div>
  );
};

export default OffersCasPage;
