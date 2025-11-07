import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationSourcesChart } from "@/components/university/panels/ApplicationSourcesChart";
import { ApplicationStatusChart } from "@/components/university/panels/ApplicationStatusChart";
import { EmptyState } from "@/components/common/EmptyState";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";

const AnalyticsPage = () => {
  const { data } = useUniversityDashboard();

  const applications = data?.applications ?? [];
  const programs = data?.programs ?? [];
  const agents = data?.agents ?? [];

  const programCounts = programs.map((program) => {
    const total = applications.filter(
      (application) => application.programId === program.id,
    ).length;
    const offers = applications.filter(
      (application) =>
        application.programId === program.id &&
        ["conditional_offer", "unconditional_offer"].includes(
          application.status.toLowerCase(),
        ),
    ).length;
    const acceptanceRate = total > 0 ? Math.round((offers / total) * 100) : 0;

    return {
      program,
      total,
      offers,
      acceptanceRate,
    };
  });

  const topPrograms = programCounts
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topAgents = [...agents]
    .sort((a, b) => b.referralCount - a.referralCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-slate-400">
          Understand your recruitment performance across markets, programmes, and
          partner agents.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <ApplicationSourcesChart data={data?.countrySummary ?? []} />
        <ApplicationStatusChart data={data?.statusSummary ?? []} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-100">
              Top programmes by demand
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Programmes attracting the highest number of applications and their
              offer conversion rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPrograms.length === 0 ? (
              <EmptyState
                title="No programme analytics yet"
                description="As soon as applications arrive for your programmes, performance data will appear here."
                variant="plain"
                className="bg-transparent justify-center"
                fullHeight
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="py-2">Programme</th>
                      <th className="py-2">Applications</th>
                      <th className="py-2">Offers</th>
                      <th className="py-2 text-right">Acceptance rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topPrograms.map(({ program, total, offers, acceptanceRate }) => (
                      <tr key={program.id} className="text-slate-300">
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {program.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {program.level} · {program.discipline}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">{total}</td>
                        <td className="py-3">{offers}</td>
                        <td className="py-3 text-right">
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                          >
                            {acceptanceRate}%
                          </Badge>
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
            <CardTitle className="text-base font-semibold text-slate-100">
              Agent contribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Leading partner agents and the number of applications referred.
            </CardDescription>
          </CardHeader>
            <CardContent>
              {topAgents.length === 0 ? (
                <EmptyState
                  title="No agent data yet"
                  description="Connect with GEG partner agents to start receiving referred applications."
                  variant="plain"
                  className="bg-transparent justify-center"
                  fullHeight
                />
              ) : (
              <div className="space-y-3">
                {topAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/50 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {agent.companyName || agent.contactName}
                      </p>
                      <p className="text-xs text-slate-500">{agent.contactEmail}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-500/40 bg-blue-500/10 text-blue-100"
                    >
                      {agent.referralCount} applications
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AnalyticsPage;
