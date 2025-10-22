import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  TrendingUp, 
  Filter,
  Search,
  Brain,
  Shield,
  Target
} from 'lucide-react';
import { useAIRecommendations, StudentProfile } from '@/hooks/useAIRecommendations';
import { Link } from 'react-router-dom';

interface ProgramRecommendationsProps {
  onProgramSelect?: (programId: string) => void;
}

export default function ProgramRecommendations({ onProgramSelect }: ProgramRecommendationsProps) {
  const { recommendations, loading, error, generateRecommendations, getVisaEligibility } = useAIRecommendations();
  const [showFilters, setShowFilters] = useState(false);
  const [visaResults, setVisaResults] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState('recommendations');

  // Filter states
  const [filters, setFilters] = useState({
    countries: [] as string[],
    programLevels: [] as string[],
    disciplines: [] as string[],
    budgetRange: [0, 100000] as [number, number],
    matchScore: [0, 100] as [number, number]
  });

  // Student profile state
  const [profile, setProfile] = useState<StudentProfile>({
    academic_scores: {
      gpa: 3.5,
      ielts: 7.0,
      toefl: 100
    },
    preferences: {
      countries: ['Canada', 'United Kingdom', 'Australia'],
      budget_range: [20000, 80000],
      program_level: ['Master', 'Bachelor'],
      disciplines: ['Computer Science', 'Business', 'Engineering']
    },
    education_history: {}
  });

  const countries = ['Canada', 'United States', 'United Kingdom', 'Australia', 'Germany', 'Netherlands', 'Sweden', 'Norway'];
  const programLevels = ['Bachelor', 'Master', 'PhD', 'Diploma'];
  const disciplines = ['Computer Science', 'Business', 'Engineering', 'Medicine', 'Law', 'Arts', 'Sciences', 'Education'];

  useEffect(() => {
    generateRecommendations(profile);
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.countries.length > 0 && !filters.countries.includes(rec.university.country)) return false;
    if (filters.programLevels.length > 0 && !filters.programLevels.includes(rec.level)) return false;
    if (filters.disciplines.length > 0 && !filters.disciplines.some(d => 
      rec.discipline.toLowerCase().includes(d.toLowerCase())
    )) return false;
    if (rec.tuition_amount < filters.budgetRange[0] || rec.tuition_amount > filters.budgetRange[1]) return false;
    if (rec.match_score < filters.matchScore[0] || rec.match_score > filters.matchScore[1]) return false;
    return true;
  });

  const checkVisaEligibility = async (country: string) => {
    if (visaResults[country]) return;
    
    const result = await getVisaEligibility(country, profile);
    setVisaResults(prev => ({ ...prev, [country]: result }));
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success-light dark:bg-success/20';
    if (score >= 60) return 'text-warning bg-warning-light dark:bg-warning/20';
    return 'text-destructive bg-destructive/10';
  };

  const getVisaColor = (eligibility: string) => {
    switch (eligibility) {
      case 'High': return 'text-success bg-success-light dark:bg-success/20';
      case 'Medium': return 'text-warning bg-warning-light dark:bg-warning/20';
      case 'Low': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            AI-Powered Program Recommendations
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Discover programs that match your profile and goals</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-initial"
          >
            <Filter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button onClick={() => generateRecommendations(profile)} className="flex-1 sm:flex-initial">
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Programs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Countries</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {countries.map(country => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={country}
                        checked={filters.countries.includes(country)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange('countries', [...filters.countries, country]);
                          } else {
                            handleFilterChange('countries', filters.countries.filter(c => c !== country));
                          }
                        }}
                      />
                      <Label htmlFor={country} className="text-sm">{country}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Program Level</Label>
                <div className="space-y-2">
                  {programLevels.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={filters.programLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange('programLevels', [...filters.programLevels, level]);
                          } else {
                            handleFilterChange('programLevels', filters.programLevels.filter(l => l !== level));
                          }
                        }}
                      />
                      <Label htmlFor={level} className="text-sm">{level}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Disciplines</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {disciplines.map(discipline => (
                    <div key={discipline} className="flex items-center space-x-2">
                      <Checkbox
                        id={discipline}
                        checked={filters.disciplines.includes(discipline)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange('disciplines', [...filters.disciplines, discipline]);
                          } else {
                            handleFilterChange('disciplines', filters.disciplines.filter(d => d !== discipline));
                          }
                        }}
                      />
                      <Label htmlFor={discipline} className="text-sm">{discipline}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Budget Range: ${filters.budgetRange[0].toLocaleString()} - ${filters.budgetRange[1].toLocaleString()}</Label>
                  <Slider
                    value={filters.budgetRange}
                    onValueChange={(value) => handleFilterChange('budgetRange', value)}
                    max={100000}
                    min={0}
                    step={1000}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Match Score: {filters.matchScore[0]}% - {filters.matchScore[1]}%</Label>
                  <Slider
                    value={filters.matchScore}
                    onValueChange={(value) => handleFilterChange('matchScore', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">Recommendations ({filteredRecommendations.length})</TabsTrigger>
          <TabsTrigger value="visa">Visa Eligibility</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Generating AI recommendations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matching programs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or preferences</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                            <h3 className="text-lg sm:text-xl font-semibold flex-1">{program.name}</h3>
                            <Badge className={getMatchColor(program.match_score)}>
                              {program.match_score}% Match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {program.level} • {program.discipline}
                          </p>
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="break-words">
                              {program.university.name} • {program.university.city}, {program.university.country}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{program.tuition_currency} {program.tuition_amount.toLocaleString()}/year</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{program.duration_months} months</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">Ranking: {program.university.ranking?.world_rank || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-xs sm:text-sm">Why this program matches you:</h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {program.match_reasons.map((reason, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span>Match Score</span>
                            <span className="font-semibold">{program.match_score}%</span>
                          </div>
                          <Progress value={program.match_score} className="h-2" />
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto lg:min-w-[140px]">
                        <Button
                          onClick={() => onProgramSelect?.(program.id)}
                          className="flex-1 lg:w-full"
                          size="sm"
                        >
                          Apply Now
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => checkVisaEligibility(program.university.country)}
                          className="flex-1 lg:w-full"
                          size="sm"
                        >
                          <Shield className="h-3.5 w-3.5 sm:mr-2" />
                          <span className="hidden sm:inline">Check Visa</span>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="flex-1 lg:w-full">
                          <Link to={`/search?program=${program.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="visa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visa Eligibility Assessment</CardTitle>
              <CardDescription>
                Based on your profile, here's your estimated visa eligibility for different countries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {countries.map(country => {
                  const result = visaResults[country];
                  return (
                    <Card key={country} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{country}</h3>
                            {result ? (
                              <Badge className={`${getVisaColor(result.eligibility)} text-xs`}>
                                {result.eligibility}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => checkVisaEligibility(country)}
                                className="text-xs"
                              >
                                Check
                              </Button>
                            )}
                          </div>
                          
                          {result && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                  <span>Eligibility</span>
                                  <span className="font-semibold">{result.percentage}%</span>
                                </div>
                                <Progress value={result.percentage} className="h-2" />
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="text-xs sm:text-sm font-medium">Key Factors:</h4>
                                <div className="space-y-1">
                                  {result.factors.map((factor: string, index: number) => (
                                    <div key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-success flex-shrink-0 mt-1.5" />
                                      <span className="break-words">{factor}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}