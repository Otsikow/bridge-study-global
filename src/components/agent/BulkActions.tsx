import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useDeleteLeads } from "@/hooks/useDeleteLeads";

interface BulkActionsProps {
  selectedCount: number;
  selectedLeadIds: string[];
}

export default function BulkActions({
  selectedCount,
  selectedLeadIds,
}: BulkActionsProps) {
  const deleteLeadsMutation = useDeleteLeads();

  if (selectedCount === 0) {
    return null;
  }

  const handleDelete = () => {
    deleteLeadsMutation.mutate(selectedLeadIds);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Actions <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
