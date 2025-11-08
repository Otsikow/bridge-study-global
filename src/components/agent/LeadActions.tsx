import { Button } from "@/components/ui/button";
import { Lead } from "@/types/lead";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { useDeleteLead } from "@/hooks/useDeleteLead";

interface LeadActionsProps {
  lead: Lead;
}

export default function LeadActions({ lead }: LeadActionsProps) {
  const deleteLeadMutation = useDeleteLead();

  const handleDelete = () => {
    deleteLeadMutation.mutate(lead.id);
  };

  return (
    <div className="space-x-2">
      <Button variant="outline" size="sm">
        View
      </Button>
      <Button variant="outline" size="sm">
        Edit
      </Button>
      <ConfirmDeleteDialog onConfirm={handleDelete} />
    </div>
  );
}
