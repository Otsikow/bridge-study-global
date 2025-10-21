import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, DollarSign, Award, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";

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

export default function UniversitySearch() {
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

      if (universities) {
        const uniqueCountries = [...new Set(universities.map(u => u.country))].sort();
        setCountries(uniqueCountries);
      }

      if (programs) {
        const uniqueLevels = [...new Set(programs.map(p => p.level))].sort();
        const uniqueDisciplines = [...new Set(programs.map(p => p.discipline))].sort();
        setLevels(uniqueLevels);
        setDisciplines(uniqueDisciplines);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Build university query
      let universityQuery = supabase
        .from("universities")
        .select("*")
        .eq("active", true);

      if (searchTerm) {
        universityQuery = universityQuery.ilike("name", `%${searchTerm}%`);
      }

      if (selectedCountry !== "all") {
        universityQuery = universityQuery.eq("country", selectedCountry);
      }

      const { data: universities, error: uniError } = await universityQuery;

      if (uniError) throw uniError;
      if (!universities || universities.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const universityIds = universities.map(u => u.id);

      // Build programs query
      let programsQuery = supabase
        .from("programs")
        .select("*")
        .in("university_id", universityIds)
        .eq("active", true);

      if (selectedLevel !== "all") {
        programsQuery = programsQuery.eq("level", selectedLevel);
      }

      if (selectedDiscipline !== "all") {
        programsQuery = programsQuery.eq("discipline", selectedDiscipline);
      }

      if (maxFee) {
        programsQuery = programsQuery.lte("tuition_amount", parseFloat(maxFee));
      }

      const { data: programs, error: progError } = await programsQuery;
      if (progError) throw progError;

      // Fetch scholarships if needed
      const { data: scholarships } = await supabase
        .from("scholarships")
        .select("*")
        .in("university_id", universityIds)
        .eq("active", true);

      // Combine results
      const searchResults: SearchResult[] = universities
        .map(university => {
          const universityPrograms = programs?.filter(p => p.university_id === university.id) || [];
          const universityScholarships = scholarships?.filter(s => s.university_id === university.id) || [];

          return {
            university,
            programs: universityPrograms,
            scholarships: universityScholarships,
          };
        })
        .filter(result => {
          // Filter out universities with no matching programs
          if (result.programs.length === 0) return false;
          // Filter by scholarship requirement
          if (onlyWithScholarships && result.scholarships.length === 0) return false;
          return true;
        });

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [selectedCountry, selectedLevel, selectedDiscipline, maxFee, onlyWithScholarships]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Find Your Perfect University</h1>
          <p className="text-muted-foreground">Search through universities, programs, and scholarships worldwide</p>
        </div>

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
            <CardDescription>Refine your search by selecting criteria below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Term */}
              <div className="space-y-2">
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

              {/* Country Filter */}
              <div className="space-y-2">
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

              {/* Level Filter */}
              <div className="space-y-2">
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

              {/* Discipline Filter */}
              <div className="space-y-2">
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

              {/* Max Fee */}
              <div className="space-y-2">
                <Label>Maximum Fee (USD)</Label>
                <Input
                  type="number"
                  placeholder="Enter max fee"
                  value={maxFee}
                  onChange={(e) => setMaxFee(e.target.value)}
                />
              </div>

              {/* Scholarship Filter */}
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scholarships"
                    checked={onlyWithScholarships}
                    onCheckedChange={(checked) => setOnlyWithScholarships(checked as boolean)}
                  />
                  <Label htmlFor="scholarships" className="cursor-pointer">
                    Only show universities with scholarships
                  </Label>
                </div>
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Search
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
                <p className="text-muted-foreground">No universities found matching your criteria. Try adjusting your filters.</p>
              </CardContent>
            </Card>
          ) : (
            results.map((result) => (
              <Card key={result.university.id} className="hover:shadow-lg transition-shadow">
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
                        {result.scholarships.length} Scholarship{result.scholarships.length > 1 ? "s" : ""}
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
                      <GraduationCap className="h-4 w-4" />
                      Available Programs ({result.programs.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.programs.slice(0, 4).map((program) => (
                        <div key={program.id} className="p-3 rounded-md bg-muted/50 space-y-1">
                          <p className="font-medium text-sm">{program.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{program.level}</Badge>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {program.tuition_amount.toLocaleString()} {program.tuition_currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {result.programs.length > 4 && (
                      <p className="text-xs text-muted-foreground">+{result.programs.length - 4} more programs</p>
                    )}
                  </div>

                  {/* Scholarships */}
                  {result.scholarships.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Scholarships
                      </h4>
                      <div className="space-y-2">
                        {result.scholarships.slice(0, 3).map((scholarship) => (
                          <div key={scholarship.id} className="p-3 rounded-md bg-primary/5 border border-primary/20">
                            <p className="font-medium text-sm">{scholarship.name}</p>
                            {scholarship.amount_cents && (
                              <p className="text-xs text-muted-foreground">
                                {(scholarship.amount_cents / 100).toLocaleString()} {scholarship.currency}
                                {scholarship.coverage_type && ` • ${scholarship.coverage_type.replace(/_/g, " ")}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.university.website && (
                    <Button variant="outline" asChild className="w-full">
                      <a href={result.university.website} target="_blank" rel="noopener noreferrer">
                        Visit University Website
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
