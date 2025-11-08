import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeads } from "@/hooks/useLeads";
import LeadTableRow from "./LeadTableRow";

export default function LeadsList() {
  const { data: leads, isLoading, error } = useLeads();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Leads</CardTitle>
        <CardDescription>Manage your student leads</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of your leads.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads?.map((lead) => (
              <LeadTableRow key={lead.id} lead={lead} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
