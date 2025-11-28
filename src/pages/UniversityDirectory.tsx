import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  UNIVERSITY_COUNTRIES,
  UNIVERSITY_DIRECTORY_DATA,
  UNIVERSITY_FOCUS_AREAS,
  UNIVERSITY_REGIONS,
  UNIVERSITY_TYPES,
  type UniversityDirectoryItem,
} from "@/data/university-directory";
import {
  Award,
  BarChart3,
  Building2,
  ExternalLink,
  Globe,
  GraduationCap,
  LayoutGrid,
  List,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { SEO } from "@/components/SEO";

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

type SortOption =
  | "ranking-asc"
  | "ranking-desc"
  | "name-asc"
  | "name-desc"
  | "programs-desc"
  | "acceptance-desc"
  | "international-desc"
  | "tuition-asc"
  | "tuition-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "ranking-asc", label: "QS Rank: Ascending" },
  { value: "ranking-desc", label: "QS Rank: Descending" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "programs-desc", label: "Programmes: High to Low" },
  { value: "acceptance-desc", label: "Acceptance Rate: High to Low" },
  { value: "international-desc", label: "International Students: High to Low" },
  { value: "tuition-asc", label: "Tuition: Lowest to Highest" },
  { value: "tuition-desc", label: "Tuition: Highest to Lowest" },
];

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value: number) => numberFormatter.format(Math.round(value));

const formatPercentage = (value: number) => `${value.toFixed(0)}%`;

const StatItem = ({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
}) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    {subValue ? <p className="text-xs text-muted-foreground">{subValue}</p> : null}
  </div>
);

export default function UniversityDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("ranking-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const summaryMetrics = useMemo(() => {
    const totalUniversities = UNIVERSITY_DIRECTORY_DATA.length;
    const totalPrograms = UNIVERSITY_DIRECTORY_DATA.reduce(
      (sum, uni) => sum + uni.programCount,
      0
    );
    const averageAcceptance =
      UNIVERSITY_DIRECTORY_DATA.reduce((sum, uni) => sum + uni.acceptanceRate, 0) /
      totalUniversities;
    const averageInternational =
      UNIVERSITY_DIRECTORY_DATA.reduce(
        (sum, uni) => sum + uni.studentBody.internationalPercentage,
        0
      ) / totalUniversities;
    const countriesCount = new Set(
      UNIVERSITY_DIRECTORY_DATA.map((uni) => uni.country)
    ).size;
    const regionsCount = new Set(
      UNIVERSITY_DIRECTORY_DATA.map((uni) => uni.region)
    ).size;
    const largestStudentBody = UNIVERSITY_DIRECTORY_DATA.reduce(
      (prev, current) =>
        current.studentBody.total > prev.studentBody.total ? current : prev,
      UNIVERSITY_DIRECTORY_DATA[0]
    );

    return {
      totalUniversities,
      totalPrograms,
      averageAcceptance,
      averageInternational,
      countriesCount,
      regionsCount,
      largestStudentBody,
    };
  }, []);

  const filteredUniversities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return UNIVERSITY_DIRECTORY_DATA.filter((university) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          university.name,
          university.city,
          university.country,
          university.description,
          ...university.focusAreas,
          ...university.notablePrograms,
          ...university.badges,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCountry =
        selectedCountry === "all" || university.country === selectedCountry;
      const matchesRegion =
        selectedRegion === "all" || university.region === selectedRegion;
      const matchesType =
        selectedType === "all" || university.institutionType === selectedType;
      const matchesFocusAreas =
        selectedFocusAreas.length === 0 ||
        selectedFocusAreas.every((focus) =>
          university.focusAreas.includes(focus)
        );

      return (
        matchesSearch &&
        matchesCountry &&
        matchesRegion &&
        matchesType &&
        matchesFocusAreas
      );
    });
  }, [searchTerm, selectedCountry, selectedRegion, selectedType, selectedFocusAreas]);

  const sortedUniversities = useMemo(() => {
    const list = [...filteredUniversities];

    switch (sortOption) {
      case "ranking-asc":
        return list.sort((a, b) => a.ranking - b.ranking);
      case "ranking-desc":
        return list.sort((a, b) => b.ranking - a.ranking);
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case "programs-desc":
        return list.sort((a, b) => b.programCount - a.programCount);
      case "acceptance-desc":
        return list.sort((a, b) => b.acceptanceRate - a.acceptanceRate);
      case "international-desc":
        return list.sort(
          (a, b) =>
            b.studentBody.internationalPercentage -
            a.studentBody.internationalPercentage
        );
      case "tuition-asc":
        return list.sort(
          (a, b) => a.averageTuitionInternational - b.averageTuitionInternational
        );
      case "tuition-desc":
        return list.sort(
          (a, b) => b.averageTuitionInternational - a.averageTuitionInternational
        );
      default:
        return list;
    }
  }, [filteredUniversities, sortOption]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedRegion("all");
    setSelectedType("all");
    setSelectedFocusAreas([]);
    setSortOption("ranking-asc");
  };

  const renderUniversityCard = (university: UniversityDirectoryItem) => {
    const image = getUniversityImage(university.name, null);
    const locationLabel = `${university.city}, ${university.country}`;

    const cardContent = (
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {university.badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-2xl text-foreground">
                  {university.name}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    {locationLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {university.region}
                  </span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Founded {university.founded}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {university.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatItem icon={Award} label="QS Rank" value={`#${university.ranking}`} />
          <StatItem
            icon={BarChart3}
            label="Acceptance"
            value={formatPercentage(university.acceptanceRate)}
          />
          <StatItem
            icon={GraduationCap}
            label="Programmes"
            value={formatNumber(university.programCount)}
          />
          <StatItem
            icon={Users}
            label="Students"
            value={`${formatNumber(university.studentBody.total)}`}
            subValue={`${formatPercentage(
              university.studentBody.internationalPercentage
            )} international`}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Key Focus Areas
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {university.focusAreas.map((focus) => (
                <Badge key={focus} variant="outline" className="text-xs">
                  {focus}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-background/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Signature Programmes
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              {university.notablePrograms.map((program) => (
                <li key={program} className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <span>{program}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-background/60 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Research Highlights
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {university.researchHighlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Investment Snapshot
            </p>
            <p className="text-sm font-medium text-foreground">
              {university.tuitionDisplay}
            </p>
            <p className="text-xs text-muted-foreground">
              Competitive employability ranking #{university.employabilityRank ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/universities/${university.id}`}>
                Explore profile
              </Link>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <a href={university.website} target="_blank" rel="noreferrer">
                Visit website
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    );

    if (viewMode === "list") {
      return (
        <Card className="overflow-hidden border-border/60 transition-all hover:shadow-xl">
          <div className="flex flex-col gap-0 md:flex-row">
            <div className="h-56 w-full md:h-auto md:w-72">
              <img
                src={image}
                alt={university.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">{cardContent}</div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden border-border/60 transition-all hover:shadow-xl">
        <div className="h-48 w-full">
          <img
            src={image}
            alt={university.name}
            className="h-full w-full object-cover"
          />
        </div>
        {cardContent}
      </Card>
    );
  };

  const totalLabel = `${sortedUniversities.length} ${
    sortedUniversities.length === 1 ? "University" : "Universities"
  } Found`;

  return (
    <div className="min-h-screen bg-background pb-12">
      <SEO
        title="University Directory - UniDoxia"
        description="Browse our directory of partner universities from around the world. Find detailed profiles, rankings, and program information to help you choose the right institution."
        keywords="university directory, partner universities, college listings, international universities, student recruitment directory, university finder"
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
        <BackButton variant="ghost" size="sm" wrapperClassName="mb-2" fallback="/" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              Curated global institutions • Updated Q1 2025
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">University Directory</h1>
              <p className="max-w-2xl text-base text-muted-foreground">
                Discover world-leading universities with key statistics, focus areas,
                signature programs, and direct links to explore admissions further.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="h-fit px-3 py-2 text-xs uppercase tracking-wide">
            100% Verified Profiles
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" />
                Global Universities
              </CardTitle>
              <CardDescription>
                Comprehensive coverage across regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {summaryMetrics.totalUniversities}
              </p>
              <p className="text-sm text-muted-foreground">
                {summaryMetrics.countriesCount} countries • {summaryMetrics.regionsCount} regions
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Selectivity Snapshot
              </CardTitle>
              <CardDescription>
                Average admissions competitiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {formatPercentage(summaryMetrics.averageAcceptance)}
              </p>
              <p className="text-sm text-muted-foreground">
                Acceptance rate across the directory
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" />
                Programme Portfolio
              </CardTitle>
              <CardDescription>Active degree pathways globally</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(summaryMetrics.totalPrograms)}
              </p>
              <p className="text-sm text-muted-foreground">
                Including flagship undergraduate & graduate tracks
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4 text-primary" />
                International Community
              </CardTitle>
              <CardDescription>Average global student mix</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {formatPercentage(summaryMetrics.averageInternational)}
              </p>
              <p className="text-sm text-muted-foreground">
                Largest cohort: {summaryMetrics.largestStudentBody.name}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>
              Narrow down universities by geography, institution type, or academic focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground">Keyword</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by university, city, or program strength"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Country</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {UNIVERSITY_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Region</Label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {UNIVERSITY_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Institution Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All institution types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {UNIVERSITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Sort By</Label>
                <Select
                  value={sortOption}
                  onValueChange={(value) => setSortOption(value as SortOption)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sort results" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                Focus Areas
              </Label>
              <ToggleGroup
                type="multiple"
                value={selectedFocusAreas}
                onValueChange={(value) => setSelectedFocusAreas(value)}
                className="flex flex-wrap justify-start gap-2"
              >
                {UNIVERSITY_FOCUS_AREAS.map((area) => (
                  <ToggleGroupItem
                    key={area}
                    value={area}
                    variant="outline"
                    size="sm"
                    className="rounded-full px-3 py-1 text-xs"
                  >
                    {area}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {selectedFocusAreas.length > 0
                  ? `${selectedFocusAreas.length} focus filter${
                      selectedFocusAreas.length > 1 ? "s" : ""
                    } applied`
                  : "No focus filters applied"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) =>
                    setViewMode((value as "grid" | "list") || "grid")
                  }
                  className="rounded-md border bg-muted/40 p-1"
                >
                  <ToggleGroupItem
                    value="grid"
                    className="px-3 py-1 text-xs font-medium"
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="list"
                    className="px-3 py-1 text-xs font-medium"
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{totalLabel}</h2>
            <p className="text-sm text-muted-foreground">
              Showing curated results based on your filters and sort preferences.
            </p>
          </div>

          {sortedUniversities.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <Globe className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    No universities match your current filters
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try removing a focus area or broadening the geography to rediscover options.
                  </p>
                </div>
                <Button onClick={handleResetFilters} variant="secondary">
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {sortedUniversities.map((university) => (
                <div key={university.id}>{renderUniversityCard(university)}</div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {sortedUniversities.map((university) => (
                <div key={university.id}>{renderUniversityCard(university)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
