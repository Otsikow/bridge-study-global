import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user?.id)
        .single();

      if (studentError || !studentData) {
        console.error("Error fetching student:", studentError);
        setLoading(false);
        return;
      }

      const { data: applicationsData } = await supabase
        .from("applications")
        .select("id")
        .eq("student_id", studentData.id);

      const applicationIds = applicationsData?.map((a) => a.id) || [];

      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          applications (
            programs (
              name,
              universities (
                name
              )
            )
          )
        `
        )
        .in("application_id", applicationIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
        toast({
          title: "Error",
          description: "Failed to load payments",
          variant: "destructive",
        });
      } else {
        setPayments(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    toast({
      title: "Payment Gateway",
      description: "Stripe integration will be added here",
    });
  };

  const formatAmount = (cents: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(cents / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      succeeded: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      application_fee: "Application Fee",
      service_fee: "Service Fee",
      deposit: "Deposit",
      tuition: "Tuition",
      other: "Other",
    };
    return labels[purpose] || purpose;
  };

  const totalPaid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const nextDueDate = payments.find((p) => p.status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading payment history..." />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 max-w-6xl mx-auto px-3 sm:px-6">
      {/* HEADER */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
            Billing Center
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
            Payments Overview
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            View invoices, track payments, and download receipts.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Total Paid
                </p>
                <p className="text-lg font-semibold text-success">
                  {formatAmount(totalPaid, payments[0]?.currency || "USD")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
              <Calendar className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Next Due
                </p>
                <p className="text-lg font-semibold">
                  {nextDueDate
                    ? formatDate(nextDueDate.created_at)
                    : "No pending payments"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            className="group flex items-center gap-2 rounded-xl"
            onClick={initiatePayment}
          >
            <CreditCard className="h-4 w-4 group-hover:scale-110" />
            Make a Payment
          </Button>

          <Button className="group flex items-center gap-2 rounded-xl">
            <Download className="h-4 w-4 group-hover:scale-110" />
            Export History
          </Button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-2xl border border-border/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatAmount(totalPending, payments[0]?.currency || "USD")}
            </p>
            <p className="text-sm text-muted-foreground">
              {payments.filter((p) => p.status === "pending").length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {formatAmount(totalPaid, payments[0]?.currency || "USD")}
            </p>
            <p className="text-sm text-muted-foreground">
              {
                payments.filter((p) => p.status === "succeeded").length
              }{" "}
              invoices paid
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Next Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextDueDate ? (
              <div>
                <p className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-success" />
                  {formatDate(nextDueDate.created_at)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getPurposeLabel(nextDueDate.purpose)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending payments
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PAYMENT HISTORY */}
      <Card className="rounded-2xl border border-border/60 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
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
                          <div className="font-medium">
                            {getPurposeLabel(payment.purpose)}
                          </div>
                          {payment.applications?.programs && (
                            <div className="text-sm text-muted-foreground">
                              {payment.applications.programs.name} —{" "}
                              {payment.applications.programs.universities?.name}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {formatAmount(
                          payment.amount_cents,
                          payment.currency
                        )}
                      </TableCell>

                      <TableCell>{getStatusBadge(payment.status)}</TableCell>

                      <TableCell className="text-right">
                        {payment.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              window.open(payment.receipt_url!, "_blank")
                            }
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
