import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeads } from "@/hooks/useLeads";
import LeadTableRow from "./LeadTableRow";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import BulkActions from "./BulkActions";

export default function LeadsList() {
  const { data: leads, isLoading, error } = useLeads();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads?.map((lead) => lead.id) || []);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelect = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const isAllSelected =
    leads?.length > 0 && selectedLeads.length === leads?.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Leads</CardTitle>
          <CardDescription>Manage your student leads</CardDescription>
        </div>
        <BulkActions
          selectedCount={selectedLeads.length}
          selectedLeadIds={selectedLeads}
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of your leads.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads?.map((lead) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.includes(lead.id)}
                onSelect={handleSelect}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
