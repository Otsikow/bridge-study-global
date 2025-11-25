import { useEffect, useMemo, useState } from "react";
import { Activity, Mail, Timer, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface UsageEventSnapshot {
  user_id: string | null;
  created_at: string;
  event_type: string | null;
}

interface UsageSnapshot {
  profile: Tables<"profiles">;
  eventsLastHour: number;
  eventsLastDay: number;
  lastActive?: string;
}

const UsageMonitoring = () => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [events, setEvents] = useState<UsageEventSnapshot[]>([]);

  const cutoffOneDay = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000), []);
  const cutoffOneHour = useMemo(() => new Date(Date.now() - 60 * 60 * 1000), []);

  useEffect(() => {
    let isMounted = true;

    const loadUsage = async () => {
      if (!tenantId) {
        setProfiles([]);
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const sinceIso = cutoffOneDay.toISOString();

        const [{ data: profileRows, error: profilesError }, { data: eventRows, error: eventsError }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, role, created_at, active, tenant_id").eq("tenant_id", tenantId),
          supabase
            .from("analytics_events")
            .select("user_id, created_at, event_type")
            .eq("tenant_id", tenantId)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false }),
        ]);

        if (profilesError) throw profilesError;
        if (eventsError) throw eventsError;
        if (!isMounted) return;

        setProfiles(profileRows ?? []);
        setEvents((eventRows ?? []) as UsageEventSnapshot[]);
      } catch (error) {
        console.error("Failed to load usage monitoring data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadUsage();
    return () => {
      isMounted = false;
    };
  }, [tenantId, cutoffOneDay]);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("usage-monitoring-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_events",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newEvent = payload.new as UsageEventSnapshot;
          setEvents((prev) => {
            const updated = [newEvent, ...prev];
            return updated.filter((event) => new Date(event.created_at) >= cutoffOneDay);
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, cutoffOneDay]);

  const usageSnapshots = useMemo<UsageSnapshot[]>(() => {
    const cutoffHourIso = cutoffOneHour.toISOString();
    const cutoffDayIso = cutoffOneDay.toISOString();

    return profiles.map((user) => {
      const userEvents = events.filter((event) => event.user_id === user.id);
      const eventsLastHour = userEvents.filter((event) => event.created_at >= cutoffHourIso).length;
      const eventsLastDay = userEvents.filter((event) => event.created_at >= cutoffDayIso).length;
      const lastActive = userEvents[0]?.created_at;

      return {
        profile: user,
        eventsLastHour,
        eventsLastDay,
        lastActive,
      };
    });
  }, [profiles, events, cutoffOneDay, cutoffOneHour]);

  const maxDailyActivity = useMemo(() => {
    return usageSnapshots.reduce((max, snapshot) => Math.max(max, snapshot.eventsLastDay), 0) || 1;
  }, [usageSnapshots]);

  const aggregateMetrics = useMemo(() => {
    const totalEvents = events.length;
    const activeNow = usageSnapshots.filter((snapshot) => {
      if (!snapshot.lastActive) return false;
      const lastActiveDate = new Date(snapshot.lastActive);
      return Date.now() - lastActiveDate.getTime() <= 10 * 60 * 1000;
    }).length;

    const engagedUsers = usageSnapshots.filter((snapshot) => snapshot.eventsLastDay > 0).length;

    return { totalEvents, activeNow, engagedUsers };
  }, [events, usageSnapshots]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usage Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Real-time visibility into platform engagement for your tenant. Data updates live from analytics events.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-4 w-4" />
          Live feed
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{aggregateMetrics.totalEvents}</div>}
            <p className="text-xs text-muted-foreground">Captured analytics events in the last 24 hours.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active now</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{aggregateMetrics.activeNow}</div>}
            <p className="text-xs text-muted-foreground">Users active in the last 10 minutes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engaged today</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{aggregateMetrics.engagedUsers}</div>}
            <p className="text-xs text-muted-foreground">Users with at least one event in the last day.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User activity</CardTitle>
          <CardDescription>Live event counts by user with most recent touchpoints.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!loading && usageSnapshots.length === 0 && (
            <p className="text-sm text-muted-foreground">No user records found for this tenant.</p>
          )}

          {!loading && usageSnapshots.length > 0 && (
            <div className="space-y-3">
              {usageSnapshots
                .sort((a, b) => b.eventsLastDay - a.eventsLastDay)
                .map((snapshot) => {
                  const activityPercent = Math.min((snapshot.eventsLastDay / maxDailyActivity) * 100, 100);
                  return (
                    <div
                      key={snapshot.profile.id}
                      className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{snapshot.profile.full_name}</p>
                          <Badge variant="secondary">{snapshot.profile.role}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{snapshot.profile.email}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Last active:</span> {" "}
                          {snapshot.lastActive ? formatDistanceToNow(new Date(snapshot.lastActive), { addSuffix: true }) : "—"}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 md:w-1/2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{snapshot.eventsLastDay} events (24h)</span>
                          <span className="text-muted-foreground">{snapshot.eventsLastHour} in last hour</span>
                        </div>
                        <Progress value={activityPercent} className="h-2" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>User ID: {snapshot.profile.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageMonitoring;
