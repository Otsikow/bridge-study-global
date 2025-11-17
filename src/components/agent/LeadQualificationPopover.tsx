import { Lead } from "@/types/lead";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeadQualificationPopoverProps {
  lead: Lead;
}

const PRIORITY_STYLES: Record<Lead["priorityLevel"], string> = {
  hot: "border-transparent bg-red-500/15 text-red-600",
  warm: "border-transparent bg-amber-500/20 text-amber-700",
  nurture: "border-transparent bg-blue-500/15 text-blue-700",
};

const METRICS: {
  key: keyof Omit<Lead["qualification"], "missingDocuments">;
  label: string;
}[] = [
  { key: "academicStrength", label: "Academic strength" },
  { key: "financialReadiness", label: "Financial readiness" },
  { key: "destinationInterest", label: "Destination interest" },
  { key: "conversionLikelihood", label: "Likelihood to convert" },
];

export default function LeadQualificationPopover({
  lead,
}: LeadQualificationPopoverProps) {
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer space-y-1 rounded-lg border bg-muted/30 p-3 transition-all hover:border-primary/40">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", PRIORITY_STYLES[lead.priorityLevel])}>
              {lead.priorityLevel === "hot"
                ? "Hot lead"
                : lead.priorityLevel === "warm"
                  ? "Warm lead"
                  : "Nurture"}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">
              {lead.priorityScore}% match
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            {lead.prioritySummary}
          </p>
          <p className="text-[11px] font-medium text-primary/70">
            Hover to view AI qualification details
          </p>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 space-y-4">
        <div>
          <p className="text-sm font-semibold">AI Lead Qualification</p>
          <p className="text-xs text-muted-foreground">
            Scores refresh whenever the student completes forms, uploads files, or replies.
          </p>
        </div>
        {METRICS.map((metric) => {
          const detail = lead.qualification[metric.key];
          if (!("score" in detail)) return null;
          return (
            <div key={metric.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>{metric.label}</span>
                <span>{detail.score}%</span>
              </div>
              <Progress value={detail.score} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">{detail.summary}</p>
            </div>
          );
        })}
        <div className="rounded-md bg-muted/60 p-3 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">Missing documents</p>
          <p>{lead.qualification.missingDocuments.summary}</p>
          {lead.qualification.missingDocuments.documents.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {lead.qualification.missingDocuments.documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
