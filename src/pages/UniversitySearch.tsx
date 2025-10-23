import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, DollarSign, Award, MapPin, Sparkles, FileText, MessageSquare } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Label } from "@/components/ui/label";
import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import AIChatbot from "@/components/ai/AIChatbot";
import ProgramRecommendations from "@/components/ai/ProgramRecommendations";
import SoPGenerator from "@/components/ai/SoPGenerator";
import InterviewPractice from "@/components/ai/InterviewPractice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// --- University Logos ---
import mitLogo from "@/assets/mit-logo.png";
import harvardLogo from "@/assets/harvard-logo.png";
import stanfordLogo from "@/assets/stanford-logo.png";
import oxfordLogo from "@/assets/oxford-logo.png";
import cambridgeLogo from "@/assets/cambridge-logo.png";
import berkeleyLogo from "@/assets/berkeley-logo.png";
import yaleLogo from "@/assets/yale-logo.png";

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

// Combined helper: prefers logo, falls back to image
const getUniversityVisual = (universityName: string, logoUrl: string | null): string => {
  const name = universityName.toLowerCase();

  if (logoUrl) return logoUrl;

  if (name.includes("oxford")) return oxfordImg;
  if (name.includes("harvard")) return harvardImg;
  if (name.includes("mit") || name.includes("massachusetts institute")) return mitImg;
  if (name.includes("cambridge")) return cambridgeImg;
  if (name.includes("stanford")) return stanfordImg;
  if (name.includes("toronto")) return torontoImg;
  if (name.includes("melbourne")) return melbourneImg;
  if (name.includes("yale")) return yaleImg;
  if (name.includes("princeton")) return princetonImg;
  if (name.includes("ucl") || name.includes("university college london")) return uclImg;
  if (name.includes("imperial")) return imperialImg;
  if (name.includes("edinburgh")) return edinburghImg;
  if (name.includes("berkeley") || name.includes("california")) return berkeleyLogo;

  return defaultUniversityImg;
};

export default function UniversitySearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [maxFee, setMaxFee] = useState<string>("");
  const [onlyWithScholarships, setOnlyWithScholarships] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);

  // AI Recommendations state
  const [activeTab, setActiveTab] = useState("search");
  const { recommendations } = useAIRecommendations();

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const { data: universities } = await supabase.from("universities").select("country").eq("active", true);
      const { data: programs } = await supabase.from("programs").select("level, discipline").eq("active", true);

      if (universities) {
        const uniqueCountries = [...new Set(universities.map((u) => u.country))].sort();
        setCountries(uniqueCountries);
      }

      if (programs) {
        const uniqueLevels = [...new Set(programs.map((p) => p.level))].sort();
        const uniqueDisciplines = [...new Set(programs.map((p) => p.discipline))].sort();
        setLevels(uniqueLevels);
        setDisciplines(uniqueDisciplines);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      let universityQuery = supabase.from("universities").select("*").eq("active", true);

      if (searchTerm) universityQuery = universityQuery.ilike("name", `%${searchTerm}%`);
      if (selectedCountry !== "all") universityQuery = universityQuery.eq("country", selectedCountry);

      const { data: universities, error: uniError } = await universityQuery;
      if (uniError) throw uniError;

      if (!universities || universities.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const universityIds = universities.map((u) => u.id);

      let programsQuery = supabase.from("programs").select("*").in("university_id", universityIds).eq("active", true);
      if (selectedLevel !== "all") programsQuery = programsQuery.eq("level", selectedLevel);
      if (selectedDiscipline !== "all") programsQuery = programsQuery.eq("discipline", selectedDiscipline);
      if (maxFee) programsQuery = programsQuery.lte("tuition_amount", parseFloat(maxFee));

      const { data: programs, error: progError } = await programsQuery;
      if (progError) throw progError;

      const { data: scholarships } = await supabase
        .from("scholarships")
        .select("*")
        .in("university_id", universityIds)
        .eq("active", true);

      const searchResults: SearchResult[] = universities
        .map((university) => {
          const universityPrograms = programs?.filter((p) => p.university_id === university.id) || [];
          const universityScholarships = scholarships?.filter((s) => s.university_id === university.id) || [];

          return {
            university,
            programs: universityPrograms,
            scholarships: universityScholarships,
          };
        })
        .filter((result) => {
          if (result.programs.length === 0) return false;
          if (onlyWithScholarships && result.scholarships.length === 0) return false;
          return true;
        });

      setResults(searchResults);
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
        <BackButton variant="ghost" size="sm" className="mb-4" fallback="/" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Find Your Perfect University</h1>
          <p className="text-muted-foreground">Search through universities, programs, and scholarships worldwide</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex justify-start md:justify-center">
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" /> Search
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Sparkles className="mr-2 h-4 w-4" /> AI Recommendations
            </TabsTrigger>
            <TabsTrigger value="sop">
              <FileText className="mr-2 h-4 w-4" /> SOP Generator
            </TabsTrigger>
            <TabsTrigger value="interview">
              <MessageSquare className="mr-2 h-4 w-4" /> Interview Practice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Search Filters</CardTitle>
                <CardDescription>Refine your search by selecting criteria below</CardDescription>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Program Level</Label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Discipline</Label>
                    <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discipline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Disciplines</SelectItem>
                        {disciplines.map((discipline) => (
                          <SelectItem key={discipline} value={discipline}>
                            {discipline}
                          </SelectItem>
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
                      onCheckedChange={(checked) => setOnlyWithScholarships(checked as boolean)}
                    />
                    <Label htmlFor="scholarships" className="ml-2">
                      Only show universities with scholarships
                    </Label>
                  </div>
                </div>

                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">
                {loading ? "Searching..." : `Found ${results.length} ${results.length === 1 ? "result" : "results"}`}
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
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No universities found matching your criteria. Try adjusting your filters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                results.map((result) => (
                  <Card key={result.university.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* University Image */}
                      <div className="md:w-64 h-48 md:h-auto bg-muted flex-shrink-0">
                        <img
                          src={getUniversityVisual(result.university.name, result.university.logo_url)}
                          alt={result.university.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-2xl">{result.university.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {result.university.city && `${result.university.city}, `}
                                {result.university.country}
                              </CardDescription>
                            </div>
                            {result.scholarships.length > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {result.scholarships.length} Scholarship
                                {result.scholarships.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {result.university.description && (
                            <p className="text-sm text-muted-foreground">{result.university.description}</p>
                          )}

                          {/* Programs */}
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" /> Available Programs (
                              {result.programs.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {result.programs.slice(0, 4).map((program) => (
                                <div key={program.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                                  <p className="font-medium text-sm">{program.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {program.level}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {program.tuition_amount.toLocaleString()} {program.tuition_currency}
                                    </span>
                                  </div>
                                  <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                                    <a href={`/student/applications/new?program=${program.id}`}>Apply Now</a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                            {result.programs.length > 4 && (
                              <p className="text-xs text-muted-foreground">
                                +{result.programs.length - 4} more programs
                              </p>
                            )}
                          </div>

                          {/* Scholarships */}
                          {result.scholarships.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Award className="h-4 w-4" /> Scholarships
                              </h4>
                              <div className="space-y-2">
                                {result.scholarships.map((scholarship) => (
                                  <div key={scholarship.id} className="p-2 rounded-md bg-primary/10 text-sm">
                                    <p className="font-medium">{scholarship.name}</p>
                                    {scholarship.amount_cents && (
                                      <p className="text-xs text-muted-foreground">
                                        {(scholarship.amount_cents / 100).toLocaleString()} {scholarship.currency}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <ProgramRecommendations />
          </TabsContent>

          <TabsContent value="sop" className="space-y-6">
            <SoPGenerator />
          </TabsContent>

          <TabsContent value="interview" className="space-y-6">
            <InterviewPractice />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
