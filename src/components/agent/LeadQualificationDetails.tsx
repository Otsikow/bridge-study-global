import { Lead } from "@/types/lead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeadQualificationDetailsProps {
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
  helper: string;
}[] = [
  {
    key: "academicStrength",
    label: "Academic strength",
    helper: "Grades, rigor, recommendation signals",
  },
  {
    key: "financialReadiness",
    label: "Financial readiness",
    helper: "Proof of funds, sponsor stability",
  },
  {
    key: "destinationInterest",
    label: "Destination interest",
    helper: "Program saves, counselling chats, portal logins",
  },
  {
    key: "conversionLikelihood",
    label: "Likelihood to convert",
    helper: "Response time, deadline adherence, engagement",
  },
];

export default function LeadQualificationDetails({
  lead,
}: LeadQualificationDetailsProps) {
  return (
    <Card>
      <CardHeader className="gap-2 sm:flex sm:items-center sm:justify-between">
        <div>
          <CardTitle>AI Lead Qualification</CardTitle>
          <CardDescription>
            Automatically synthesized from academic, engagement, and document signals.
          </CardDescription>
        </div>
        <Badge className={cn("text-xs", PRIORITY_STYLES[lead.priorityLevel])}>
          {lead.priorityLevel === "hot"
            ? "Hot lead"
            : lead.priorityLevel === "warm"
              ? "Warm lead"
              : "Nurture"}{" "}
          · {lead.priorityScore}% match
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">{lead.prioritySummary}</p>
        <div className="space-y-4">
          {METRICS.map((metric) => {
            const detail = lead.qualification[metric.key];
            if (!("score" in detail)) return null;
            return (
              <div key={metric.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div>
                    <p>{metric.label}</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {metric.helper}
                    </p>
                  </div>
                  <span>{detail.score}%</span>
                </div>
                <Progress value={detail.score} className="h-2" />
                <p className="text-xs text-muted-foreground">{detail.summary}</p>
              </div>
            );
          })}
        </div>
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium">Missing documents</p>
          <p className="text-xs text-muted-foreground">
            {lead.qualification.missingDocuments.summary}
          </p>
          {lead.qualification.missingDocuments.documents.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              {lead.qualification.missingDocuments.documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-green-600">
              ✅ All priority documents are already uploaded.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
