"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageSquare, CheckCircle2, ShieldCheck } from "lucide-react";

interface HighlightItem {
  title: string;
  description: string;
}

const fallbackPrompt = "\"Write an email to this university asking about application status.\"";

const fallbackEmail = [
  "Hello Admissions Team,",
  "I hope you're well. I'm writing on behalf of our student, [Student Name], who submitted an application on [Date].",
  "Could you please share an update on the current review stage or any additional requirements needed to move forward?",
  "We want to ensure all materials are complete and support your timelines.",
  "Thank you for your partnership and guidance.",
  "Best regards,",
  "[Your Name]",
  "Global Education Gateway",
];

const fallbackHighlights: HighlightItem[] = [
  {
    title: "Consistent tone",
    description: "Every email mirrors your brand voice—no rushed or unprofessional drafts.",
  },
  {
    title: "Faster follow-ups",
    description: "Staff type natural language prompts and ship polished outreach within seconds.",
  },
  {
    title: "Compliance ready",
    description: "Templates include the right context, deadlines, and disclosures automatically.",
  },
];

const parseStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((item) => (typeof item === "string" ? item : null))
    .filter((item): item is string => Boolean(item));

  return parsed.length > 0 ? parsed : null;
};

const parseHighlights = (value: unknown): HighlightItem[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const highlight = item as Partial<HighlightItem>;
      if (!highlight.title || !highlight.description) return null;
      return {
        title: String(highlight.title),
        description: String(highlight.description),
      } satisfies HighlightItem;
    })
    .filter((item): item is HighlightItem => Boolean(item));

  return parsed.length > 0 ? parsed : null;
};

export function AICommunicationTemplatesSection() {
  const { t } = useTranslation();

  const badge = t("pages.index.aiCommunication.badge");
  const heading = t("pages.index.aiCommunication.heading");
  const description = t("pages.index.aiCommunication.description");
  const promptLabel = t("pages.index.aiCommunication.promptLabel");
  const responseLabel = t("pages.index.aiCommunication.responseLabel");

  const promptExample = t("pages.index.aiCommunication.promptExample") || fallbackPrompt;

  const emailPreview =
    parseStringArray(
      t("pages.index.aiCommunication.generatedEmail", {
        returnObjects: true,
      }) as unknown,
    ) ?? fallbackEmail;

  const highlights =
    useMemo(
      () =>
        parseHighlights(
          t("pages.index.aiCommunication.highlights", {
            returnObjects: true,
          }) as unknown,
        ) ?? fallbackHighlights,
      [t],
    );

  const footnote = t("pages.index.aiCommunication.footnote");

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <Badge className="mb-4 inline-flex items-center gap-2 bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" /> {badge}
        </Badge>
        <h2 className="text-4xl font-bold text-foreground sm:text-5xl">{heading}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-primary/20 bg-gradient-to-b from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-primary" /> {promptLabel}
            </CardTitle>
            <CardDescription>{promptExample}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-background/90 p-6 shadow-inner">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">
                {responseLabel}
              </p>
              <div className="mt-4 space-y-3 text-left text-base text-foreground">
                {emailPreview.map((line, index) => (
                  <p key={`${line}-${index}`} className="leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-muted/40 bg-muted/30 dark:bg-muted/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
                {t("pages.index.aiCommunication.highlightsHeading")}
              </CardTitle>
              <CardDescription>{footnote}</CardDescription>
            </CardHeader>
          </Card>
          {highlights.map((highlight) => (
            <Card key={highlight.title} className="border-muted/40">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {highlight.title}
                </CardTitle>
                <CardDescription className="text-base text-foreground">
                  {highlight.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
