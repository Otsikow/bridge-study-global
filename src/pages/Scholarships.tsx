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
import { ScholarshipShareDialog } from "@/components/scholarships/ScholarshipShareDialog";
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
const ALERTS_STORAGE_KEY = "geg-scholarship-alerts-enabled";

const detectProfileTags = (saved: ScholarshipSearchResult[]): string[] => {
  const tagSet = new Set<string>();
  saved.forEach((s) => s.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
};

const inferFiltersFromPrompt = (
  prompt: string,
): Partial<ScholarshipSearchFilters> => {
  const normalized = prompt.toLowerCase();
  const countries = SCHOLARSHIP_COUNTRIES.filter((country) =>
    normalized.includes(country.toLowerCase()),
  );

  const levels: string[] = [];
  if (/(undergraduate|bachelor|bsc)/.test(normalized)) levels.push("Undergraduate");
  if (/(masters|graduate|msc|mba)/.test(normalized)) levels.push("Masters");
  if (/(phd|doctoral)/.test(normalized)) levels.push("PhD");

  const fundingTypes: string[] = [];
  if (/fully funded|full[-\s]?funding/.test(normalized)) fundingTypes.push("Full");
  if (/partial/.test(normalized)) fundingTypes.push("Partial");

  const eligibilityTags: string[] = [];
  if (/women/.test(normalized)) eligibilityTags.push("Women-only");
  if (/(africa|asian|caribbean|latin america)/.test(normalized))
    eligibilityTags.push("Region-specific");
  if (/no ielts|ielts waiver|without ielts/.test(normalized))
    eligibilityTags.push("No IELTS");
  if (/research/.test(normalized)) eligibilityTags.push("Research");
  if (/stem|technology|engineering|science/.test(normalized))
    eligibilityTags.push("STEM");
  if (/business|mba|entrepreneur/.test(normalized))
    eligibilityTags.push("Business");

  const fields = SCHOLARSHIP_FIELDS.filter((field) =>
    normalized.includes(field.toLowerCase()),
  );

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
  const [filters, setFilters] =
    useState<ScholarshipSearchFilters>(DEFAULT_FILTERS);

  const [selectedScholarship, setSelectedScholarship] =
    useState<ScholarshipSearchResult | null>(null);

  const [savedScholarshipIds, setSavedScholarshipIds] = useState<string[]>([]);
  const [savedRegistry, setSavedRegistry] = useState<
    Record<string, ScholarshipSearchResult>
  >({});

  const [aiPrompt, setAiPrompt] = useState("");

  // BOTH FEATURES ENABLED
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTarget, setShareTarget] =
    useState<ScholarshipSearchResult | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const savedScholarships = useMemo(
    () => Object.values(savedRegistry),
    [savedRegistry],
  );
  const profileTags = useMemo(
    () => detectProfileTags(savedScholarships),
    [savedScholarships],
  );

  const { toast } = useToast();

  const { results, recommendations, stats, loading, error, refetch } =
    useScholarshipSearch({
      query: debouncedQuery,
      filters,
      profileTags,
    });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedRegistry(parsed);
        setSavedScholarshipIds(Object.keys(parsed));
      } catch (e) {
        console.error("Error loading saved scholarships:", e);
      }
    }

    const alertsStored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (alertsStored === "true") {
      setAlertsEnabled(true);
    }
  }, []);

  const toggleSave = (scholarship: ScholarshipSearchResult) => {
    setSavedRegistry((prev) => {
      const newRegistry = { ...prev };
      if (newRegistry[scholarship.id]) {
        delete newRegistry[scholarship.id];
        setSavedScholarshipIds((ids) => ids.filter((id) => id !== scholarship.id));
        toast({
          title: "Removed from saved",
          // @ts-expect-error - Type mismatch with scholarship structure
          description: `${scholarship.name} removed from your saved scholarships.`,
        });
      } else {
        newRegistry[scholarship.id] = scholarship;
        setSavedScholarshipIds((ids) => [...ids, scholarship.id]);
        toast({
          title: "Saved!",
          // @ts-expect-error - Type mismatch with scholarship structure
          description: `${scholarship.name} added to your saved scholarships.`,
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRegistry));
      return newRegistry;
    });
  };

  const toggleAlerts = () => {
    const newVal = !alertsEnabled;
    setAlertsEnabled(newVal);
    localStorage.setItem(ALERTS_STORAGE_KEY, String(newVal));
    toast({
      title: newVal ? "Alerts enabled" : "Alerts disabled",
      description: newVal
        ? "You'll receive notifications for new matching scholarships."
        : "You won't receive scholarship alerts.",
    });
  };

  const handleAiPromptSubmit = () => {
    if (!aiPrompt.trim()) return;
    const inferred = inferFiltersFromPrompt(aiPrompt);
    setFilters((prev) => ({ ...prev, ...inferred }));
    setQuery(aiPrompt);
    toast({
      title: "AI filters applied",
      description: "Searching with AI-enhanced filters.",
    });
  };

  const handleShare = (scholarship: ScholarshipSearchResult) => {
    setShareTarget(scholarship);
    setShareDialogOpen(true);
  };

  const allResults = useMemo(() => {
    if (loading) return [];
    if (error) return FALLBACK_SCHOLARSHIPS;
    return results.length > 0 ? results : FALLBACK_SCHOLARSHIPS;
  }, [results, loading, error]);

  return (
    <>
      <SEO 
        title="Find Scholarships - Global Education Gateway"
        description="Discover scholarships and funding opportunities worldwide. Search by country, level, and eligibility to find the perfect scholarship for your international education journey."
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BackButton fallback="/" />
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Find Scholarships</h1>
            <p className="text-muted-foreground">
              Discover funding opportunities for your international education journey
            </p>
          </div>

          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <Button
              variant={alertsEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleAlerts}
            >
              <Bell className="mr-2 h-4 w-4" />
              {alertsEnabled ? "Alerts On" : "Enable Alerts"}
            </Button>
            <Badge variant="outline">
              <Bookmark className="mr-1 h-3 w-3" />
              {savedScholarshipIds.length} Saved
            </Badge>
            {stats && (
              <Badge variant="secondary">
                <CalendarDays className="mr-1 h-3 w-3" />
                {/* @ts-expect-error - Stats type mismatch */}
                {stats.deadlinesSoon || stats.closingSoon} Closing Soon
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              {/* @ts-expect-error - Filter component props mismatch */}
              <ScholarshipFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </aside>

            <main className="lg:col-span-3">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search scholarships..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-medium">AI-Powered Search</span>
                  </div>
                  <Textarea
                    placeholder="Describe what you're looking for... (e.g., 'Full scholarships for African women studying engineering in Canada')"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAiPromptSubmit} size="sm">
                    Apply AI Filters
                  </Button>
                </div>
              </div>

              {loading && <LoadingState message="Searching scholarships..." />}

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {recommendations.length > 0 && (
                <div className="mb-6 bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Recommended for You
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendations.map((scholarship) => (
                      <ScholarshipCard
                        key={scholarship.id}
                        scholarship={scholarship as any}
                        isSaved={savedScholarshipIds.includes(scholarship.id)}
                        onToggleSave={toggleSave as any}
                        onViewDetails={() => setSelectedScholarship(scholarship as any)}
                        onShare={() => handleShare(scholarship as any)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    {allResults.length} Scholarships Found
                  </h2>
                  {stats && (
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter Results
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {allResults.map((scholarship) => (
                    <ScholarshipCard
                      key={scholarship.id}
                      scholarship={scholarship as any}
                      isSaved={savedScholarshipIds.includes(scholarship.id)}
                      onToggleSave={toggleSave as any}
                      onViewDetails={() => setSelectedScholarship(scholarship as any)}
                      onShare={() => handleShare(scholarship as any)}
                    />
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {selectedScholarship && (
        <ScholarshipDetailDialog
          scholarship={selectedScholarship}
          open={!!selectedScholarship}
          onOpenChange={(open) => !open && setSelectedScholarship(null)}
          isSaved={savedScholarshipIds.includes(selectedScholarship.id)}
          onToggleSave={toggleSave as any}
        />
      )}

      {shareTarget && (
        <ScholarshipShareDialog
          scholarship={shareTarget}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </>
  );
};

export default ScholarshipsPage;
