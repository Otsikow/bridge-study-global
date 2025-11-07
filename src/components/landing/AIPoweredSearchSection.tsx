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

const sampleResults: AISearchResults = {
  summary:
    "AI preview: These picks highlight globally recognized AI and data programs with strong graduate outcomes and generous funding. Sign in to run live searches tailored to your interests.",
  universities: [
    {
      name: "Imperial College London",
      country: "United Kingdom",
      city: "London",
      website: "https://www.imperial.ac.uk/",
      globalRanking: "QS 2025: #2 in Europe",
      tuitionRange: "£36,500 – £39,000 per year",
      acceptanceRate: "~15%",
      notes: [
        "Flagship AI and machine learning research with close industry partnerships",
        "Graduates report >92% employment within 6 months",
      ],
      standoutPrograms: [
        {
          name: "MSc Artificial Intelligence",
          level: "Postgraduate",
          duration: "12 months",
          overview:
            "Hands-on curriculum across deep learning, reinforcement learning, and robotics with applied labs.",
          admissionsInsight:
            "Expect a 2:1 (or equivalent) in computing, engineering, or mathematics plus strong coding portfolio.",
          careerOutlook:
            "Popular roles include machine learning engineer, quantitative analyst, and AI consultant.",
          scholarshipHighlight:
            "Department offers £5k–£10k excellence scholarships for top profiles submitted by February.",
        },
      ],
      scholarships: [
        {
          name: "Imperial Global STEM Leadership Scholarship",
          amount: "Up to £20,000",
          deadline: "February each year",
          eligibility:
            "Outstanding academic profile with leadership achievements in STEM fields.",
          link: "https://www.imperial.ac.uk/study/pg/fees-and-funding/scholarships/",
        },
      ],
    },
    {
      name: "University of Toronto",
      country: "Canada",
      city: "Toronto",
      website: "https://www.utoronto.ca/",
      globalRanking: "Times Higher Education 2025: #18",
      tuitionRange: "CAD 65,000 – CAD 72,000 per year",
      acceptanceRate: "~20% (graduate engineering)",
      notes: [
        "Vector Institute partnership gives access to top AI faculty and internships",
        "Toronto has a high concentration of AI startups and corporate labs",
      ],
      standoutPrograms: [
        {
          name: "Master of Applied Science in Computer Engineering (AI focus)",
          level: "Postgraduate",
          duration: "24 months",
          overview:
            "Research-driven pathway spanning deep learning, NLP, and health AI.",
          admissionsInsight:
            "Competitive GPA (3.7/4.0), research proposal, and supervisor alignment required.",
          careerOutlook:
            "Alumni enter R&D roles at Meta, Google Brain, Layer 6, and global AI labs.",
          scholarshipHighlight:
            "Vector Scholarships in Artificial Intelligence provide CAD 17,500 top-up funding.",
        },
      ],
      scholarships: [
        {
          name: "Vector Institute Scholarships in Artificial Intelligence",
          amount: "CAD 17,500 top-up",
          deadline: "Nominated by university (Jan–Mar)",
          eligibility:
            "Full-time AI-related master’s student at an Ontario university.",
          link: "https://vectorinstitute.ai/programs/scholarships/",
        },
      ],
    },
  ],
  scholarships: [
    {
      name: "DeepMind Scholarship",
      provider: "Google DeepMind",
      amount: "Full tuition + £15,000 stipend",
      deadline: "Varies by partner university",
      eligibility:
        "Underrepresented students pursuing AI masters at partner institutions.",
      link: "https://deepmind.google/scholarships/",
    },
    {
      name: "Generation Google Scholarship (EMEA)",
      provider: "Google",
      amount: "€7,000",
      deadline: "December",
      eligibility:
        "Undergraduate or graduate students in CS demonstrating leadership and diversity impact.",
      link: "https://buildyourfuture.withgoogle.com/scholarships",
    },
  ],
  nextSteps: [
    "Create a free GEG account to unlock live AI search and save shortlists.",
    "Use the Visa Eligibility Calculator to confirm post-study work visa options.",
    "Chat with a verified GEG advisor to review documents before scholarship deadlines.",
  ],
  sources: [
    "Imperial College London Graduate Prospectus 2025",
    "University of Toronto Engineering Admissions 2025",
    "Vector Institute Scholarship Program Overview",
  ],
};

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
  const [results, setResults] = useState<AISearchResults | null>(sampleResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(true);

  useEffect(() => {
    if (!user) {
      setResults(sampleResults);
      setIsSample(true);
    } else if (isSample) {
      setResults(null);
      setIsSample(false);
    }
  }, [user, isSample]);

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
    <section className="relative border-y border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background/60">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] xl:gap-16">
          {/* Left Section */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered University & Scholarship Search</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
                Find the right program with real-time intelligence
              </h2>
              <p className="text-lg text-muted-foreground">
                Ask anything about universities, courses, or funding worldwide.
                Our AI-powered engine analyses the latest admissions insights,
                scholarships, and visa pathways tailored to your goals.
              </p>
            </div>

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
                      "cursor-pointer border border-primary/20 bg-background/60 px-3 py-1 text-sm hover:shadow-sm",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <Card className="border border-primary/20 bg-card/80 backdrop-blur">
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
                          className="rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
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
                        <strong className="text-foreground">Sign up</strong> to
                        run live searches with the full AI engine.
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
                          setResults(sampleResults);
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

          {/* Right Section */}
          <div className="space-y-6">
            <Card className="border border-primary/20 bg-background/90 shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Analysing the latest admissions data, rankings, and
                      scholarships...
                    </p>
                  </div>
                )}

                {!loading && results?.summary && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-sm leading-relaxed text-primary-foreground/90">
                    {results.summary}
                  </div>
                )}

                {/* Results Section */}
                {!loading && hasResults && (
                  <div className="space-y-8">
                    {universities.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          <School className="h-4 w-4" /> Universities & Programmes
                        </div>
                        <div className="space-y-4">
                          {universities.map((university) => {
                            const universityScholarships = university.scholarships ?? [];
                            const standoutPrograms = university.standoutPrograms ?? [];

                            return (
                              <div
                                key={`${university.name}-${university.country ?? ""}`}
                                className="space-y-5 rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-foreground">{university.name}</h3>
                                    {(university.city || university.country) && (
                                      <p className="text-sm text-muted-foreground">
                                        {[university.city, university.country].filter(Boolean).join(", ")}
                                      </p>
                                    )}
                                  </div>
                                  {university.website && (
                                    <Button asChild size="sm" variant="outline" className="h-9 rounded-lg px-3">
                                      <a href={university.website} target="_blank" rel="noreferrer">
                                        Visit site <ExternalLink className="ml-2 h-4 w-4" />
                                      </a>
                                    </Button>
                                  )}
                                </div>

                                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                                  {university.globalRanking && (
                                    <div>
                                      <span className="font-medium text-foreground">Ranking:</span>{" "}
                                      {university.globalRanking}
                                    </div>
                                  )}
                                  {university.tuitionRange && (
                                    <div>
                                      <span className="font-medium text-foreground">Tuition:</span>{" "}
                                      {university.tuitionRange}
                                    </div>
                                  )}
                                  {university.acceptanceRate && (
                                    <div>
                                      <span className="font-medium text-foreground">Acceptance:</span>{" "}
                                      {university.acceptanceRate}
                                    </div>
                                  )}
                                </div>

                                {university.notes?.length ? (
                                  <ul className="space-y-2 text-sm text-muted-foreground">
                                    {university.notes.map((note, index) => (
                                      <li key={`${university.name}-note-${index}`} className="flex items-start gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70" />
                                        <span>{note}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}

                                {standoutPrograms.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                      <Award className="h-4 w-4" /> Standout Programmes
                                    </div>
                                    <div className="space-y-3">
                                      {standoutPrograms.map((program, index) => (
                                        <div
                                          key={`${university.name}-program-${index}`}
                                          className="space-y-3 rounded-xl border border-dashed border-muted-foreground/30 bg-background/60 p-4"
                                        >
                                          <div className="flex flex-wrap justify-between gap-3">
                                            <div className="space-y-2">
                                              <p className="text-base font-medium text-foreground">{program.name}</p>
                                              {program.overview && (
                                                <p className="text-sm leading-relaxed text-muted-foreground">
                                                  {program.overview}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                              {program.level && <span>Level: {program.level}</span>}
                                              {program.duration && <span>Duration: {program.duration}</span>}
                                            </div>
                                          </div>
                                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                                            {program.admissionsInsight && (
                                              <div>
                                                <span className="font-medium text-foreground">Admissions:</span>{" "}
                                                {program.admissionsInsight}
                                              </div>
                                            )}
                                            {program.careerOutlook && (
                                              <div>
                                                <span className="font-medium text-foreground">Career outlook:</span>{" "}
                                                {program.careerOutlook}
                                              </div>
                                            )}
                                            {program.scholarshipHighlight && (
                                              <div>
                                                <span className="font-medium text-foreground">Funding:</span>{" "}
                                                {program.scholarshipHighlight}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {universityScholarships.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                      <Award className="h-4 w-4" /> Scholarships linked to this university
                                    </div>
                                    <div className="space-y-3">
                                      {universityScholarships.map((scholarship, index) => (
                                        <div
                                          key={`${university.name}-linked-scholarship-${index}`}
                                          className="space-y-3 rounded-xl border border-dashed border-muted-foreground/40 bg-background/70 p-4"
                                        >
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-1">
                                              <p className="font-medium text-foreground">{scholarship.name}</p>
                                              {scholarship.provider && (
                                                <p className="text-sm text-muted-foreground">
                                                  Provider: {scholarship.provider}
                                                </p>
                                              )}
                                            </div>
                                            {scholarship.link && (
                                              <Button asChild size="sm" variant="ghost" className="h-9 px-3">
                                                <a href={scholarship.link} target="_blank" rel="noreferrer">
                                                  Details <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                            {scholarship.amount && <span>Funding: {scholarship.amount}</span>}
                                            {scholarship.deadline && <span>Deadline: {scholarship.deadline}</span>}
                                          </div>
                                          {scholarship.eligibility && (
                                            <p className="text-sm text-muted-foreground">
                                              Eligibility: {scholarship.eligibility}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {scholarships.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          <Award className="h-4 w-4" /> Featured Scholarships
                        </div>
                        <div className="space-y-3">
                          {scholarships.map((scholarship, index) => (
                            <div
                              key={`featured-scholarship-${index}`}
                              className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{scholarship.name}</p>
                                  {scholarship.provider && (
                                    <p className="text-sm text-muted-foreground">
                                      Provider: {scholarship.provider}
                                    </p>
                                  )}
                                </div>
                                {scholarship.link && (
                                  <Button asChild size="sm" variant="outline" className="h-9 rounded-lg px-3">
                                    <a href={scholarship.link} target="_blank" rel="noreferrer">
                                      View details <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                {scholarship.amount && <span>Funding: {scholarship.amount}</span>}
                                {scholarship.deadline && <span>Deadline: {scholarship.deadline}</span>}
                              </div>
                              {scholarship.eligibility && (
                                <p className="text-sm text-muted-foreground">
                                  Eligibility: {scholarship.eligibility}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {nextSteps.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          <ArrowRight className="h-4 w-4" /> Recommended next steps
                        </div>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                          {nextSteps.map((step, index) => (
                            <li key={`next-step-${index}`} className="flex items-start gap-3">
                              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {sources.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          <Globe2 className="h-4 w-4" /> Sources reviewed
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sources.map((source, index) => (
                            <Badge
                              key={`source-${index}`}
                              variant="outline"
                              className="border-primary/30 text-muted-foreground"
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!loading && !hasResults && (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-sm text-muted-foreground">
                    Run a search to see AI-powered university matches, scholarships, and next steps tailored for you.
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
