import { useApplicationDrafts } from "@/hooks/useApplicationDrafts";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";

const TOTAL_STEPS = 10;

interface ApplicationProgressProps {
  studentId: string;
}

export default function ApplicationProgress({
  studentId,
}: ApplicationProgressProps) {
  const {
    data: drafts,
    isLoading,
    error,
  } = useApplicationDrafts(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive py-2">
        <AlertCircle className="h-4 w-4" />
        <span>Unable to load progress</span>
      </div>
    );
  }

  if (!drafts || drafts.length === 0) {
    return <div>No application drafts found.</div>;
  }

  const draft = drafts[0];
  const progress = (draft.last_step / TOTAL_STEPS) * 100;

  return (
    <div>
      <h2 className="text-lg font-semibold">Application Progress</h2>
      <div className="space-y-2 mt-2">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground">
          Last updated{" "}
          {formatDistanceToNow(new Date(draft.updated_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
