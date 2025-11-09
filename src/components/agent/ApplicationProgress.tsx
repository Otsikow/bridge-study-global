import { useApplicationDrafts } from "@/hooks/useApplicationDrafts";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
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
