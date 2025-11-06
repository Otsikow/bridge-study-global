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

const FALLBACK_SUMMARY =
  "Dedicated partners that consistently welcome Global Education Gateway students with tailored support.";

const FALLBACK_UNIVERSITIES: FeaturedUniversity[] = [
  {
    id: "fallback-oxford",
    name: "University of Oxford",
    country: "United Kingdom",
    city: "Oxford",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/University_of_Oxford_coat_of_arms.svg/1200px-University_of_Oxford_coat_of_arms.svg.png",
    website: "https://www.ox.ac.uk",
    ranking: { "QS Global": "Top 5", "Times": "Top 1" },
    featured: true,
    featured_priority: 0,
    featured_summary:
      "Historic academic excellence with a strong record of welcoming international scholars.",
    featured_highlight: "Personalized onboarding for postgraduate programs",
    featured_image_url:
      "https://images.unsplash.com/photo-1521996319423-5650972f7195?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-toronto",
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/University_of_Toronto_coat_of_arms.svg/1024px-University_of_Toronto_coat_of_arms.svg.png",
    website: "https://www.utoronto.ca",
    ranking: { "QS Global": "Top 20", "Times": "Top 20" },
    featured: true,
    featured_priority: 1,
    featured_summary:
      "Leading research university known for industry partnerships and co-op opportunities.",
    featured_highlight: "Career pathways across technology and business",
    featured_image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-singapore",
    name: "National University of Singapore",
    country: "Singapore",
    city: "Singapore",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/National_University_of_Singapore_coat_of_arms.svg/1024px-National_University_of_Singapore_coat_of_arms.svg.png",
    website: "https://www.nus.edu.sg",
    ranking: { "QS Asia": "Top 1", Innovation: "Award-winning" },
    featured: true,
    featured_priority: 2,
    featured_summary:
      "Innovative campus with a focus on AI, sustainability, and entrepreneurship programs.",
    featured_highlight: "Accelerators and launchpads for student founders",
    featured_image_url:
      "https://images.unsplash.com/photo-1523905330026-b8bd1f5f320e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-melbourne",
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    logo_url:
      "https://upload.wikimedia.org/wikipedia/en/thumb/8/88/University_of_Melbourne_coat_of_arms.svg/1024px-University_of_Melbourne_coat_of_arms.svg.png",
    website: "https://www.unimelb.edu.au",
    ranking: { "QS Global": "Top 40", "Times": "Top 35" },
    featured: true,
    featured_priority: 3,
    featured_summary:
      "Vibrant campus culture with deep ties to Asia-Pacific innovation ecosystems.",
    featured_highlight: "Global internships spanning research and industry",
    featured_image_url:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
  },
];

export function FeaturedUniversitiesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const DEFAULT_TENANT_SLUG = import.meta.env.VITE_DEFAULT_TENANT_SLUG ?? "geg";

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
              <CardContent className="p-6 space-y-4">
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
            <CardContent className="p-4 text-sm text-muted-foreground">
              {hasError
                ? "We're showing highlighted partners while we reconnect to the featured list."
                : "We're showing highlighted partners while our featured list updates."}
            </CardContent>
          </Card>
        )}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/70">Featured network</p>
            <p className="text-muted-foreground text-sm">
              {universitiesToDisplay.length} institutions selected by our partnerships team
            </p>
          </div>
          {universitiesToDisplay.length > 3 && (
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => scrollBy("left")}
                aria-label="Scroll featured universities left"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => scrollBy("right")}
                aria-label="Scroll featured universities right"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 max-md:overflow-x-auto max-md:pb-2"
        >
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
                      <Sparkles className="mr-1 h-3 w-3" /> Top pick
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
                        <CardTitle className="text-lg leading-tight">
                          {university.name}
                        </CardTitle>
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
                      Priority #{university.featured_priority + 1}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {university.featured_summary || university.featured_highlight || FALLBACK_SUMMARY}
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
                      {university.featured_highlight || "Dedicated student success partner"}
                    </div>
                    {formattedWebsite ? (
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <a href={formattedWebsite} target="_blank" rel="noopener noreferrer">
                          Visit site
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="gap-1" disabled>
                        <span className="flex items-center gap-1 text-muted-foreground/70">
                          Visit site
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border bg-card/70 p-6">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em]">Become a partner</p>
              <p className="text-sm text-muted-foreground">
                Showcase your institution to thousands of motivated students worldwide.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/partnership">Join the network</Link>
            </Button>
          </div>
      </div>
    );
  };

  return (
    <section className="relative py-20" aria-labelledby="featured-universities-heading">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-background to-primary/10" />
      <div className="container mx-auto px-4 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 id="featured-universities-heading" className="text-4xl font-bold">
            Featured Universities
          </h2>
          <p className="text-muted-foreground">
            Institutions that consistently deliver an exceptional onboarding experience for Global Education Gateway students.
          </p>
        </div>
        {renderContent()}
      </div>
    </section>
  );
}

export default FeaturedUniversitiesSection;
