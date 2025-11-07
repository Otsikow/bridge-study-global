import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Lightbulb } from "lucide-react";
import type {
  AdminOverviewMetrics,
  AdmissionsTrendPoint,
  ApplicationsByCountryPoint,
} from "@/hooks/admin/useAdminOverviewData";

interface ZoeAdminInsightsPanelProps {
  metrics?: AdminOverviewMetrics;
  trends?: AdmissionsTrendPoint[];
  geography?: ApplicationsByCountryPoint[];
  loading?: boolean;
}

const QUICK_PROMPTS = [
  "Summarize admissions performance this month",
  "Highlight any partner risks we should review",
  "Recommend which countries to prioritize next",
] as const;

const formatPercentChange = (current: number, previous: number) => {
  if (previous <= 0) return "N/A";
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

export const ZoeAdminInsightsPanel = ({ metrics, trends, geography, loading }: ZoeAdminInsightsPanelProps) => {
  const [prompt, setPrompt] = useState("");

  const insights = useMemo(() => {
    if (!metrics) {
      return ["I'm ready to synthesize insights once data loads."];
    }

    const derived: string[] = [];
    const submittedSeries = trends ?? [];
    const latestPeriod = submittedSeries.at(-1);
    const previousPeriod = submittedSeries.length > 1 ? submittedSeries[submittedSeries.length - 2] : undefined;

    if (latestPeriod) {
      derived.push(
        `Admissions submitted this month: **${latestPeriod.submitted}**${
          previousPeriod ? ` (${formatPercentChange(latestPeriod.submitted, previousPeriod.submitted)} vs last month)` : ""
        }`,
      );
    }

    if (metrics.pendingVerifications > 0) {
      derived.push(
        `There are **${metrics.pendingVerifications}** verification items awaiting review. Prioritising these will unblock revenue recognition.`,
      );
    } else {
      derived.push("All verification queues are clear—no manual intervention required.");
    }

    if (metrics.totalCommissionPaid > 0) {
      derived.push(
        `Total commission paid to date: **${new Intl.NumberFormat("en", {
          style: "currency",
          currency: metrics.currency ?? "USD",
          maximumFractionDigits: 0,
        }).format(metrics.totalCommissionPaid)}**.`,
      );
    }

    const topCountry = geography?.[0];
    if (topCountry) {
      derived.push(
        `${topCountry.country} leads current application volume (${topCountry.applications}). Consider aligning marketing spend accordingly.`,
      );
    }

    return derived;
  }, [geography, metrics, trends]);

  const handlePrompt = (value: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt: value } }));
  };

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    handlePrompt(trimmed);
    setPrompt("");
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Zoe AI Insights</CardTitle>
        </div>
        <Badge variant="outline" className="w-fit gap-1 text-xs">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          Always-on portfolio intelligence
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Synthesizing the latest signals…</p>
          ) : (
            insights.map((message, index) => {
              const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
              const sanitizedMessage = DOMPurify.sanitize(formattedMessage, {
                ALLOWED_TAGS: ['strong'],
                ALLOWED_ATTR: []
              });
              return (
                <div key={index} className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: sanitizedMessage }} />
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask Zoe for deeper diagnostics…"
            className="min-h-[90px] resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  onClick={() => handlePrompt(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <Button onClick={handleSubmit} disabled={!prompt.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              Ask Zoe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ZoeAdminInsightsPanel;
