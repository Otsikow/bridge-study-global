import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/supabaseEdgeFunctions";
import { FALLBACK_SCHOLARSHIPS } from "@/data/scholarships";
import type {
  Scholarship,
  ScholarshipSearchFilters,
  ScholarshipSearchResult,
  ScholarshipAIRecommendation,
} from "@/types/scholarship";
import type { Database } from "@/integrations/supabase/types";

interface ScholarshipSearchOptions {
  query: string;
  filters: ScholarshipSearchFilters;
  profileTags?: string[];
  limit?: number;
}

interface ScholarshipSearchHookResult {
  results: ScholarshipSearchResult[];
  recommendations: ScholarshipAIRecommendation[];
  stats: {
    total: number;
    closingSoon: number;
    fullyFunded: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

type SupabaseScholarshipRow = Database["public"]["Tables"]["scholarships"]["Row"];

const DEFAULT_LIMIT = 60;

const formatAmountFromCents = (amount?: number | null, currency?: string | null) => {
  if (!amount) return null;
  const formatted = (amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return currency ? `${currency} ${formatted}` : formatted;
};

const mapScholarshipRow = (row: SupabaseScholarshipRow): Scholarship => {
  const fallbackAward = formatAmountFromCents(row.amount_cents, row.currency);
  const fallbackTitle = row.title ?? row.name ?? "Scholarship opportunity";
  const fallbackLevel = row.level ?? row.coverage_type ?? "Masters";
  const fallbackInstitution = row.institution ?? row.university_id ?? row.name ?? "Host institution";
  const fallbackCountry = row.country ?? (row.eligibility as { country?: string })?.country ?? "Global";

  const eligibility =
    (row.eligibility as Scholarship["eligibility"]) ??
    (row.eligibility_criteria as Scholarship["eligibility"]) ??
    {};

  const steps = (row.application_steps as string[]) ?? [];
  const inferredSteps =
    steps.length > 0
      ? steps
      : Array.isArray((row.eligibility as { steps?: string[] })?.steps)
      ? ((row.eligibility as { steps?: string[] })?.steps as string[])
      : [];
  const documents = (row.documents_required as string[]) ?? [];
  const inferredDocuments =
    documents.length > 0
      ? documents
      : Array.isArray((row.eligibility as { documents?: string[] })?.documents)
      ? ((row.eligibility as { documents?: string[] })?.documents as string[])
      : [];

  return {
    id: row.id,
    title: fallbackTitle,
    country: fallbackCountry,
    institution: fallbackInstitution,
    level: fallbackLevel,
    awardAmount: row.award_amount ?? fallbackAward ?? "See official details",
    fundingType: (row.funding_type ?? row.coverage_type ?? "Partial") as Scholarship["fundingType"],
    eligibility,
    eligibilitySummary:
      row.eligibility_summary ??
      (typeof row.eligibility_criteria === "string" ? row.eligibility_criteria : "Review official eligibility details."),
    deadline: row.deadline ?? row.application_deadline ?? undefined,
    description: row.description ?? "",
    overview: row.overview ?? undefined,
    applicationSteps: inferredSteps,
    documentsRequired: inferredDocuments,
    officialLink: row.official_link ?? "#",
    tags: row.tags ?? [],
    aiScore: row.ai_score ?? undefined,
    languageSupport: row.language_support ?? undefined,
    logoUrl: row.logo_url ?? null,
    currency: row.currency ?? undefined,
    stipendDetails: row.stipend_details ?? undefined,
    selectionProcess: row.selection_process ?? undefined,
    recommendedFor: row.recommended_for ?? undefined,
    verified: row.verified ?? row.active ?? true,
  };
};

const fetchScholarships = async (
  query: string,
  filters: ScholarshipSearchFilters,
  limit: number,
): Promise<Scholarship[]> => {
  try {
    const { data, error } = await invokeEdgeFunction<{
      results: Scholarship[];
    }>("scholarship-search", {
      method: "POST",
      includeAnonKey: true,
      body: JSON.stringify({ query, filters, limit }),
      headers: { "Content-Type": "application/json" },
    });

    if (!error && data?.results?.length) {
      return data.results;
    }
  } catch (edgeError) {
    console.warn("Scholarship edge search failed, falling back to Supabase query", edgeError);
  }

  try {
    const { data, error } = await supabase
      .from("scholarships")
      .select("*")
      .order("deadline", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Supabase scholarship fetch error", error);
    }

    if (data?.length) {
      return data.map(mapScholarshipRow);
    }
  } catch (clientError) {
    console.error("Supabase scholarship fetch failed", clientError);
  }

  return FALLBACK_SCHOLARSHIPS;
};

const normalise = (value: string) => value.toLowerCase();

const computeDeadlineMeta = (deadline: string | null | undefined) => {
  if (!deadline) {
    return { daysRemaining: null, label: "Flexible deadline" } as const;
  }

  const parsed = parseISO(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return { daysRemaining: null, label: "Flexible deadline" } as const;
  }

  const today = new Date();
  const daysRemaining = differenceInCalendarDays(parsed, today);
  if (daysRemaining < 0) {
    return { daysRemaining, label: "Deadline passed" } as const;
  }

  if (daysRemaining === 0) {
    return { daysRemaining, label: "Closes today" } as const;
  }

  if (daysRemaining <= 14) {
    return { daysRemaining, label: `${daysRemaining} days left` } as const;
  }

  return { daysRemaining, label: `Closes in ${daysRemaining} days` } as const;
};

const matchesFilter = (scholarship: Scholarship, filters: ScholarshipSearchFilters) => {
  if (filters.countries.length && !filters.countries.includes(scholarship.country)) {
    return false;
  }

  if (filters.levels.length && !filters.levels.includes(scholarship.level)) {
    return false;
  }

  if (filters.fundingTypes.length && !filters.fundingTypes.includes(scholarship.fundingType)) {
    return false;
  }

  if (filters.fieldsOfStudy.length) {
    const fieldMatches = (scholarship.eligibility.fieldOfStudy ?? []).some((field) =>
      filters.fieldsOfStudy.some((filterField) => normalise(field).includes(normalise(filterField))),
    );
    if (!fieldMatches) return false;
  }

  if (filters.eligibilityTags.length) {
    const eligibilityBuckets: string[] = [];
    if (scholarship.eligibility.nationality?.includes("International")) eligibilityBuckets.push("International");
    if (scholarship.eligibility.nationality && scholarship.eligibility.nationality.some((tag) => tag.includes("Women"))) {
      eligibilityBuckets.push("Women-only");
    }
    if (scholarship.tags.some((tag) => normalise(tag).includes("women"))) {
      eligibilityBuckets.push("Women-only");
    }
    if (scholarship.tags.some((tag) => normalise(tag).includes("no-ielts"))) {
      eligibilityBuckets.push("No IELTS");
    }
    if (scholarship.tags.some((tag) => normalise(tag).includes("research"))) {
      eligibilityBuckets.push("Research");
    }
    if (scholarship.tags.some((tag) => normalise(tag).includes("stem"))) {
      eligibilityBuckets.push("STEM");
    }
    if (scholarship.tags.some((tag) => normalise(tag).includes("business"))) {
      eligibilityBuckets.push("Business");
    }
    if (scholarship.tags.some((tag) => normalise(tag).includes("africa") || normalise(tag).includes("regional"))) {
      eligibilityBuckets.push("Region-specific");
    }

    const hasTag = filters.eligibilityTags.some((tag) => eligibilityBuckets.includes(tag));
    if (!hasTag) return false;
  }

  if (filters.deadline !== "all") {
    const { daysRemaining } = computeDeadlineMeta(scholarship.deadline);
    if (filters.deadline === "upcoming" && (daysRemaining === null || daysRemaining < 0)) {
      return false;
    }
    if (filters.deadline === "flexible" && daysRemaining !== null) {
      return false;
    }
    if (filters.deadline === "closed" && (daysRemaining === null || daysRemaining >= 0)) {
      return false;
    }
  }

  return true;
};

const scoreScholarship = (
  scholarship: Scholarship,
  query: string,
  profileTags: string[] | undefined,
): { score: number; reasons: string[] } => {
  let score = scholarship.aiScore ?? 70;
  const reasons: string[] = [];

  if (profileTags?.length) {
    const overlapping = scholarship.tags.filter((tag) =>
      profileTags.some((profileTag) => normalise(profileTag) === normalise(tag)),
    );
    if (overlapping.length) {
      score += overlapping.length * 4;
      reasons.push(`Matches your profile interests: ${overlapping.join(", ")}`);
    }
  }

  const { daysRemaining } = computeDeadlineMeta(scholarship.deadline);
  if (typeof daysRemaining === "number" && daysRemaining >= 0) {
    const urgencyBoost = Math.max(0, 20 - Math.min(daysRemaining, 20));
    if (urgencyBoost > 0) {
      score += urgencyBoost / 2;
      reasons.push("Deadline approaching soon");
    }
  }

  if (query.trim()) {
    const q = normalise(query.trim());
    const searchable = [
      scholarship.title,
      scholarship.country,
      scholarship.institution,
      scholarship.level,
      scholarship.awardAmount,
      scholarship.eligibilitySummary,
      ...(scholarship.tags ?? []),
      ...(scholarship.eligibility.fieldOfStudy ?? []),
    ]
      .filter(Boolean)
      .map(normalise);

    const matches = searchable.filter((field) => field.includes(q));
    if (matches.length) {
      score += 15 + matches.length * 2;
      reasons.push(`Matches your search: ${query}`);
    }
  }

  if (scholarship.fundingType.toLowerCase() === "full") {
    score += 5;
    reasons.push("Full funding available");
  }

  return { score, reasons };
};

const enhanceScholarships = (
  scholarships: Scholarship[],
  query: string,
  filters: ScholarshipSearchFilters,
  profileTags: string[] | undefined,
): ScholarshipSearchResult[] => {
  return scholarships
    .filter((scholarship) => matchesFilter(scholarship, filters))
    .map((scholarship) => {
      const meta = computeDeadlineMeta(scholarship.deadline);
      const { score, reasons } = scoreScholarship(scholarship, query, profileTags);
      return {
        ...scholarship,
        deadlineDaysRemaining: meta.daysRemaining,
        deadlineLabel: meta.label,
        matchReasons: reasons,
        aiScore: Math.round(score),
      };
    })
    .sort((a, b) => {
      if (typeof a.deadlineDaysRemaining === "number" && typeof b.deadlineDaysRemaining === "number") {
        if (a.deadlineDaysRemaining >= 0 && b.deadlineDaysRemaining >= 0) {
          if (a.deadlineDaysRemaining !== b.deadlineDaysRemaining) {
            return a.deadlineDaysRemaining - b.deadlineDaysRemaining;
          }
        } else if (a.deadlineDaysRemaining >= 0) {
          return -1;
        } else if (b.deadlineDaysRemaining >= 0) {
          return 1;
        }
      }
      return (b.aiScore ?? 0) - (a.aiScore ?? 0);
    });
};

const deriveRecommendations = (
  results: ScholarshipSearchResult[],
): ScholarshipAIRecommendation[] => {
  return results
    .slice(0, 6)
    .map((result) => ({
      id: result.id,
      title: result.title,
      reason: result.matchReasons?.[0] ?? "Strong alignment with your profile",
      score: result.aiScore ?? 75,
    }))
    .slice(0, 3);
};

export const useScholarshipSearch = ({
  query,
  filters,
  profileTags,
  limit = DEFAULT_LIMIT,
}: ScholarshipSearchOptions): ScholarshipSearchHookResult => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["scholarship-search", query, filters, profileTags, limit],
    queryFn: () => fetchScholarships(query, filters, limit),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  const enhancedResults = useMemo(
    () => enhanceScholarships(data ?? FALLBACK_SCHOLARSHIPS, query, filters, profileTags),
    [data, query, filters, profileTags],
  );

  const stats = useMemo(() => {
    const closingSoon = enhancedResults.filter((scholarship) =>
      typeof scholarship.deadlineDaysRemaining === "number" && scholarship.deadlineDaysRemaining >= 0 && scholarship.deadlineDaysRemaining <= 30,
    ).length;
    const fullyFunded = enhancedResults.filter((scholarship) => scholarship.fundingType.toLowerCase() === "full").length;
    return {
      total: enhancedResults.length,
      closingSoon,
      fullyFunded,
    };
  }, [enhancedResults]);

  const recommendations = useMemo(() => deriveRecommendations(enhancedResults), [enhancedResults]);

  return {
    results: enhancedResults,
    recommendations,
    stats,
    loading: isLoading || isFetching,
    error: error ? "Unable to load scholarships at the moment." : null,
    refetch,
  };
};
