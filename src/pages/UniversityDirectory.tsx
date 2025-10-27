import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/BackButton";
import { Search, GraduationCap, MapPin, Globe } from "lucide-react";

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
  program_count?: number;
}

// Helper: pick image for university
const getUniversityImage = (universityName: string, logoUrl: string | null): string => {
  const name = universityName.toLowerCase();
  if (logoUrl && logoUrl.startsWith('/src/assets/')) {
    // Use university-specific images instead of logos for better visual appeal
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
    if (name.includes("berkeley") || name.includes("california")) return defaultUniversityImg;
  }

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
  if (name.includes("berkeley") || name.includes("california")) return defaultUniversityImg;

  return defaultUniversityImg;
};

export default function UniversityDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<University[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load universities with program counts
      const { data: universitiesData, error: uniError } = await supabase
        .from("universities")
        .select("*")
        .eq("active", true)
        .order("name");

      if (uniError) throw uniError;

      if (universitiesData) {
        // Get program counts for each university
        const universitiesWithCounts = await Promise.all(
          universitiesData.map(async (uni) => {
            const { count } = await supabase
              .from("programs")
              .select("*", { count: "exact", head: true })
              .eq("university_id", uni.id)
              .eq("active", true);

            return {
              ...uni,
              program_count: count || 0,
            };
          })
        );

        setUniversities(universitiesWithCounts);

        // Extract unique countries
        const uniqueCountries = [...new Set(universitiesData.map((u) => u.country))].sort();
        setCountries(uniqueCountries);
      }
    } catch (error) {
      console.error("Error loading universities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universities.filter((uni) => {
    const matchesSearch = !searchTerm || uni.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = selectedCountry === "all" || uni.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackButton variant="ghost" size="sm" className="mb-4" fallback="/" />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">University Directory</h1>
          <p className="text-muted-foreground">
            Browse universities worldwide and explore their programs
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Universities</CardTitle>
            <CardDescription>Find the perfect institution for your studies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            {loading
              ? "Loading universities..."
              : `${filteredUniversities.length} ${filteredUniversities.length === 1 ? "University" : "Universities"} Found`}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUniversities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No universities found matching your criteria. Try adjusting your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUniversities.map((university) => (
                <Link
                  key={university.id}
                  to={`/universities/${university.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full group-hover:scale-[1.02]">
                    {/* University Image */}
                    <div className="h-48 bg-muted overflow-hidden">
                      <img
                        src={getUniversityImage(university.name, university.logo_url)}
                        alt={university.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <CardHeader>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {university.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {university.city && `${university.city}, `}
                        {university.country}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {university.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {university.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {university.program_count || 0} {university.program_count === 1 ? 'Program' : 'Programs'}
                        </Badge>

                        {university.website && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Website
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
