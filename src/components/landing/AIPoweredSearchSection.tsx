"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Bot, CheckCircle2, Sparkles } from "lucide-react";

interface FocusArea {
  key: string;
  label: string;
  headline: string;
  description: string;
  highlights: string[];
}

interface InsightStat {
  value: string;
  label: string;
}

interface TranslationPanelConfig {
  title: string;
  subtitle: string;
  previewLabel: string;
  highlightsHeading: string;
}

const fallbackFocusAreas: FocusArea[] = [
  {
    key: "stem",
    label: "STEM",
    headline: "Tailored pathways for technical innovators",
    description:
      "Spotlight programmes with research labs, co-ops, and funding built for scientists and engineers.",
    highlights: [
      "Scholarships that prioritise STEM majors and research output",
      "Industry-aligned curricula with internships and co-op rotations",
      "Visa guidance for high-demand technology and engineering roles",
    ],
  },
  {
    key: "scholarships",
    label: "Scholarships",
    headline: "Funding opportunities matched to your profile",
    description:
      "Identify grants, bursaries, and assistantships you can realistically secure.",
    highlights: [
      "Curated list of merit and need-based awards with deadlines",
      "Eligibility insights that map to your academic background",
      "Application tips to strengthen statements and references",
    ],
  },
  {
    key: "visa",
    label: "Visa friendly",
    headline: "Study routes with smooth immigration journeys",
    description:
      "Compare countries and institutions with favourable visa pathways.",
    highlights: [
      "Post-study work options and stay-back durations summarised",
      "Documentation checklists tailored to your nationality",
      "Advisories on financial proof, health cover, and interview prep",
    ],
  },
  {
    key: "undergraduate",
    label: "Undergraduate",
    headline: "Undergraduate journeys built for first-time applicants",
    description:
      "Understand entry requirements, prerequisites, and support services.",
    highlights: [
      "Step-by-step timeline from transcript evaluation to offer acceptance",
      "Guidance on choosing majors, minors, and foundation years",
      "Transition resources covering housing, orientation, and budgeting",
    ],
  },
  {
    key: "postgraduate",
    label: "Postgraduate",
    headline: "Master's and doctoral programmes curated for your goals",
    description:
      "Compare research supervisors, cohort sizes, and funding models.",
    highlights: [
      "Faculty highlights with current research themes",
      "Assistantship and fellowship availability with stipends",
      "Interview preparation and portfolio expectations by programme",
    ],
  },
  {
    key: "coop",
    label: "Co-op & Internships",
    headline: "Work-integrated learning with global employers",
    description:
      "Surface programmes that blend study with hands-on professional experience.",
    highlights: [
      "Placement rates and employer partnerships across regions",
      "Visa considerations for paid placements and work terms",
      "Career services support for resumes, interviews, and networking",
    ],
  },
];

const fallbackStats: InsightStat[] = [
  {
    value: "12k+",
    label: "AI insights generated for global applicants",
  },
  {
    value: "84%",
    label: "Students matched to at least three best-fit programmes",
  },
  {
    value: "50+",
    label: "Countries covered with verified admissions data",
  },
];

const fallbackPanelCopy: TranslationPanelConfig = {
  title: "Preview Zoe Intelligence",
  subtitle: "Choose a focus area to explore the insights you'll unlock.",
  previewLabel: "Sample",
  highlightsHeading: "What the AI prepares for you",
};

const parseFocusAreas = (value: unknown): FocusArea[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const focus = item as Partial<FocusArea>;
      if (!focus.key || !focus.label) return null;
      return {
        key: String(focus.key),
        label: String(focus.label),
        headline: focus.headline ? String(focus.headline) : "",
        description: focus.description ? String(focus.description) : "",
        highlights: Array.isArray(focus.highlights)
          ? focus.highlights.map((highlight) => String(highlight))
          : [],
      } satisfies FocusArea;
    })
    .filter((item): item is FocusArea => Boolean(item));

  return parsed.length > 0 ? parsed : null;
};

const parseStats = (value: unknown): InsightStat[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const stat = item as Partial<InsightStat>;
      if (!stat.value || !stat.label) return null;
      return {
        value: String(stat.value),
        label: String(stat.label),
      } satisfies InsightStat;
    })
    .filter((item): item is InsightStat => Boolean(item));

  return parsed.length > 0 ? parsed : null;
};

const parsePanelCopy = (value: unknown): TranslationPanelConfig | null => {
  if (!value || typeof value !== "object") return null;
  const panel = value as Partial<TranslationPanelConfig>;
  if (!panel.title || !panel.subtitle || !panel.previewLabel || !panel.highlightsHeading) {
    return null;
  }

  return {
    title: String(panel.title),
    subtitle: String(panel.subtitle),
    previewLabel: String(panel.previewLabel),
    highlightsHeading: String(panel.highlightsHeading),
  } satisfies TranslationPanelConfig;
};

export function AIPoweredSearchSection() {
  const { t } = useTranslation();

  const badgeLabel = t("pages.index.aiSearch.badge");
  const heading = t("pages.index.aiSearch.heading");
  const description = t("pages.index.aiSearch.description");
  const subheading = t("pages.index.aiSearch.subheading");
  const ctaLabel = t("pages.index.aiSearch.ctaLabel");

  const focusAreas = useMemo(() => {
    const raw = t("pages.index.aiSearch.focusAreas", {
      returnObjects: true,
    }) as unknown;
    return parseFocusAreas(raw) ?? fallbackFocusAreas;
  }, [t]);

  const stats = useMemo(() => {
    const raw = t("pages.index.aiSearch.stats", {
      returnObjects: true,
    }) as unknown;
    return parseStats(raw) ?? fallbackStats;
  }, [t]);

  const panelCopy = useMemo(() => {
    const raw = t("pages.index.aiSearch.panel", {
      returnObjects: true,
    }) as unknown;
    return parsePanelCopy(raw) ?? fallbackPanelCopy;
  }, [t]);

  const [activeFocus, setActiveFocus] = useState<string>(() => focusAreas[0]?.key ?? fallbackFocusAreas[0].key);

  useEffect(() => {
    if (focusAreas.length === 0) return;
    setActiveFocus((current) => (focusAreas.some((area) => area.key === current) ? current : focusAreas[0].key));
  }, [focusAreas]);

  const activeArea = focusAreas.find((area) => area.key === activeFocus) ?? focusAreas[0] ?? fallbackFocusAreas[0];

  return (
    <section className="relative overflow-hidden border-y border-primary/10 bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-secondary/40 blur-3xl" />

      <div className="container relative mx-auto px-4 py-24 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] xl:gap-16">
          {/* LEFT SIDE */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>{badgeLabel}</span>
            </div>

            <h2 className="text-4xl font-bold leading-tight text-primary sm:text-5xl">{heading}</h2>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground max-w-2xl">{description}</p>
              <p className="text-base text-muted-foreground/90 max-w-2xl">{subheading}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <Card key={`${stat.label}-${stat.value}`} className="border border-primary/15 bg-background/80 shadow-sm">
                  <CardContent className="space-y-1 p-6">
                    <div className="text-2xl font-semibold text-primary">{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl px-8">
                <Link to="/auth/signup?feature=ai-search">{ctaLabel}</Link>
              </Button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            <Card className="border border-primary/20 bg-background/95 shadow-xl backdrop-blur">
              <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold">{panelCopy.title}</CardTitle>
                    <CardDescription>{panelCopy.subtitle}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
                  {panelCopy.previewLabel}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <button
                      key={area.key}
                      type="button"
                      onClick={() => setActiveFocus(area.key)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                        activeFocus === area.key
                          ? "border-primary bg-primary text-primary-foreground shadow"
                          : "border-primary/20 bg-background/80 text-foreground hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-primary">{activeArea.headline}</h3>
                    <p className="text-sm text-muted-foreground">{activeArea.description}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                      {panelCopy.highlightsHeading}
                    </p>
                    <ul className="space-y-3">
                      {activeArea.highlights.map((highlight, index) => (
                        <li key={`${activeArea.key}-highlight-${index}`} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
