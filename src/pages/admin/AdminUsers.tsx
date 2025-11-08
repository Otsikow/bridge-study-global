import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface RoleSummary {
  role: string;
  users: number;
}

const AdminUsers = () => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Tables<"profiles">[]>([]);
  const [roleSummary, setRoleSummary] = useState<RoleSummary[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      if (!tenantId) {
        if (isMounted) {
          setRows([]);
          setRoleSummary([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, created_at, active")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        if (!isMounted) return;

        setRows((data ?? []) as any);
        const summary = new Map<string, number>();
        for (const item of data ?? []) {
          summary.set(item.role, (summary.get(item.role) ?? 0) + 1);
        }
        setRoleSummary(Array.from(summary.entries()).map(([role, users]) => ({ role, users })));
      } catch (error) {
        console.error("Failed to load admin user list", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadUsers();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User governance</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage administrative identities with centralized auditing.
          </p>
        </div>
        <Button
          onClick={() =>
            typeof window !== "undefined" &&
            window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt: "Outline role assignment gaps" } }))
          }
        >
          Ask Zoe for a gap analysis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role distribution</CardTitle>
          <CardDescription>Snapshot of active accounts by privilege level.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {loading && <Skeleton className="h-12 w-32" />}
          {!loading &&
            roleSummary.map((role) => (
              <Badge key={role.role} variant="outline" className="px-4 py-2 text-sm">
                <span className="font-semibold">{role.users}</span>
                <span className="ml-2 uppercase tracking-wide text-xs text-muted-foreground">{role.role}</span>
              </Badge>
            ))}
          {!loading && roleSummary.length === 0 && <p className="text-sm text-muted-foreground">No roles assigned yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
          <CardDescription>Key account holders with administrative or elevated permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No administrator records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {rows.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-2 font-medium">{user.full_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-2 uppercase tracking-wide text-xs">{user.role}</td>
                      <td className="px-4 py-2">
                        <Badge variant={user.active ? "outline" : "destructive"}>{user.active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
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

export default AdminUsers;
