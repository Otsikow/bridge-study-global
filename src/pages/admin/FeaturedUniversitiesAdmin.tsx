import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  Globe,
  ListOrdered,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UniversityRecord {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  featured: boolean | null;
  featured_priority: number | null;
  featured_summary: string | null;
  featured_highlight: string | null;
  updated_at: string | null;
}

interface DraftState {
  featured: boolean;
  featured_priority: string;
  featured_summary: string;
  featured_highlight: string;
}

export default function FeaturedUniversitiesAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

  const { data: universities, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "featured-universities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select(
          "id, name, country, city, logo_url, website, featured, featured_priority, featured_summary, featured_highlight, updated_at"
        )
        .order("featured", { ascending: false })
        .order("featured_priority", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data as UniversityRecord[]) ?? [];
    },
  });

  useEffect(() => {
    if (!universities) return;
    setDrafts((prev) => {
      const next: Record<string, DraftState> = { ...prev };
      universities.forEach((uni) => {
        next[uni.id] = {
          featured: Boolean(uni.featured),
          featured_priority:
            typeof uni.featured_priority === "number"
              ? String(uni.featured_priority)
              : "",
          featured_summary: uni.featured_summary ?? "",
          featured_highlight: uni.featured_highlight ?? "",
        };
      });
      return next;
    });
  }, [universities]);

  const featuredCount = useMemo(
    () => universities?.filter((uni) => Boolean(uni.featured)).length ?? 0,
    [universities]
  );

  const lastUpdated = useMemo(() => {
    if (!universities?.length) return null;
    const sorted = [...universities]
      .filter((uni) => uni.updated_at)
      .sort((a, b) =>
        a.updated_at && b.updated_at
          ? new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          : 0
      );
    return sorted[0]?.updated_at ?? null;
  }, [universities]);

  const mutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        featured: boolean;
        featured_priority: number | null;
        featured_summary: string | null;
        featured_highlight: string | null;
      };
    }) => {
      const { error } = await supabase
        .from("universities")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "featured-universities"] });
      toast({
        title: "Showcase updated",
        description: "Featured university settings saved successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save changes",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating the showcase entry.",
        variant: "destructive",
      });
    },
  });

  const handleDraftChange = <K extends keyof DraftState>(
    id: string,
    key: K,
    value: DraftState[K]
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const handleReset = (id: string) => {
    const original = universities?.find((uni) => uni.id === id);
    if (!original) return;
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        featured: Boolean(original.featured),
        featured_priority:
          typeof original.featured_priority === "number"
            ? String(original.featured_priority)
            : "",
        featured_summary: original.featured_summary ?? "",
        featured_highlight: original.featured_highlight ?? "",
      },
    }));
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;

    const payload = {
      featured: draft.featured,
      featured_priority:
        draft.featured && draft.featured_priority.trim() !== ""
          ? Number(draft.featured_priority)
          : null,
      featured_summary:
        draft.featured_summary.trim() === ""
          ? null
          : draft.featured_summary.trim(),
      featured_highlight:
        draft.featured_highlight.trim() === ""
          ? null
          : draft.featured_highlight.trim(),
    };

    mutation.mutate({ id, updates: payload });
  };

  const hasChanges = (id: string) => {
    const original = universities?.find((uni) => uni.id === id);
    const draft = drafts[id];
    if (!original || !draft) return false;

    const originalPriority =
      typeof original.featured_priority === "number"
        ? String(original.featured_priority)
        : "";
    const originalSummary = (original.featured_summary ?? "").trim();
    const draftSummary = draft.featured_summary.trim();
    const originalHighlight = (original.featured_highlight ?? "").trim();
    const draftHighlight = draft.featured_highlight.trim();
    const draftPriority = draft.featured ? draft.featured_priority.trim() : "";
    return (
      Boolean(original.featured) !== draft.featured ||
      originalSummary !== draftSummary ||
      originalHighlight !== draftHighlight ||
      originalPriority !== draftPriority
    );
  };

  const isSaving = mutation.isPending;

  const renderSkeleton = () => (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Featured Universities
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Curate the institutions that appear on the public landing page showcase.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Active spotlights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">{featuredCount}</p>
              <p className="text-xs text-muted-foreground">
                Recommended: highlight 6 to 9 institutions at a time.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Catalogue size
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">{universities?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                All partner universities with showcase metadata.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Last update
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-balance">
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleString()
                  : "Not available"}
              </p>
              <p className="text-xs text-muted-foreground">
                Updates trigger immediate changes on the landing page.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              How prioritisation works
            </CardTitle>
            <CardDescription>
              Lower numbers appear first on the landing page. Leave the priority blank for institutions that are not currently featured.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/universities">
                <Globe className="mr-2 h-4 w-4" /> View public directory
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["admin", "featured-universities"] })
              }
              disabled={isLoading || isFetching}
            >
              <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Refresh data
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          renderSkeleton()
        ) : (
          <div className="grid gap-6">
            {universities?.map((university) => {
              const draft = drafts[university.id];
              if (!draft) return null;

              const priorityLabel =
                draft.featured && draft.featured_priority.trim() !== ""
                  ? `Priority #${Number(draft.featured_priority) + 1}`
                  : "Not prioritised";

              return (
                <Card key={university.id} className="border-muted/60">
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-background p-2 shadow-inner">
                        {university.logo_url ? (
                          <img
                            src={university.logo_url}
                            alt={`${university.name} logo`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Building2 className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl leading-tight">
                          {university.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {[university.city, university.country]
                            .filter(Boolean)
                            .join(", ") || "Location TBD"}
                        </p>
                        {university.website && (
                          <a
                            href={university.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {university.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                    <Badge variant={draft.featured ? "default" : "secondary"}>
                      {draft.featured ? "Featured" : "Not featured"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Showcase status</p>
                        <p className="text-xs text-muted-foreground">
                          Toggle to publish or hide this university on the landing page highlight section.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`featured-${university.id}`}
                          checked={draft.featured}
                          onCheckedChange={(checked) =>
                            handleDraftChange(university.id, "featured", checked)
                          }
                        />
                        <Label htmlFor={`featured-${university.id}`}>{priorityLabel}</Label>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`summary-${university.id}`} className="text-sm font-medium">
                            Spotlight summary
                          </Label>
                          <Textarea
                            id={`summary-${university.id}`}
                            value={draft.featured_summary}
                            onChange={(event) =>
                              handleDraftChange(
                                university.id,
                                "featured_summary",
                                event.target.value
                              )
                            }
                            placeholder="Headline copy shown beneath the university card on the homepage"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`highlight-${university.id}`} className="text-sm font-medium">
                            Homepage highlight
                          </Label>
                          <Input
                            id={`highlight-${university.id}`}
                            value={draft.featured_highlight}
                            onChange={(event) =>
                              handleDraftChange(
                                university.id,
                                "featured_highlight",
                                event.target.value
                              )
                            }
                            placeholder="e.g. Scholarships up to 40% | Fast admissions turnaround"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`priority-${university.id}`} className="text-sm font-medium">
                          Display priority
                        </Label>
                        <Input
                          id={`priority-${university.id}`}
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={draft.featured ? draft.featured_priority : ""}
                          onChange={(event) =>
                            handleDraftChange(
                              university.id,
                              "featured_priority",
                              event.target.value.replace(/[^0-9]/g, "")
                            )
                          }
                          placeholder="0 = first, 1 = second, etc."
                          disabled={!draft.featured}
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave blank to let the system position this university after prioritised entries.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleReset(university.id)}
                        disabled={isSaving || !hasChanges(university.id)}
                      >
                        Reset
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSave(university.id)}
                        disabled={isSaving || !hasChanges(university.id)}
                      >
                        Save changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
