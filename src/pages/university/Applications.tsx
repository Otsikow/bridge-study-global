import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "screening", label: "Screening" },
  { value: "conditional_offer", label: "Conditional Offer" },
  { value: "unconditional_offer", label: "Unconditional Offer" },
  { value: "cas_loa", label: "CAS / LOA" },
  { value: "visa", label: "Visa Stage" },
  { value: "enrolled", label: "Enrolled" },
  { value: "withdrawn", label: "Withdrawn" },
];

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const ApplicationsPage = () => {
  const { data } = useUniversityDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const programs = data?.programs ?? [];
  const applications = data?.applications ?? [];

  const filteredApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesProgram =
        programFilter === "all" || application.programId === programFilter;
      const matchesStatus =
        statusFilter === "all" ||
        application.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesTerm =
        term.length === 0 ||
        application.appNumber.toLowerCase().includes(term) ||
        application.studentName.toLowerCase().includes(term) ||
        application.programName.toLowerCase().includes(term);

      return matchesProgram && matchesStatus && matchesTerm;
    });
  }, [applications, programFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Applications</h1>
        <p className="text-sm text-slate-400">
          Review, filter, and monitor applications submitted to your programmes.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="space-y-4 lg:flex lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="text-base font-semibold text-slate-100">
              Application library
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {filteredApplications.length} of {applications.length} applications
              shown
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by student, program, or app number"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <StatePlaceholder
              title="No applications yet"
              description="Once agents submit applications to your programmes, they will populate here."
              className="bg-transparent"
            />
          ) : filteredApplications.length === 0 ? (
            <StatePlaceholder
              title="No applications match your filters"
              description="Adjust the filters or search term to view more results."
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
                    <th className="py-2">Documents</th>
                    <th className="py-2 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredApplications.map((application) => {
                    const documentsPending =
                      data?.documentRequests.filter(
                        (request) => request.studentId === application.studentId,
                      ).length ?? 0;

                    return (
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
                        <td className="py-3">
                          {documentsPending > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/60 bg-amber-500/10 text-amber-100"
                            >
                              {documentsPending} pending
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                            >
                              Complete
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-right text-sm text-slate-400">
                          {formatDate(application.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationsPage;
