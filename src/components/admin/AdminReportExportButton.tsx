import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { invokeEdgeFunction } from "@/lib/supabaseEdgeFunctions";
import { cn } from "@/lib/utils";
import { format as formatDate, subDays } from "date-fns";
import { FileText, Loader2 } from "lucide-react";

type ReportType = "admissions" | "finances" | "user-activity";
type ReportFormat = "pdf" | "csv";

interface AdminReportExportButtonProps {
  tenantId?: string | null;
  defaultReportType?: ReportType;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  className?: string;
}

interface ReportExportResponse {
  signedUrl?: string;
  fileName?: string;
  fileContent?: string;
  contentType?: string;
  encoding?: "base64" | "binary";
}

const REPORT_TYPES: Array<{
  value: ReportType;
  label: string;
  description: string;
}> = [
  {
    value: "admissions",
    label: "Admissions",
    description: "Applications received, conversion velocity, and stage progression.",
  },
  {
    value: "finances",
    label: "Finances",
    description: "Commission payments, outstanding balances, and revenue pacing.",
  },
  {
    value: "user-activity",
    label: "User activity",
    description: "Logins, workflow adoption, and engagement hotspots across teams.",
  },
];

const REPORT_FORMATS: Array<{ value: ReportFormat; label: string }> = [
  { value: "pdf", label: "PDF summary" },
  { value: "csv", label: "CSV export" },
];

const FALLBACK_FILE_TYPES: Record<ReportFormat, string> = {
  pdf: "application/pdf",
  csv: "text/csv",
};

const getDefaultDateRange = () => ({
  start: formatDate(subDays(new Date(), 30), "yyyy-MM-dd"),
  end: formatDate(new Date(), "yyyy-MM-dd"),
});

const AdminReportExportButton = ({
  tenantId,
  defaultReportType = "admissions",
  buttonVariant = "outline",
  buttonSize = "sm",
  className,
}: AdminReportExportButtonProps) => {
  const { session } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReportType(defaultReportType);
  }, [defaultReportType]);

  const selectedReport = useMemo(
    () => REPORT_TYPES.find((item) => item.value === reportType),
    [reportType],
  );

  const selectedFormat = useMemo(
    () => REPORT_FORMATS.find((item) => item.value === format),
    [format],
  );

  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      return start <= end;
    } catch (rangeError) {
      console.error("Invalid date range", rangeError);
      return false;
    }
  }, [startDate, endDate]);

  const resetState = useCallback(() => {
    const { start, end } = getDefaultDateRange();
    setStartDate(start);
    setEndDate(end);
    setFormat("pdf");
    setError(null);
    setReportType(defaultReportType);
  }, [defaultReportType]);

  const downloadFile = useCallback(
    (content: string, fileName: string, contentType: string) => {
      try {
        const byteCharacters = atob(content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      } catch (downloadError) {
        console.error("Failed to download report", downloadError);
        throw new Error("Unable to download the generated report file.");
      }
    },
    [],
  );

  const handleGenerateReport = async () => {
    if (!tenantId) {
      setError("A tenant context is required to export reports.");
      return;
    }

    if (!isDateRangeValid) {
      setError("Select a valid start and end date.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    const reportLabel = selectedReport?.label ?? "Analytics";
    const formatLabel = selectedFormat?.label ?? format.toUpperCase();

    try {
      const { data, error: functionError } = await invokeEdgeFunction<ReportExportResponse>("analytics-export", {
        accessToken: session?.access_token ?? undefined,
        headers: { "Content-Type": "application/json" },
        body: {
          tenantId,
          startDate,
          endDate,
          reportType,
          format,
        },
      });

      if (functionError) {
        throw new Error(functionError.message ?? "Unable to generate report.");
      }

      if (!data) {
        throw new Error("No data returned from the export service.");
      }

      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else if (data.fileContent) {
        const inferredType = data.contentType ?? FALLBACK_FILE_TYPES[format];
        const extension = format === "pdf" ? "pdf" : "csv";
        const fileName = data.fileName ?? `bridge-${reportType}-report-${formatDate(new Date(), "yyyy-MM-dd")}.${extension}`;

        if (data.encoding && data.encoding !== "base64") {
          throw new Error(`Unsupported encoding received: ${data.encoding}`);
        }

        downloadFile(data.fileContent, fileName, inferredType);
      } else {
        throw new Error("The export response did not include a downloadable file.");
      }

      toast({
        title: "Export in progress",
        description: `Your ${reportLabel.toLowerCase()} ${formatLabel.toLowerCase()} report is downloading.`,
      });

      setOpen(false);
      resetState();
    } catch (exportError) {
      console.error("Report export failed", exportError);
      const message = exportError instanceof Error ? exportError.message : "Unexpected error generating the report.";
      setError(message);
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={cn("gap-2", className)}
        >
          <FileText className="h-4 w-4" />
          Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export analytics report</DialogTitle>
          <DialogDescription>
            Choose the reporting window, data focus, and format. A Supabase Edge Function assembles the export on-demand.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-start-date">Start date</Label>
              <Input
                id="report-start-date"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end-date">End date</Label>
              <Input
                id="report-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data focus</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_FORMATS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating
              </>
            ) : (
              "Generate report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminReportExportButton;
