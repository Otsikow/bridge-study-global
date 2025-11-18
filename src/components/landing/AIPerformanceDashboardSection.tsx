import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface MetricConfig {
  label: string;
  value: string;
  helper: string;
  trend?: "up" | "down" | "neutral";
}

const trendClassMap: Record<NonNullable<MetricConfig["trend"]>, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  neutral: "text-slate-200/80",
};

export function AIPerformanceDashboardSection() {
  const { t } = useTranslation();

  const titleParts = useMemo(
    () =>
      (t("pages.index.aiExecutiveDashboard.title", { returnObjects: true }) as {
        prefix?: string;
        highlight?: string;
        suffix?: string;
      }) ?? {},
    [t]
  );

  const metrics = useMemo(
    () =>
      (t("pages.index.aiExecutiveDashboard.metrics", { returnObjects: true }) as MetricConfig[]) ?? [],
    [t]
  );

  const insights = useMemo(
    () =>
      (t("pages.index.aiExecutiveDashboard.insights", { returnObjects: true }) as string[]) ?? [],
    [t]
  );

  const badgeLabel = t("pages.index.aiExecutiveDashboard.badge");
  const description = t("pages.index.aiExecutiveDashboard.description");
  const ceoPromise = t("pages.index.aiExecutiveDashboard.ceoPromise");
  const insightsTitle = t("pages.index.aiExecutiveDashboard.insightsTitle");

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_50%)]" />
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          <Badge className="w-fit border-white/20 bg-white/10 text-xs font-semibold tracking-wide text-white">
            {badgeLabel}
          </Badge>
          <div className="space-y-4">
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
              {titleParts.prefix}
              {titleParts.highlight ? (
                <span className="text-primary"> {titleParts.highlight} </span>
              ) : null}
              {titleParts.suffix ? <span>{titleParts.suffix}</span> : null}
            </h2>
            <p className="text-lg text-white/80">{description}</p>
            <p className="text-base font-semibold text-sky-200">{ceoPromise}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
              {insightsTitle}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric) => {
            const trendClass = metric.trend
              ? trendClassMap[metric.trend]
              : trendClassMap.neutral;

            return (
              <Card
                key={metric.label}
                className="border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur"
              >
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-white/70">{metric.label}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className={`text-sm font-medium ${trendClass}`}>{metric.helper}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
