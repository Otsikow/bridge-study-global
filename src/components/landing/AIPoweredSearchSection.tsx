"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { invokeEdgeFunction } from "@/lib/supabaseEdgeFunctions";
import {
  ArrowRight,
  Award,
  Bot,
  ExternalLink,
  Globe2,
  Loader2,
  Lock,
  School,
  Sparkles,
  Search,
} from "lucide-react";

type Nullable<T> = T | null | undefined;

interface AISearchProgram {
  name: string;
  level?: Nullable<string>;
  duration?: Nullable<string>;
  overview?: Nullable<string>;
  admissionsInsight?: Nullable<string>;
  careerOutlook?: Nullable<string>;
  scholarshipHighlight?: Nullable<string>;
}

interface AISearchScholarship {
  name: string;
  provider?: Nullable<string>;
  amount?: Nullable<string>;
  deadline?: Nullable<string>;
  eligibility?: Nullable<string>;
  link?: Nullable<string>;
}

interface AISearchUniversity {
  name: string;
  country?: Nullable<string>;
  city?: Nullable<string>;
  website?: Nullable<string>;
  globalRanking?: Nullable<string>;
  tuitionRange?: Nullable<string>;
  acceptanceRate?: Nullable<string>;
  notes?: Nullable<string[]>;
  standoutPrograms?: Nullable<AISearchProgram[]>;
  scholarships?: Nullable<AISearchScholarship[]>;
}

interface AISearchResults {
  summary?: Nullable<string>;
  universities?: Nullable<AISearchUniversity[]>;
  scholarships?: Nullable<AISearchScholarship[]>;
  nextSteps?: Nullable<string[]>;
  sources?: Nullable<string[]>;
}

const exampleQueries = [
  "Top AI master's programs with full funding in Europe",
  "Affordable undergraduate business degrees in Australia",
  "Scholarships for Nigerian students pursuing data science",
  "STEM MBAs in the US with co-op placements",
];

const focusOptions = [
  { label: "STEM", value: "STEM" },
  { label: "Scholarships", value: "Scholarships" },
  { label: "Visa friendly", value: "visa friendly" },
  { label: "Undergraduate", value: "undergraduate" },
  { label: "Postgraduate", value: "postgraduate" },
  { label: "Co-op & Internships", value: "co-op" },
];

function normalizeResults(data: unknown): AISearchResults | null {
  if (!data || typeof data !== "object") return null;
  const typed = data as Partial<AISearchResults>;
  return {
    summary: typed.summary ?? null,
    universities: Array.isArray(typed.universities)
      ? typed.universities
      : [],
    scholarships: Array.isArray(typed.scholarships)
      ? typed.scholarships
      : [],
    nextSteps: Array.isArray(typed.nextSteps) ? typed.nextSteps : [],
    sources: Array.isArray(typed.sources) ? typed.sources : [],
  };
}

export function AIPoweredSearchSection() {
  const { user, session, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [results, setResults] = useState<AISearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(true);

  useEffect(() => {
    if (!user) setIsSample(true);
    else setIsSample(false);
  }, [user]);

  const universities = useMemo(() => results?.universities ?? [], [results]);
  const scholarships = useMemo(() => results?.scholarships ?? [], [results]);
  const nextSteps = useMemo(() => results?.nextSteps ?? [], [results]);
  const sources = useMemo(() => results?.sources ?? [], [results]);

  const toggleFocus = (value: string) => {
    setSelectedFocus((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const runSearch = async (overrideQuery?: string) => {
    if (!user) {
      setError("Create a free account to unlock live AI search.");
      return;
    }

    const accessToken = session?.access_token;
    if (!accessToken) {
      setError("We couldn't verify your session. Please sign out and in again.");
      return;
    }

    const activeQuery = overrideQuery?.trim() ?? query.trim();
    if (!activeQuery) {
      setError("Enter what you want to study, your target country, or funding needs.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await invokeEdgeFunction<{
        results?: unknown;
      }>("ai-university-search", {
        accessToken,
        body: {
          query: activeQuery,
          focusAreas: selectedFocus,
          resultCount: 4,
        },
      });

      if (invokeError) throw invokeError;

      const parsed = normalizeResults(data?.results ?? data);
      if (!parsed) throw new Error("AI returned an unexpected format");

      setResults(parsed);
      setIsSample(false);
    } catch (invokeErr) {
      console.error("AI university search failed", invokeErr);
      setError(
        invokeErr instanceof Error
          ? invokeErr.message
          : "Unable to fetch AI insights right now. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runSearch();
  };

  const applyExample = (example: string) => {
    setQuery(example);
    if (user) void runSearch(example);
  };

  const hasResults =
    Boolean(results?.summary && !loading) ||
    universities.length > 0 ||
    scholarships.length > 0;

  return (
    <section className="relative overflow-hidden border-y border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background/70">
      <div className="container mx-auto px-4 py-24 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] xl:gap-16">
          {/* LEFT SIDE */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered University & Scholarship Search</span>
            </div>

            <h2 className="text-4xl font-bold leading-tight sm:text-5xl bg-gradient-to-r from-primary via-sky-500 to-blue-600 bg-clip-text text-transparent">
              Find the right program with real-time intelligence
            </h2>
            <p className="text-lg text-muted-foreground">
              Ask anything about universities, courses, or funding worldwide.
              Our AI engine analyses admissions insights, scholarships, and visa pathways
              tailored to your goals.
            </p>

            <div className="flex flex-wrap gap-2">
              {focusOptions.map((option) => {
                const isActive = selectedFocus.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleFocus(option.value)}
                    className={cn(
                      badgeVariants({
                        variant: isActive ? "default" : "outline",
                      }),
                      "cursor-pointer border border-primary/20 bg-background/60 px-3 py-1 text-sm font-medium transition-all duration-300",
                      isActive &&
                        "bg-primary text-primary-foreground shadow-md"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <Card className="border border-primary/20 bg-card/80 shadow-lg backdrop-blur">
              <CardContent className="space-y-6 pt-6">
                {user ? (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. Master's in data science with scholarships in Germany"
                        className="h-12 flex-1 rounded-xl border-primary/30 bg-background/80 text-base"
                        disabled={loading}
                      />
                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 rounded-xl px-6"
                        disabled={loading || authLoading}
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-2">
                            <Search className="h-5 w-5" /> Search with AI
                          </span>
                        )}
                      </Button>
                    </div>
                    {error && (
                      <p className="text-sm font-medium text-destructive">{error}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {exampleQueries.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => applyExample(example)}
                          className="rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                      <span>
                        <strong className="text-foreground">Sign up</strong> to run
                        live searches with the full AI engine.
                      </span>
                    </div>
                    {error && (
                      <p className="text-sm font-medium text-destructive">{error}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="lg" className="rounded-xl px-6">
                        <Link to="/auth/signup?feature=ai-search">
                          Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-primary/30 px-6"
                        onClick={() => {
                          setIsSample(true);
                          setError(null);
                        }}
                      >
                        Preview AI Insights
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            <Card className="border border-primary/25 bg-background/95 shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold">
                      AI Insights
                    </CardTitle>
                    <CardDescription>
                      Curated matches powered by AI
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSample && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      Preview
                    </Badge>
                  )}
                  <Button asChild size="sm" className="rounded-lg px-4">
                    <Link to="/auth/signup?feature=ai-search">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {loading && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Analysing the latest admissions data, rankings, and
                      scholarships...
                    </p>
                  </div>
                )}

                {!loading && results?.summary && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-sm leading-relaxed text-primary-foreground/90">
                    {results.summary}
                  </div>
                )}

                {!loading && !hasResults && (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
                    Run a search to see AI-powered university matches, scholarships, and
                    next steps tailored for you.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
