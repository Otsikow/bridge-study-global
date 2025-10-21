import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, CreditCard, Download } from 'lucide-react';

const payments = [
  { id: 'INV-2041', date: '2025-08-01', description: 'Application Fee - University of Toronto', amount: 120, status: 'Paid' },
  { id: 'INV-2042', date: '2025-09-15', description: 'Tuition Deposit - UBC', amount: 500, status: 'Pending' },
  { id: 'INV-2043', date: '2025-10-01', description: 'Visa Processing', amount: 80, status: 'Paid' },
];

export default function Payments() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Manage your invoices and payment methods</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><CreditCard className="h-4 w-4" /> Add Payment Method</Button>
            <Button className="gap-2"><Download className="h-4 w-4" /> Export</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-xl border shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$500</div>
              <p className="text-sm text-muted-foreground">Due next month</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">$200</div>
              <p className="text-sm text-muted-foreground">Across 2 invoices</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Next Due Date</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-foreground"><Calendar className="h-5 w-5" /> Nov 15, 2025</div>
              <p className="text-sm text-muted-foreground">Tuition Deposit - UBC</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.id}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell className="min-w-[240px]">{p.description}</TableCell>
                      <TableCell className="text-right">${p.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'Paid' ? 'default' : 'secondary'}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
