import { TableCell, TableRow } from "@/components/ui/table";
import { Lead } from "@/types/lead";
import LeadActions from "./LeadActions";

interface LeadTableRowProps {
  lead: Lead;
}

export default function LeadTableRow({ lead }: LeadTableRowProps) {
  return (
    <TableRow>
      <TableCell>{`${lead.first_name} ${lead.last_name}`}</TableCell>
      <TableCell>{lead.email}</TableCell>
      <TableCell>{lead.country}</TableCell>
      <TableCell>{lead.status}</TableCell>
      <TableCell>
        <LeadActions lead={lead} />
      </TableCell>
    </TableRow>
  );
}
