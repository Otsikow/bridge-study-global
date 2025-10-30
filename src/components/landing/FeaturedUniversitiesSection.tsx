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
}

const FALLBACK_SUMMARY =
  "Dedicated partners that consistently welcome Global Education Gateway students with tailored support.";

export function FeaturedUniversitiesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const DEFAULT_TENANT_SLUG = import.meta.env.VITE_DEFAULT_TENANT_SLUG ?? "geg";

  const { data, isLoading, error } = useQuery({
    queryKey: ["featured-universities", DEFAULT_TENANT_SLUG],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_featured_universities", {
        p_tenant_slug: DEFAULT_TENANT_SLUG,
      });

      if (error) {
        console.error("Error fetching public featured universities:", error);
        throw error;
      }

      return (data as FeaturedUniversity[]) ?? [];
    },
  });

  const featuredUniversities = useMemo(() => data ?? [], [data]);

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

    if (error) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center gap-3 text-destructive">
              <Building2 className="h-6 w-6" />
              <p className="font-semibold">Unable to load featured universities</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please refresh the page or try again later. The administrator has been notified.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!featuredUniversities.length) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Partner spotlights coming soon</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our partnerships team is curating a new cohort of universities to showcase on the homepage. Check back shortly for the latest additions.
            </p>
            <Button asChild variant="outline">
              <Link to="/universities">Explore our full directory</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.25em] text-primary/70">Featured network</p>
            <p className="text-muted-foreground text-sm">
              {featuredUniversities.length} institutions selected by our partnerships team
            </p>
          </div>
          {featuredUniversities.length > 3 && (
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
          {featuredUniversities.map((university, index) => (
            <Card
              key={university.id}
              className={cn(
                "relative h-full border-muted/50 bg-card/80 backdrop-blur transition-all",
                "hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background p-2 shadow-inner">
                      {university.logo_url ? (
                        <img
                          src={university.logo_url}
                          alt={`${university.name} logo`}
                          className="h-full w-full object-contain"
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
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-primary" />
                          {[university.city, university.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {index < 3 && (
                    <Badge className="bg-primary/10 text-primary" variant="secondary">
                      <Sparkles className="mr-1 h-3 w-3" /> Top pick
                    </Badge>
                  )}
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
                  {university.website ? (
                    <Button asChild variant="ghost" size="sm" className="gap-1">
                      <Link to={university.website} target="_blank" rel="noopener noreferrer">
                        Visit site
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
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
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border bg-card/70 p-6">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em]">Become a partner</p>
            <p className="text-sm text-muted-foreground">
              Showcase your institution to thousands of motivated students worldwide.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link to="/partnership">Join the network</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/universities" className="flex items-center gap-1">
                View directory
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
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
