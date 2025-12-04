import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeaturedUniversity {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  ranking: Record<string, unknown> | null;
  featured: boolean | null;
  featured_priority: number | null;
  featured_summary: string | null;
  featured_highlight: string | null;
  featured_image_url?: string | null;
}

const FALLBACK_UNIVERSITIES: FeaturedUniversity[] = [
  {
    id: "fallback-portsmouth",
    name: "University of Portsmouth",
    country: "United Kingdom",
    city: "Portsmouth",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Portsmouth_coat_of_arms.svg/800px-University_of_Portsmouth_coat_of_arms.svg.png",
    website: "https://www.port.ac.uk",
    ranking: { "QS Global": "Top 600", Acceptance: "High for international" },
    featured: true,
    featured_priority: 0,
    featured_summary:
      "Career-focused teaching with scholarships and competitive fees for African students.",
    featured_highlight: "Affordable undergraduate and postgraduate routes with flexible intakes",
    featured_image_url:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-memorial",
    name: "Memorial University of Newfoundland",
    country: "Canada",
    city: "St. John’s",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Memorial_University_of_Newfoundland_coat_of_arms.svg/1024px-Memorial_University_of_Newfoundland_coat_of_arms.svg.png",
    website: "https://www.mun.ca",
    ranking: { "QS Global": "Top 800", Tuition: "Among lowest in Canada" },
    featured: true,
    featured_priority: 1,
    featured_summary:
      "Public research university known for low tuition and supportive settlement services.",
    featured_highlight: "High acceptance rates with generous international scholarships",
    featured_image_url:
      "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-southern-queensland",
    name: "University of Southern Queensland",
    country: "Australia",
    city: "Toowoomba",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/University_of_Southern_Queensland_coat_of_arms.svg/800px-University_of_Southern_Queensland_coat_of_arms.svg.png",
    website: "https://www.usq.edu.au",
    ranking: { "QS Global": "Top 700", "Online & On-campus": "Flexible" },
    featured: true,
    featured_priority: 2,
    featured_summary:
      "Practical learning pathways with budget-friendly tuition and regional campus lifestyle.",
    featured_highlight: "High visa success support and work-integrated learning options",
    featured_image_url:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-bremen",
    name: "University of Bremen",
    country: "Germany",
    city: "Bremen",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Universit%C3%A4t_Bremen_Logo.svg/512px-Universit%C3%A4t_Bremen_Logo.svg.png",
    website: "https://www.uni-bremen.de/en",
    ranking: { "QS Global": "Top 600", Tuition: "No tuition for most programs" },
    featured: true,
    featured_priority: 3,
    featured_summary:
      "Research-driven German public university with English-taught master’s options and low fees.",
    featured_highlight: "Affordable living costs with strong international student support",
    featured_image_url:
      "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-portland-state",
    name: "Portland State University",
    country: "United States",
    city: "Portland, OR",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Portland_State_University_logo.svg/512px-Portland_State_University_logo.svg.png",
    website: "https://www.pdx.edu",
    ranking: { "QS Global": "Top 1000", Acceptance: "90%+" },
    featured: true,
    featured_priority: 4,
    featured_summary:
      "Urban university with industry-connected programs and approachable tuition for internationals.",
    featured_highlight: "Pathway programs that welcome transfer credits and work experience",
    featured_image_url:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
  },
];

export function FeaturedUniversitiesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["featured-universities"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_featured_universities");

      if (error) {
        console.error("Error fetching public featured universities:", error);
        throw error;
      }

      return (data as FeaturedUniversity[]) ?? [];
    },
  });

  const featuredUniversities = useMemo(() => data ?? [], [data]);
  const hasError = Boolean(error);

  const universitiesToDisplay = useMemo(() => {
    if (hasError) {
      return FALLBACK_UNIVERSITIES;
    }

    if (featuredUniversities.length >= 4) {
      return featuredUniversities;
    }

    const needed = 4 - featuredUniversities.length;
    return [
      ...featuredUniversities,
      ...FALLBACK_UNIVERSITIES.slice(0, Math.max(needed, 0)),
    ];
  }, [featuredUniversities, hasError]);

  const isUsingFallback = hasError || featuredUniversities.length < 4;

  const fallbackSummary = t("pages.index.featuredUniversities.fallback.summary");
  const fallbackNotice = hasError
    ? t("pages.index.featuredUniversities.fallback.notice.error")
    : t("pages.index.featuredUniversities.fallback.notice.updating");
  const topPickLabel = t("pages.index.featuredUniversities.badges.topPick");
  const priorityLabel = (position: number) =>
    t("pages.index.featuredUniversities.badges.priority", { position });
  const visitSiteLabel = t("pages.index.featuredUniversities.actions.visitSite");
  const recommendedHighlight = t("pages.index.featuredUniversities.fallback.highlight");
  const networkLabel = t("pages.index.featuredUniversities.network.label");
  const networkSummary = t("pages.index.featuredUniversities.network.summary", {
    count: universitiesToDisplay.length,
  });
  const scrollLeftLabel = t("pages.index.featuredUniversities.actions.scrollLeft");
  const scrollRightLabel = t("pages.index.featuredUniversities.actions.scrollRight");
  const sectionHeading = t("pages.index.featuredUniversities.heading");
  const sectionDescription = t("pages.index.featuredUniversities.description");
  const partnerCtaHeading = t("pages.index.featuredUniversities.partnerCta.heading");
  const partnerCtaDescription = t("pages.index.featuredUniversities.partnerCta.description");
  const partnerCtaAction = t("pages.index.featuredUniversities.partnerCta.action");

  const formatWebsiteUrl = (website: string | null) => {
    if (!website) return null;
    const trimmed = website.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.9;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-muted/40">
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {isUsingFallback && (
          <Card className="border-muted/40 bg-muted/10">
            <CardContent className="p-4 text-sm text-muted-foreground">{fallbackNotice}</CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/70">{networkLabel}</p>
            <p className="text-sm text-muted-foreground">{networkSummary}</p>
          </div>
          {universitiesToDisplay.length > 3 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => scrollBy("left")}
                aria-label={scrollLeftLabel}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => scrollBy("right")}
                aria-label={scrollRightLabel}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="grid gap-6 max-md:overflow-x-auto max-md:pb-2 sm:grid-cols-2 xl:grid-cols-3">
          {universitiesToDisplay.map((university, index) => {
            const formattedWebsite = formatWebsiteUrl(university.website);

            return (
              <Card
                key={university.id}
                className={cn(
                  "relative h-full overflow-hidden border-muted/50 bg-card/80 backdrop-blur transition-all",
                  "hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"
                )}
              >
                <div className="relative h-40 w-full bg-muted/40">
                  {university.featured_image_url ? (
                    <img
                      src={university.featured_image_url}
                      alt={`${university.name} campus`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent" />
                  {index < 3 && (
                    <Badge className="absolute left-4 top-4 bg-primary/90 text-primary-foreground" variant="secondary">
                      <Sparkles className="mr-1 h-3 w-3" /> {topPickLabel}
                    </Badge>
                  )}
                </div>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background p-2 shadow-inner">
                        {university.logo_url ? (
                          <img
                            src={university.logo_url}
                            alt={`${university.name} logo`}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight">{university.name}</CardTitle>
                        {(university.city || university.country) && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            {[university.city, university.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {typeof university.featured_priority === "number" && (
                    <Badge variant="outline" className="self-start text-xs">
                      {priorityLabel(university.featured_priority + 1)}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {university.featured_summary || university.featured_highlight || fallbackSummary}
                  </p>
                  {university.ranking && typeof university.ranking === "object" && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {Object.entries(university.ranking)
                        .filter(([, value]) => value !== null && value !== "")
                        .slice(0, 3)
                        .map(([label, value]) => (
                          <Badge key={label} variant="outline" className="bg-muted/40">
                            {label}: {String(value)}
                          </Badge>
                        ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {university.featured_highlight || recommendedHighlight}
                    </div>
                    {formattedWebsite ? (
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <a href={formattedWebsite} target="_blank" rel="noopener noreferrer">
                          {visitSiteLabel}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="gap-1" disabled>
                        <span className="flex items-center gap-1 text-muted-foreground/70">
                          {visitSiteLabel}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border bg-card/70 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{partnerCtaHeading}</p>
            <p className="text-sm text-muted-foreground">{partnerCtaDescription}</p>
          </div>
          <Button asChild size="sm">
            <Link to="/partnership">{partnerCtaAction}</Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <section className="relative py-20" aria-labelledby="featured-universities-heading">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-background to-primary/10" />
      <div className="container mx-auto px-4 space-y-12">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 id="featured-universities-heading" className="text-4xl font-bold">
              {sectionHeading}
            </h2>
            <p className="text-muted-foreground">{sectionDescription}</p>
          </div>
        {renderContent()}
      </div>
    </section>
  );
}

export default FeaturedUniversitiesSection;
