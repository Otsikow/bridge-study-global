import { useEffect, useMemo, useState } from "react";
import { Share2, Mail, Copy, Link2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import type { ScholarshipSearchResult } from "@/types/scholarship";
import { buildScholarshipShareLink } from "@/lib/site";

export interface ScholarshipShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scholarship: ScholarshipSearchResult | null;
}

export function ScholarshipShareDialog({ open, onOpenChange, scholarship }: ScholarshipShareDialogProps) {
  const [copiedField, setCopiedField] = useState<"link" | "message" | null>(null);

  useEffect(() => {
    setCopiedField(null);
  }, [scholarship, open]);

  const shareLink = useMemo(() => {
    if (!scholarship) return "";
    return buildScholarshipShareLink(scholarship);
  }, [scholarship]);

  const shareSummary = useMemo(() => {
    if (!scholarship) return "";

    const parts = [
      scholarship.title,
      scholarship.awardAmount,
      scholarship.deadlineLabel ? `Deadline: ${scholarship.deadlineLabel}` : undefined,
      shareLink ? `Explore via Global Education Gateway: ${shareLink}` : undefined,
    ].filter(Boolean);

    return parts.join("\n");
  }, [scholarship, shareLink]);

  const shareSubject = scholarship ? `Scholarship opportunity: ${scholarship.title}` : "Scholarship opportunity";

  const handleCopy = async (text: string, field: "link" | "message") => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } else {
        throw new Error("Clipboard API unavailable");
      }

      setCopiedField(field);
      toast({
        title: "Copied",
        description: field === "link" ? "Scholarship link copied to clipboard." : "Scholarship overview copied to clipboard.",
      });

      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy share content", error);
      toast({
        title: "Unable to copy",
        description: "We couldn't copy that automatically. Try copying it manually.",
        variant: "destructive",
      });
    }
  };

  const handleEmailDraft = () => {
    if (!scholarship) return "";
    const emailBody = `Hi there,\n\nI thought you might be interested in this scholarship opportunity.\n\n${shareSummary}\n\nLet me know if you have any questions!`;
    return `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share scholarship
          </DialogTitle>
          <DialogDescription>
            Send polished details to a student or colleague in just a few clicks.
          </DialogDescription>
        </DialogHeader>

        {scholarship ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{scholarship.title}</p>
              <p className="text-sm text-muted-foreground">{scholarship.institution} • {scholarship.country}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-link" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Global Education Gateway link
              </Label>
              <div className="flex items-center gap-2">
                <Input id="share-link" value={shareLink} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => handleCopy(shareLink, "link")}
                  disabled={!shareLink}
                >
                  {copiedField === "link" ? <CheckCircle2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-message" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Professional message
              </Label>
              <Textarea id="share-message" value={shareSummary} readOnly className="min-h-[120px] resize-none" />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(shareSummary, "message")}
                  className="gap-2"
                  disabled={!shareSummary}
                >
                  {copiedField === "message" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy message
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">Share via email</span>
                <span className="text-muted-foreground">Open a ready-to-send email draft.</span>
              </div>
              <Button asChild variant="default" className="gap-2">
                <a href={handleEmailDraft()}>
                  <Mail className="h-4 w-4" /> Compose
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
