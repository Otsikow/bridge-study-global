import { useMemo, useState } from "react";
import { Loader2, FileDown } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusFilters = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
];

const formatStatus = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const DocumentsPage = () => {
  const { data, refetch } = useUniversityDashboard();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const documentRequests = data?.documentRequests ?? [];

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return documentRequests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" ||
        request.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesTerm =
        term.length === 0 ||
        request.studentName.toLowerCase().includes(term) ||
        request.requestType.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [documentRequests, searchTerm, statusFilter]);

  const handleMarkReceived = async (requestId: string) => {
    try {
      setUpdatingId(requestId);
      const { error } = await supabase
        .from("document_requests")
        .update({ status: "received" })
        .eq("id", requestId);

      if (error) {
        throw error;
      }

      toast({
        title: "Document received",
        description: "The request has been marked as complete.",
      });

      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to update request",
        description:
          (error as Error)?.message ??
          "Please try again or contact your GEG partnership manager.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Document requests</h1>
        <p className="text-sm text-slate-400">
          Track outstanding document requests and update their status as files are
          received.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="space-y-4 lg:flex lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="text-base font-semibold text-slate-100">
              Requests queue
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {filteredRequests.length} of {documentRequests.length} requests
              displayed
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Search by student or request type"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="text-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
        {documentRequests.length === 0 ? (
          <EmptyState
            title="No document requests yet"
            description="When a document is requested from a student or agent, it will appear here for follow-up."
            variant="plain"
            className="bg-transparent justify-center"
            fullHeight
          />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No requests match your filters"
            description="Adjust the filters to view additional document requests."
            variant="plain"
            className="bg-transparent justify-center"
            fullHeight
          />
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Request</th>
                    <th className="py-2">Requested</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="text-slate-300">
                      <td className="py-3 font-medium text-white">
                        {request.studentName}
                      </td>
                      <td className="py-3">{request.requestType}</td>
                      <td className="py-3 text-sm text-slate-500">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            request.status === "received"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                              : "border-amber-500/50 bg-amber-500/10 text-amber-100"
                          }
                        >
                          {formatStatus(request.status)}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {request.documentUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-blue-300 hover:text-white"
                              asChild
                            >
                              <a
                                href={request.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FileDown className="h-4 w-4" />
                                View
                              </a>
                            </Button>
                          ) : null}
                          {request.status !== "received" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                              onClick={() => void handleMarkReceived(request.id)}
                              disabled={updatingId === request.id}
                            >
                              {updatingId === request.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating
                                </>
                              ) : (
                                "Mark received"
                              )}
                            </Button>
                          ) : null}
                        </div>
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

export default DocumentsPage;
