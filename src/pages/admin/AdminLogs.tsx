import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AuditRecord {
  id: string;
  created_at: string;
  action: string;
  entity: string;
  severity?: string | null;
}

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminLogs = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  useEffect(() => {
    let mounted = true;

    const fetchLogs = async () => {
      if (!tenantId) {
        if (mounted) setRecords([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("id, created_at, action, entity")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        if (!mounted) return;
        setRecords(
          (data ?? []).map((item) => ({
            id: item.id,
            created_at: item.created_at,
            action: item.action,
            entity: item.entity,
          })),
        );
      } catch (error) {
        console.error("Failed to load audit logs", error);
      }
    };

    void fetchLogs();
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit & system logs</h1>
          <p className="text-sm text-muted-foreground">Investigate privileged operations and platform activity.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openZoe("Summarize critical audit events today") }>
          <Shield className="h-4 w-4" />
          Security digest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Recent audit events
          </CardTitle>
          <CardDescription>Raw log entries pulled from Supabase in real time.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{record.action}</p>
                    <p className="text-xs text-muted-foreground">{record.entity}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(record.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {records.length === 0 && <p className="p-4 text-sm text-muted-foreground">No audit records available.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;
