import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingState } from "@/components/LoadingState";
import { ScholarshipFilters } from "@/components/scholarships/ScholarshipFilters";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { ScholarshipDetailDialog } from "@/components/scholarships/ScholarshipDetailDialog";
import { useScholarshipSearch } from "@/hooks/useScholarshipSearch";
import type {
  ScholarshipSearchFilters,
  ScholarshipSearchResult,
} from "@/types/scholarship";
import {
  FALLBACK_SCHOLARSHIPS,
  SCHOLARSHIP_COUNTRIES,
  SCHOLARSHIP_FUNDING_TYPES,
  SCHOLARSHIP_LEVELS,
  SCHOLARSHIP_FIELDS,
  SCHOLARSHIP_ELIGIBILITY_TAGS,
} from "@/data/scholarships";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import {
  Sparkles,
  Search,
  Bookmark,
  Filter,
  Bell,
  CalendarDays,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import BackButton from "@/components/BackButton";

const DEFAULT_FILTERS: ScholarshipSearchFilters = {
  countries: [],
  levels: [],
  fundingTypes: [],
  deadline: "all",
  fieldsOfStudy: [],
  eligibilityTags: [],
};

const STORAGE_KEY = "geg-saved-scholarships";

const detectProfileTags = (saved: ScholarshipSearchResult[]): string[] => {
  const tagSet = new Set<string>();
  saved.forEach((scholarship) => scholarship.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
};

const inferFiltersFromPrompt = (prompt: string): Partial<ScholarshipSearchFilters> => {
  const normalized = prompt.toLowerCase();
  const countries = SCHOLARSHIP_COUNTRIES.filter((country) => normalized.includes(country.toLowerCase()));

  const levels: string[] = [];
  if (/(undergraduate|bachelor|bsc)/.test(normalized)) levels.push("Undergraduate");
  if (/(masters|master|graduate|msc|mba)/.test(normalized)) levels.push("Masters");
  if (/(phd|doctoral|doctorate)/.test(normalized)) levels.push("PhD");

  const fundingTypes: string[] = [];
  if (/full(\s|-)?(funding|scholarship)/.test(normalized) || normalized.includes("fully funded")) {
    fundingTypes.push("Full");
  }
  if (/partial/.test(normalized)) {
    fundingTypes.push("Partial");
  }

  const eligibilityTags: string[] = [];
  if (/women/.test(normalized)) eligibilityTags.push("Women-only");
  if (/(africa|african|latin america|asian|caribbean)/.test(normalized)) eligibilityTags.push("Region-specific");
  if (/(no ielts|without ielts|ielts waiver|no english test)/.test(normalized)) eligibilityTags.push("No IELTS");
  if (/research/.test(normalized)) eligibilityTags.push("Research");
  if (/(stem|technology|engineering|science)/.test(normalized)) eligibilityTags.push("STEM");
  if (/(business|entrepreneurship|mba)/.test(normalized)) eligibilityTags.push("Business");

  const fields = SCHOLARSHIP_FIELDS.filter((field) => normalized.includes(field.toLowerCase()));

  return {
    countries,
    levels,
    fundingTypes,
    fieldsOfStudy: fields,
    eligibilityTags,
  };
};

const ScholarshipsPage = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ScholarshipSearchFilters>(DEFAULT_FILTERS);
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipSearchResult | null>(null);
  const [savedScholarshipIds, setSavedScholarshipIds] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [savedRegistry, setSavedRegistry] = useState<Record<string, ScholarshipSearchResult>>({});

  const debouncedQuery = useDebounce(query, 400);
  const savedScholarships = useMemo(() => Object.values(savedRegistry), [savedRegistry]);
  const profileTags = useMemo(() => detectProfileTags(savedScholarships), [savedScholarships]);

  const { results, recommendations, stats, loading, error, refetch } = useScholarshipSearch({
    query: debouncedQuery,
    filters,
    profileTags,
  });

  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setSavedScholarshipIds(parsed);
      } catch (storageError) {
        console.error("Failed to parse saved scholarships", storageError);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedScholarshipIds));
  }, [savedScholarshipIds]);

  useEffect(() => {
    setSavedRegistry((prev) => {
      const updated = { ...prev };
      results.forEach((scholarship) => {
        if (savedScholarshipIds.includes(scholarship.id)) {
          updated[scholarship.id] = scholarship;
        }
      });
      return updated;
    });
  }, [results, savedScholarshipIds]);

  const visibleSavedScholarships = useMemo(() => {
    if (!savedScholarshipIds.length) return [] as ScholarshipSearchResult[];

    const map = new Map<string, ScholarshipSearchResult>();
    results.forEach((item) => map.set(item.id, item));
    Object.values(savedRegistry).forEach((item) => map.set(item.id, item));

    return savedScholarshipIds
      .map((id) => map.get(id))
      .filter(Boolean) as ScholarshipSearchResult[];
  }, [results, savedRegistry, savedScholarshipIds]);

  const handleToggleSave = (id: string) => {
    setSavedScholarshipIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleShare = async (scholarship: ScholarshipSearchResult) => {
    const shareText = `${scholarship.title} — ${scholarship.awardAmount}\nDeadline: ${scholarship.deadlineLabel}\nApply: ${scholarship.officialLink}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: scholarship.title,
          text: shareText,
          url: scholarship.officialLink,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Link copied", description: "Scholarship details copied to clipboard." });
      }
    } catch (shareError) {
      console.error("Failed to share scholarship", shareError);
      toast({
        title: "Unable to share",
        description: "We couldn't share this scholarship automatically. Try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitPrompt = () => {
    if (!aiPrompt.trim()) return;

    const inferred = inferFiltersFromPrompt(aiPrompt);
    setFilters((prev) => ({
      ...prev,
      ...inferred,
      countries: inferred.countries?.length ? inferred.countries : prev.countries,
      levels: inferred.levels?.length ? inferred.levels : prev.levels,
      fundingTypes: inferred.fundingTypes?.length ? inferred.fundingTypes : prev.fundingTypes,
      fieldsOfStudy: inferred.fieldsOfStudy?.length ? inferred.fieldsOfStudy : prev.fieldsOfStudy,
      eligibilityTags: inferred.eligibilityTags?.length ? inferred.eligibilityTags : prev.eligibilityTags,
    }));
    setQuery(aiPrompt);
    toast({
      title: "AI filters applied",
      description: "We've tailored the filters based on your background. Review the chips above to refine further.",
    });
  };

  const similarScholarships = useMemo(() => {
    if (!selectedScholarship) return [] as ScholarshipSearchResult[];
    return results
      .filter(
        (item) =>
          item.id !== selectedScholarship.id &&
          item.tags.some((tag) => selectedScholarship.tags.includes(tag)),
      )
      .slice(0, 3);
  }, [results, selectedScholarship]);

  const topResult = results[0];
  const headlineScholarship = topResult ?? FALLBACK_SCHOLARSHIPS[0];

  const statsBadges = [
    {
      label: "Total matches",
      value: stats.total,
      icon: Search,
    },
    {
      label: "Closing soon",
      value: stats.closingSoon,
      icon: CalendarDays,
    },
    {
      label: "Fully funded",
      value: stats.fullyFunded,
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Scholarship Finder — Global Education Gateway"
        description="Discover AI-curated scholarships with smart filters, real-time deadlines, and personalised recommendations."
        path="/scholarships"
      />
      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <BackButton variant="ghost" size="sm" className="h-8" labelClassName="hidden sm:inline" />
                <span className="text-xs uppercase tracking-wide text-primary">Global Education Gateway</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Find the perfect scholarship with AI guidance
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground">
                  Search thousands of verified scholarships, filter by eligibility, and let our AI highlight the opportunities that best match your profile.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {statsBadges.map(({ label, value, icon: Icon }) => (
                  <Badge key={label} variant="outline" className="gap-2 rounded-full px-4 py-2 text-sm">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-foreground">{value}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="hidden max-w-xs flex-1 rounded-3xl border bg-card/90 p-6 shadow-lg sm:block">
              <p className="text-sm font-semibold text-primary">AI Highlight</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {headlineScholarship.title} in {headlineScholarship.country} offers {headlineScholarship.awardAmount}.
              </p>
              {headlineScholarship.deadline ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {`Deadline ${formatDistanceToNowStrict(new Date(headlineScholarship.deadline))} away`}
                </p>
              ) : null}
              <Button
                className="mt-4 w-full"
                variant="outline"
                size="sm"
                onClick={() => topResult && setSelectedScholarship(topResult)}
                disabled={!topResult}
              >
                View details
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <label htmlFor="scholarship-search" className="text-sm font-semibold">
                Search for scholarships by country, university, course, or keyword…
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="scholarship-search"
                    placeholder="Full scholarships for nursing in Canada"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" className="gap-2" onClick={() => refetch()}>
                  <Filter className="h-4 w-4" /> Refresh results
                </Button>
              </div>
            </div>

            <ScholarshipFilters
              filters={filters}
              onFiltersChange={setFilters}
              countryOptions={SCHOLARSHIP_COUNTRIES}
              levelOptions={SCHOLARSHIP_LEVELS}
              fundingTypeOptions={SCHOLARSHIP_FUNDING_TYPES}
              fieldOptions={SCHOLARSHIP_FIELDS}
              eligibilityOptions={SCHOLARSHIP_ELIGIBILITY_TAGS}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="grid gap-4 rounded-3xl border bg-muted/20 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Tell us about you</p>
                  <p className="text-sm text-muted-foreground">
                    Share your background and we’ll instantly tailor scholarships that fit your goals.
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" /> AI concierge
                </Badge>
              </div>
              <Textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Example: I’m an African undergraduate with a 3.4 GPA looking for full nursing scholarships in Canada with no IELTS requirement."
                className="min-h-[120px] resize-y"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="rounded-full">
                    🎯 Deadline alerts enabled
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    🔁 Smart re-ranking active
                  </Badge>
                </div>
                <Button onClick={handleSubmitPrompt} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Ask AI to refine search
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingState message="Finding scholarships that match your profile…" />
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load scholarships</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {!loading && !results.length ? (
              <Alert>
                <AlertTitle>No scholarships found</AlertTitle>
                <AlertDescription>
                  Try widening your filters or asking the AI concierge to search with different criteria.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              {results.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                  onSelect={setSelectedScholarship}
                  onToggleSave={handleToggleSave}
                  onShare={handleShare}
                  isSaved={savedScholarshipIds.includes(scholarship.id)}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border bg-muted/20 p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">Recommended for you</p>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI curated
                </Badge>
              </div>
              <div className="mt-4 space-y-3">
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const match = results.find((scholarship) => scholarship.id === item.id);
                      if (match) setSelectedScholarship(match);
                    }}
                    className="group w-full rounded-2xl border bg-card/40 p-4 text-left transition hover:border-primary"
                  >
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary" /> Match score {item.score}%
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border bg-muted/20 p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">Saved scholarships</p>
                <Badge variant="outline" className="gap-1">
                  <Bookmark className="h-3.5 w-3.5" /> {savedScholarshipIds.length}
                </Badge>
              </div>
              <div className="mt-4 space-y-3">
                {visibleSavedScholarships.length ? (
                  visibleSavedScholarships.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedScholarship(item)}
                      className="w-full rounded-2xl border bg-card/40 p-4 text-left transition hover:border-primary"
                    >
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.country} • {item.level}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.awardAmount}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Save scholarships to build your personalised shortlist and enable deadline alerts.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border bg-muted/20 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Bell className="h-4 w-4" /> Alerts & updates
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Turn on notifications to get instant updates when new scholarships match your filters.
              </p>
              <Button variant="outline" className="mt-4 w-full">
                Enable alerts
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <ScholarshipDetailDialog
        open={Boolean(selectedScholarship)}
        onOpenChange={(open) => !open && setSelectedScholarship(null)}
        scholarship={selectedScholarship}
        isSaved={selectedScholarship ? savedScholarshipIds.includes(selectedScholarship.id) : false}
        onToggleSave={handleToggleSave}
        onShare={handleShare}
        similarScholarships={similarScholarships}
        onSelectScholarship={(scholarship) => {
          setSelectedScholarship(scholarship);
        }}
      />
    </div>
  );
};

export default ScholarshipsPage;
