import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ProgramsPage = () => {
  const { data, refetch } = useUniversityDashboard();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const programs = data?.programs ?? [];

  const handleToggleActive = async (programId: string, active: boolean | null) => {
    try {
      setUpdatingId(programId);
      const { error } = await supabase
        .from("programs")
        .update({ active: !active })
        .eq("id", programId);
      if (error) {
        throw error;
      }
      toast({
        title: "Programme updated",
        description: `Programme is now ${!active ? "active" : "inactive"}.`,
      });
      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to update programme",
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
        <h1 className="text-2xl font-semibold text-white">Programmes</h1>
        <p className="text-sm text-slate-400">
          Manage your published courses and control which ones are visible to GEG
          agents and students.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-100">
            Programme catalogue
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {programs.length} programmes connected to your university profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
        {programs.length === 0 ? (
          <EmptyState
            title="No programmes found"
            description="Add programmes in Supabase or the partner administration portal to populate your catalogue."
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
                    <th className="py-2">Level</th>
                    <th className="py-2">Discipline</th>
                    <th className="py-2">Duration</th>
                    <th className="py-2">Tuition</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {programs.map((program) => (
                    <tr key={program.id} className="text-slate-300">
                      <td className="py-3 font-medium text-white">{program.name}</td>
                      <td className="py-3">{program.level}</td>
                      <td className="py-3">{program.discipline || "—"}</td>
                      <td className="py-3">
                        {program.duration_months
                          ? `${program.duration_months} months`
                          : "—"}
                      </td>
                      <td className="py-3">
                        {program.tuition_amount
                          ? `${program.tuition_currency ?? "USD"} ${program.tuition_amount.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Badge
                            variant="outline"
                            className={
                              program.active
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                                : "border-slate-700/70 bg-slate-900/70 text-slate-400"
                            }
                          >
                            {program.active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-300 hover:text-white"
                            onClick={() => void handleToggleActive(program.id, program.active)}
                            disabled={updatingId === program.id}
                          >
                            {updatingId === program.id ? "Updating..." : "Toggle"}
                          </Button>
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

export default ProgramsPage;
