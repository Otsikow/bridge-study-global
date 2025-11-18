"use client";

import { type ComponentType, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, GraduationCap, Sparkles, Users2 } from "lucide-react";

interface MultiRoleConfig {
  key: string;
  title: string;
  description: string;
  capabilities: string[];
}

const fallbackRoles: Array<MultiRoleConfig & { icon: ComponentType<{ className?: string }>; accent: string }> = [
  {
    key: "students",
    title: "Students & families",
    description:
      "Zoe is a study-abroad counsellor that walks every applicant through the full GEG experience.",
    capabilities: [
      "Answers any study-abroad question instantly in plain language.",
      "Guides you through every task inside the GEG app so nothing is missed.",
      "Reviews uploaded transcripts, essays, and proof of funds to suggest best-fit schools.",
      "Shares personalised counselling recommendations informed by your goals.",
    ],
    icon: GraduationCap,
    accent: "from-sky-500 to-blue-500",
  },
  {
    key: "agents",
    title: "Agents & counsellors",
    description:
      "Training, coaching, and on-demand answers are built into the same workspace that powers your agency.",
    capabilities: [
      "Delivers bite-sized training refreshers for new advisors and support staff.",
      "Turns shared student documents into quick school shortlists you can review with clients.",
      "Drafts outreach scripts, follow-up plans, and counselling recommendations automatically.",
      "Flags opportunities to improve conversion using agent analytics pulled from Zoe Intelligence.",
    ],
    icon: Users2,
    accent: "from-amber-500 to-orange-500",
  },
  {
    key: "universities",
    title: "Universities & partners",
    description:
      "Zoe lives inside the university dashboard to keep recruitment, compliance, and service teams aligned.",
    capabilities: [
      "Surfaces partner health alerts and suggested actions directly in the dashboard.",
      "Summarises applicant pipelines by region with notes about policy differences.",
      "Provides training snippets for staff onboarding so teams can self-serve answers.",
      "Escalates issues that need human attention so you can focus on strategic relationships.",
    ],
    icon: Building2,
    accent: "from-emerald-500 to-teal-500",
  },
];

const parseRoles = (value: unknown): MultiRoleConfig[] | null => {
  if (!Array.isArray(value)) return null;

  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = item as Partial<MultiRoleConfig>;
      if (!role.key || !role.title) return null;
      return {
        key: String(role.key),
        title: String(role.title),
        description: role.description ? String(role.description) : "",
        capabilities: Array.isArray(role.capabilities)
          ? role.capabilities.map((capability) => String(capability))
          : [],
      } satisfies MultiRoleConfig;
    })
    .filter((role): role is MultiRoleConfig => Boolean(role));

  return parsed.length ? parsed : null;
};

const fallbackHighlights = [
  "Answers every study-abroad question, no matter the destination.",
  "Guides learners, agents, and universities through the entire GEG app.",
  "Reads shared documents to recommend schools, funding, and next steps.",
];

const parseHighlights = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((item) => (typeof item === "string" ? item : null))
    .filter((item): item is string => Boolean(item));
  return parsed.length ? parsed : null;
};

export const ZoeMultiroleSection = () => {
  const { t } = useTranslation();

  const badgeLabel = t("pages.index.zoeMultiRole.badge");
  const heading = t("pages.index.zoeMultiRole.heading");
  const description = t("pages.index.zoeMultiRole.description");
  const highlightsHeading = t("pages.index.zoeMultiRole.highlightsHeading");
  const competitorsNote = t("pages.index.zoeMultiRole.note");

  const highlightItems = useMemo(() => {
    const fromTranslation = parseHighlights(
      t("pages.index.zoeMultiRole.highlights", { returnObjects: true })
    );
    return fromTranslation ?? fallbackHighlights;
  }, [t]);

  const translationRoles = useMemo(() => {
    const parsed = parseRoles(t("pages.index.zoeMultiRole.roles", { returnObjects: true }));
    if (!parsed) return fallbackRoles;

    return parsed.map((role) => {
      const fallback = fallbackRoles.find((item) => item.key === role.key);
      return {
        ...role,
        icon: fallback?.icon ?? Sparkles,
        accent: fallback?.accent ?? "from-primary to-primary/80",
      };
    });
  }, [t]);

  return (
    <section className="bg-muted/30 py-24">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6">
          <Badge className="bg-primary/10 text-primary">{badgeLabel}</Badge>
          <div>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">
              {heading}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
            <p className="mt-2 text-sm italic text-muted-foreground">{competitorsNote}</p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary/80">
              {highlightsHeading}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {highlightItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {translationRoles.map(({ key, title, description, capabilities, icon: Icon, accent }) => (
            <Card key={key} className="flex flex-col border border-border/60 bg-background shadow-lg">
              <CardHeader>
                <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white", accent)}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {capabilities.map((capability) => (
                  <div key={capability} className="rounded-xl bg-muted/40 p-3">
                    {capability}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ZoeMultiroleSection;
