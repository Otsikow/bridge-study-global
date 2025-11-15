import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, CreditCard, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/LoadingState';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  purpose: string;
  receipt_url: string | null;
  created_at: string;
  application_id: string | null;
  stripe_payment_intent: string | null;
  applications?: {
    programs: {
      name: string;
      universities: {
        name: string;
      };
    };
  };
}

export function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Get student ID first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        setLoading(false);
        return;
      }

      // Fetch applications for this student
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentData.id);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
      }

      const applicationIds = applicationsData?.map(app => app.id) || [];

      // Fetch payments for these applications
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          applications (
            programs (
              name,
              universities (
                name
              )
            )
          )
        `)
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payments',
          variant: 'destructive',
        });
      } else {
        setPayments(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    // Placeholder for Stripe payment integration
    toast({
      title: 'Payment Gateway',
      description: 'Stripe payment integration will be implemented here',
    });
  };

  const formatAmount = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      succeeded: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      application_fee: 'Application Fee',
      service_fee: 'Service Fee',
      deposit: 'Deposit',
      tuition: 'Tuition',
      other: 'Other',
    };
    return labels[purpose] || purpose;
  };

  const totalPaid = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const nextDueDate = payments.find((p) => p.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading payment history..." />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="pointer-events-none absolute -top-20 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="space-y-2 relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Billing Center</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Payments Overview
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Keep track of invoices, monitor your outstanding balance, and download payment receipts in one place.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Paid</p>
                <p className="text-lg font-semibold text-success">
                  {formatAmount(totalPaid, payments[0]?.currency || 'USD')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Due</p>
                <p className="text-lg font-semibold text-foreground">
                  {nextDueDate ? formatDate(nextDueDate.created_at) : 'No pending payments'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            className="group flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border-primary/40 bg-primary/5 text-primary transition hover:border-primary/60 hover:bg-primary/10 sm:w-auto"
            onClick={initiatePayment}
          >
            <CreditCard className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Make a Payment</span>
          </Button>
          <Button className="group flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl sm:w-auto">
            <Download className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Export History</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold">
              {formatAmount(totalPending, payments[0]?.currency || 'USD')}
            </div>
            <p className="text-sm text-muted-foreground">
              {payments.filter((p) => p.status === 'pending').length} pending payment(s)
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold text-success">
              {formatAmount(totalPaid, payments[0]?.currency || 'USD')}
            </div>
            <p className="text-sm text-muted-foreground">
              Across {payments.filter((p) => p.status === 'succeeded').length} invoice(s)
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Next Due Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {nextDueDate ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-success" />
                  {formatDate(nextDueDate.created_at)}
                </div>
                <p className="text-sm text-muted-foreground">{getPurposeLabel(nextDueDate.purpose)}</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No pending payments</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.created_at)}</TableCell>
                      <TableCell className="min-w-[240px]">
                        <div>
                          <div className="font-medium">{getPurposeLabel(payment.purpose)}</div>
                          {payment.applications?.programs && (
                            <div className="text-sm text-muted-foreground">
                              {payment.applications.programs.name} at{' '}
                              {payment.applications.programs.universities?.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(payment.amount_cents, payment.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        {payment.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => window.open(payment.receipt_url!, '_blank')}
                          >
                            Receipt <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
