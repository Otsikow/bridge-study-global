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

