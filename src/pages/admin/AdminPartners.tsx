import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, GraduationCap, Mail, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type AgentRow = {
  id: string;
  company_name: string | null;
  active: boolean | null;
  commission_rate_l1: number | null;
  verification_status: string | null;
  profile_id: string;
  profile?: {
    email: string | null;
    full_name: string | null;
  } | null;
};

type UniversityRow = {
  id: string;
  name: string;
  country: string;
  partnership_status: string | null;
  active: boolean | null;
};

type ApplicationRow = {
  id: string;
  agent_id: string | null;
  student_id: string | null;
  status: string | null;
  program: {
    id: string;
    university_id: string | null;
    name: string | null;
  } | null;
};

type ProgramRow = {
  id: string;
  university_id: string;
  active: boolean | null;
};

type AgentCard = {
  id: string;
  companyName: string;
  email: string;
  activeStudents: number;
  performanceScore: number;
  commissionRate: number | null;
  verificationStatus: string;
  isActive: boolean;
  profileId: string;
};

type UniversityCard = {
  id: string;
  name: string;
  country: string;
  programsOffered: number;
  totalApplications: number;
  conversionRate: number;
  partnershipStatus: string;
  isActive: boolean;
};

const successStatuses = ["conditional_offer", "unconditional_offer", "cas_loa", "visa", "enrolled"];

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
};

type AdminPartnersProps = {
  defaultTab?: "agents" | "universities";
};

const AdminPartners = ({ defaultTab = "agents" }: AdminPartnersProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadPartners = async () => {
      if (!tenantId) {
        if (isMounted) {
          setAgents([]);
          setUniversities([]);
          setApplications([]);
          setPrograms([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const [agentResponse, universityResponse, applicationResponse, programResponse] = await Promise.all([
          supabase
            .from("agents")
            .select(
              "id, company_name, active, commission_rate_l1, verification_status, profile_id, tenant_id, profile:profiles(email, full_name)"
            )
            .eq("tenant_id", tenantId),
          supabase
            .from("universities")
            .select("id, name, country, partnership_status, active, tenant_id")
            .eq("tenant_id", tenantId),
          supabase
            .from("applications")
            .select("id, status, agent_id, student_id, tenant_id, program:programs(id, university_id, name)")
            .eq("tenant_id", tenantId),
          supabase
            .from("programs")
            .select("id, university_id, active, tenant_id")
            .eq("tenant_id", tenantId),
        ]);

        if (!isMounted) return;

        if (agentResponse.error) throw agentResponse.error;
        if (universityResponse.error) throw universityResponse.error;
        if (applicationResponse.error) throw applicationResponse.error;
        if (programResponse.error) throw programResponse.error;

        setAgents((agentResponse.data as AgentRow[]) ?? []);
        setUniversities((universityResponse.data as UniversityRow[]) ?? []);
        setApplications((applicationResponse.data as ApplicationRow[]) ?? []);
        setPrograms((programResponse.data as ProgramRow[]) ?? []);
      } catch (error) {
        console.error("Failed to load partner management data", error);
        toast({
          title: "Unable to load partners",
          description: "We couldn't fetch the latest partner data. Please try again shortly.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPartners();

    return () => {
      isMounted = false;
    };
  }, [tenantId, toast]);

  const agentCards = useMemo<AgentCard[]>(() => {
    if (agents.length === 0) return [];

    return agents.map((agent) => {
      const agentApplications = applications.filter((application) => application.agent_id === agent.id);
      const uniqueStudents = new Set(agentApplications.map((application) => application.student_id ?? ""));
      uniqueStudents.delete("");
      const successful = agentApplications.filter((application) =>
        successStatuses.includes((application.status ?? "").toLowerCase())
      );
      const performance = agentApplications.length > 0 ? (successful.length / agentApplications.length) * 100 : 0;

      return {
        id: agent.id,
        companyName: agent.company_name ?? agent.profile?.full_name ?? "Unnamed Agency",
        email: agent.profile?.email ?? "—",
        activeStudents: uniqueStudents.size,
        performanceScore: Number.isFinite(performance) ? performance : 0,
        commissionRate: agent.commission_rate_l1,
        verificationStatus: (agent.verification_status ?? "unverified").replace(/_/g, " "),
        isActive: agent.active ?? false,
        profileId: agent.profile_id,
      };
    });
  }, [agents, applications]);

  const universityCards = useMemo<UniversityCard[]>(() => {
    if (universities.length === 0) return [];

    return universities.map((university) => {
      // Count actual programs for this university (only active ones)
      const universityPrograms = programs.filter(
        (program) => program.university_id === university.id && program.active !== false
      );

      const universityApplications = applications.filter(
        (application) => application.program?.university_id === university.id
      );
      const successful = universityApplications.filter((application) =>
        successStatuses.includes((application.status ?? "").toLowerCase())
      );
      const conversion =
        universityApplications.length > 0 ? (successful.length / universityApplications.length) * 100 : 0;

      return {
        id: university.id,
        name: university.name,
        country: university.country,
        programsOffered: universityPrograms.length,
        totalApplications: universityApplications.length,
        conversionRate: Number.isFinite(conversion) ? conversion : 0,
        partnershipStatus: (university.partnership_status ?? "pending").replace(/_/g, " "),
        isActive: university.active ?? false,
      };
    });
  }, [universities, applications, programs]);

  const handleAgentToggle = async (agentId: string, currentState: boolean) => {
    const nextState = !currentState;
    const previous = agents;
    setAgents((prev) => prev.map((agent) => (agent.id === agentId ? { ...agent, active: nextState } : agent)));

    const { error } = await supabase.from("agents").update({ active: nextState }).eq("id", agentId);

    if (error) {
      console.error("Failed to update agent status", error);
      setAgents(previous);
      toast({
        title: "Update failed",
        description: "We couldn't update the agent status. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: nextState ? "Agent activated" : "Agent suspended",
      description: "The agent status has been updated successfully.",
    });
  };

  const handleUniversityStatus = async (universityId: string, currentStatus: string) => {
    const normalizedStatus = currentStatus.toLowerCase();
    const nextStatus = normalizedStatus === "approved" ? "suspended" : "approved";
    const nextIsActive = nextStatus === "approved";
    const previous = universities;

    setUniversities((prev) =>
      prev.map((university) =>
        university.id === universityId
          ? { ...university, partnership_status: nextStatus, active: nextIsActive }
          : university
      )
    );

    const { error } = await supabase
      .from("universities")
      .update({ partnership_status: nextStatus, active: nextIsActive })
      .eq("id", universityId);

    if (error) {
      console.error("Failed to update university status", error);
      setUniversities(previous);
      toast({
        title: "Update failed",
        description: "We couldn't update the partnership status. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: nextStatus === "approved" ? "Partnership approved" : "Partnership suspended",
      description: "The partnership status has been updated successfully.",
    });
  };

  const renderAgentSkeletons = () => (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2 p-3 sm:p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent className="space-y-3 p-3 sm:p-4 pt-0">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderUniversitySkeletons = () => (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2 p-3 sm:p-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent className="space-y-3 p-3 sm:p-4 pt-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Partner management</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Govern agency and university relationships with clear performance and status signals.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 sm:w-auto"
          onClick={() =>
            typeof window !== "undefined" &&
            window.dispatchEvent(
              new CustomEvent("zoe:open-chat", {
                detail: {
                  prompt: "Highlight partner accounts needing executive attention",
                },
              })
            )
          }
        >
          <Users className="h-4 w-4" />
          Partner briefing
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="agents" className="flex-1 sm:flex-none">
            Agents
          </TabsTrigger>
          <TabsTrigger value="universities" className="flex-1 sm:flex-none">
            Universities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Agency partners
              </CardTitle>
              <CardDescription>Monitor agent throughput, quality, and operational readiness.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                renderAgentSkeletons()
              ) : agentCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">No agent partners found for this tenant.</p>
              ) : (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {agentCards.map((agent) => (
                    <Card key={agent.id} className="border-muted">
                      <CardHeader className="space-y-2 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-base font-semibold truncate">{agent.companyName}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-xs truncate">
                              <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                              <span className="truncate">{agent.email}</span>
                            </CardDescription>
                          </div>
                          <Badge variant={agent.isActive ? "outline" : "destructive"} className="text-xs shrink-0">
                            {agent.isActive ? "Active" : "Suspended"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">{agent.activeStudents} students</Badge>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">{formatPercent(agent.performanceScore)}</Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {agent.commissionRate !== null ? `${agent.commissionRate}%` : "—"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 text-sm p-3 sm:p-4 pt-0">
                        <div className="flex items-center justify-between">
                          <span className="capitalize text-muted-foreground text-xs sm:text-sm">{agent.verificationStatus}</span>
                          <Switch
                            checked={agent.isActive}
                            onCheckedChange={() => handleAgentToggle(agent.id, agent.isActive)}
                            aria-label={`Toggle agent ${agent.companyName} status`}
                          />
                        </div>
                        <Button asChild variant="secondary" size="sm" className="w-full">
                          <Link to={`/admin/users?profile=${agent.profileId}`}>View profile</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="universities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                University partners
              </CardTitle>
              <CardDescription>Track institutional reach and conversion health across markets.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                renderUniversitySkeletons()
              ) : universityCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">No university partnerships available yet.</p>
              ) : (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {universityCards.map((university) => {
                    const normalizedStatus = university.partnershipStatus.toLowerCase();
                    const shouldSuspend = normalizedStatus === "approved";

                    return (
                      <Card key={university.id} className="border-muted">
                        <CardHeader className="space-y-2 p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-sm sm:text-base font-semibold truncate">{university.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1 text-xs">
                                <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                {university.country}
                              </CardDescription>
                            </div>
                            <Badge variant={university.isActive ? "outline" : "destructive"} className="text-xs shrink-0">
                              {university.isActive ? "Active" : "Suspended"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">{university.programsOffered} programs</Badge>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">{university.totalApplications} apps</Badge>
                            <Badge variant="outline" className="text-[10px] sm:text-xs">{formatPercent(university.conversionRate)}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 text-sm p-3 sm:p-4 pt-0">
                          <span className="capitalize text-muted-foreground text-xs sm:text-sm">Status: {university.partnershipStatus}</span>
                          <Button
                            variant={shouldSuspend ? "destructive" : "default"}
                            size="sm"
                            className="w-full"
                            onClick={() => handleUniversityStatus(university.id, university.partnershipStatus)}
                          >
                            {shouldSuspend ? "Suspend" : "Approve Partnership"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPartners;
