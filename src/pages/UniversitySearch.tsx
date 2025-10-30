import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import ProgramRecommendations from "@/components/ai/ProgramRecommendations";
import SoPGenerator from "@/components/ai/SoPGenerator";
import InterviewPractice from "@/components/ai/InterviewPractice";
import {
  Search,
  GraduationCap,
  DollarSign,
  Award,
  MapPin,
  Sparkles,
  FileText,
  MessageSquare,
} from "lucide-react";

// --- University Images ---
import oxfordImg from "@/assets/university-oxford.jpg";
import harvardImg from "@/assets/university-harvard.jpg";
import mitImg from "@/assets/university-mit.jpg";
import cambridgeImg from "@/assets/university-cambridge.jpg";
import stanfordImg from "@/assets/university-stanford.jpg";
import torontoImg from "@/assets/university-toronto.jpg";
import melbourneImg from "@/assets/university-melbourne.jpg";
import yaleImg from "@/assets/university-yale.jpg";
import princetonImg from "@/assets/university-princeton.jpg";
import uclImg from "@/assets/university-ucl.jpg";
import imperialImg from "@/assets/university-imperial.jpg";
import edinburghImg from "@/assets/university-edinburgh.jpg";
import defaultUniversityImg from "@/assets/university-default.jpg";

interface University {
  id: string;
  name: string;
  country: string;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  description: string | null;
}

interface Program {
  id: string;
  name: string;
  level: string;
  discipline: string;
  tuition_amount: number;
  tuition_currency: string;
  duration_months: number;
  university_id: string;
}

interface Scholarship {
  id: string;
  name: string;
  amount_cents: number | null;
  currency: string;
  coverage_type: string | null;
  university_id: string | null;
  program_id: string | null;
}

interface SearchResult {
  university: University;
  programs: Program[];
  scholarships: Scholarship[];
}

// --- Helper: choose logo or fallback image ---
const getUniversityVisual = (name: string, logo: string | null): string => {
  const lower = name.toLowerCase();
  if (logo) return logo;
  if (lower.includes("oxford")) return oxfordImg;
  if (lower.includes("harvard")) return harvardImg;
  if (lower.includes("mit") || lower.includes("massachusetts")) return mitImg;
  if (lower.includes("cambridge")) return cambridgeImg;
  if (lower.includes("stanford")) return stanfordImg;
  if (lower.includes("toronto")) return torontoImg;
  if (lower.includes("melbourne")) return melbourneImg;
  if (lower.includes("yale")) return yaleImg;
  if (lower.includes("princeton")) return princetonImg;
  if (lower.includes("ucl") || lower.includes("university college london")) return uclImg;
  if (lower.includes("imperial")) return imperialImg;
  if (lower.includes("edinburgh")) return edinburghImg;
  return defaultUniversityImg;
};

export default function UniversitySearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [maxFee, setMaxFee] = useState("");
  const [onlyWithScholarships, setOnlyWithScholarships] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("search");

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const { data: universities } = await supabase
        .from("universities")
        .select("country")
        .eq("active", true);
      const { data: programs } = await supabase
        .from("programs")
        .select("level, discipline")
        .eq("active", true);

      if (universities)
        setCountries([...new Set(universities.map((u) => u.country))].sort());
      if (programs) {
        setLevels([...new Set(programs.map((p) => p.level))].sort());
        setDisciplines([...new Set(programs.map((p) => p.discipline))].sort());
      }
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      let uniQuery = supabase.from("universities").select("*").eq("active", true);
      if (searchTerm) uniQuery = uniQuery.ilike("name", `%${searchTerm}%`);
      if (selectedCountry !== "all") uniQuery = uniQuery.eq("country", selectedCountry);

      const { data: universities, error: uniError } = await uniQuery;
      if (uniError) throw uniError;
      if (!universities?.length) {
        setResults([]);
        setLoading(false);
        return;
      }

      const ids = universities.map((u) => u.id);
      let progQuery = supabase.from("programs").select("*").in("university_id", ids).eq("active", true);
      if (selectedLevel !== "all") progQuery = progQuery.eq("level", selectedLevel);
      if (selectedDiscipline !== "all") progQuery = progQuery.eq("discipline", selectedDiscipline);
      if (maxFee) progQuery = progQuery.lte("tuition_amount", parseFloat(maxFee));

      const { data: programs } = await progQuery;
      const { data: scholarships } = await supabase
        .from("scholarships")
        .select("*")
        .in("university_id", ids)
        .eq("active", true);

      const merged: SearchResult[] = universities
        .map((uni) => ({
          university: uni,
          programs: programs?.filter((p) => p.university_id === uni.id) || [],
          scholarships: scholarships?.filter((s) => s.university_id === uni.id) || [],
        }))
        .filter(
          (r) =>
            r.programs.length > 0 &&
            (!onlyWithScholarships || r.scholarships.length > 0)
        );

      setResults(merged);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCountry, selectedLevel, selectedDiscipline, maxFee, onlyWithScholarships]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/" className="mb-4" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Find Your Perfect University</h1>
          <p className="text-muted-foreground">
            Search through universities, programs, and scholarships worldwide.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex flex-wrap gap-3 justify-start md:justify-center">
            <TabsTrigger
              value="search"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger
              value="sop"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              SOP Generator
            </TabsTrigger>
            <TabsTrigger
              value="interview"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              Interview Practice
            </TabsTrigger>
          </TabsList>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Filters</CardTitle>
                <CardDescription>Refine your search below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>University Name</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search universities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Program Level</Label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Discipline</Label>
                    <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                      <SelectTrigger><SelectValue placeholder="Select discipline" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Disciplines</SelectItem>
                        {disciplines.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Maximum Fee (USD)</Label>
                    <Input
                      type="number"
                      placeholder="Enter max fee"
                      value={maxFee}
                      onChange={(e) => setMaxFee(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end">
                    <Checkbox
                      id="scholarships"
                      checked={onlyWithScholarships}
                      onCheckedChange={(checked) => setOnlyWithScholarships(!!checked)}
                    />
                    <Label htmlFor="scholarships" className="ml-2">
                      Only show universities with scholarships
                    </Label>
                  </div>
                </div>
                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />Search
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">
                {loading ? "Searching..." : `Found ${results.length} result${results.length !== 1 ? "s" : ""}`}
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No universities found. Try adjusting your filters.
                  </CardContent>
                </Card>
              ) : (
                results.map((r) => (
                  <Card key={r.university.id} className="hover:shadow-lg transition overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-64 h-48 md:h-auto bg-muted flex-shrink-0">
                        <img
                          src={getUniversityVisual(r.university.name, r.university.logo_url)}
                          alt={r.university.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = defaultUniversityImg;
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-2xl">{r.university.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {r.university.city && `${r.university.city}, `}
                                {r.university.country}
                              </CardDescription>
                            </div>
                            {r.scholarships.length > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Award className="h-3 w-3" /> {r.scholarships.length} Scholarship
                                {r.scholarships.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {r.university.description && (
                            <p className="text-sm text-muted-foreground">{r.university.description}</p>
                          )}

                          {/* Programs */}
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" /> Programs ({r.programs.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {r.programs.slice(0, 4).map((p) => (
                                <div key={p.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                                  <p className="font-medium text-sm">{p.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline">{p.level}</Badge>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" /> {p.tuition_amount.toLocaleString()}{" "}
                                      {p.tuition_currency}
                                    </span>
                                  </div>
                                  <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                                    <a href={`/student/applications/new?program=${p.id}`}>Apply Now</a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                            {r.programs.length > 4 && (
                              <p className="text-xs text-muted-foreground">
                                +{r.programs.length - 4} more programs
                              </p>
                            )}
                          </div>

                          {/* Scholarships */}
                          {r.scholarships.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Award className="h-4 w-4" /> Scholarships
                              </h4>
                              <div className="space-y-1">
                                {r.scholarships.slice(0, 3).map((s) => (
                                  <div
                                    key={s.id}
                                    className="text-sm flex items-center justify-between p-2 rounded-md bg-muted/30"
                                  >
                                    <span>{s.name}</span>
                                    {s.amount_cents ? (
                                      <Badge variant="secondary" className="text-xs">
                                        {(s.amount_cents / 100).toLocaleString()} {s.currency}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {s.coverage_type || "Amount varies"}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {r.scholarships.length > 3 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{r.scholarships.length - 3} more scholarships
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-4">
                            <Button asChild className="flex-1">
                              <Link to={`/search/${r.university.id}`}>View Details</Link>
                            </Button>
                            {r.university.website && (
                              <Button variant="outline" asChild>
                                <a href={r.university.website} target="_blank" rel="noopener noreferrer">
                                  Visit Website
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* AI RECOMMENDATIONS TAB */}
          <TabsContent value="recommendations">
            <ProgramRecommendations />
          </TabsContent>

          {/* SOP GENERATOR TAB */}
          <TabsContent value="sop">
            <SoPGenerator />
          </TabsContent>

          {/* INTERVIEW PRACTICE TAB */}
          <TabsContent value="interview">
            <InterviewPractice />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
