import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Globe,
  DollarSign,
  GraduationCap,
  FileText,
  Clock,
  TrendingUp,
  Shield,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VisaRequirements {
  country: string;
  ielts_min: number;
  toefl_min: number;
  gpa_min: number;
  bank_balance_min: number;
  currency: string;
  work_experience_min: number;
  age_limit: number;
  processing_time_days: number;
  success_rate: number;
}

interface VisaEligibility {
  eligible: boolean;
  score: number;
  missing_requirements: string[];
  recommendations: string[];
  probability: 'high' | 'medium' | 'low';
}

const VISA_REQUIREMENTS: Record<string, VisaRequirements> = {
  canada: {
    country: 'Canada',
    ielts_min: 6.0,
    toefl_min: 80,
    gpa_min: 3.0,
    bank_balance_min: 10000,
    currency: 'CAD',
    work_experience_min: 1,
    age_limit: 35,
    processing_time_days: 90,
    success_rate: 85
  },
  uk: {
    country: 'United Kingdom',
    ielts_min: 6.5,
    toefl_min: 90,
    gpa_min: 3.2,
    bank_balance_min: 12000,
    currency: 'GBP',
    work_experience_min: 2,
    age_limit: 30,
    processing_time_days: 60,
    success_rate: 78
  },
  usa: {
    country: 'United States',
    ielts_min: 6.5,
    toefl_min: 80,
    gpa_min: 3.5,
    bank_balance_min: 25000,
    currency: 'USD',
    work_experience_min: 2,
    age_limit: 30,
    processing_time_days: 120,
    success_rate: 65
  },
  australia: {
    country: 'Australia',
    ielts_min: 6.0,
    toefl_min: 79,
    gpa_min: 3.0,
    bank_balance_min: 15000,
    currency: 'AUD',
    work_experience_min: 1,
    age_limit: 40,
    processing_time_days: 75,
    success_rate: 82
  },
  germany: {
    country: 'Germany',
    ielts_min: 6.5,
    toefl_min: 90,
    gpa_min: 3.0,
    bank_balance_min: 11000,
    currency: 'EUR',
    work_experience_min: 1,
    age_limit: 35,
    processing_time_days: 45,
    success_rate: 88
  }
};

export default function VisaCalculator() {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [studentProfile, setStudentProfile] = useState({
    ielts_score: '',
    toefl_score: '',
    gpa: '',
    bank_balance: '',
    work_experience: '',
    age: '',
    nationality: '',
    study_level: '',
    program_field: ''
  });
  const [eligibility, setEligibility] = useState<VisaEligibility | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateEligibility = async () => {
    if (!selectedCountry || !studentProfile.ielts_score || !studentProfile.gpa) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const requirements = VISA_REQUIREMENTS[selectedCountry];
    const missing: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    let totalChecks = 0;

    // Check IELTS/TOEFL
    const ieltsScore = parseFloat(studentProfile.ielts_score);
    const toeflScore = parseFloat(studentProfile.toefl_score);
    const gpa = parseFloat(studentProfile.gpa);
    const bankBalance = parseFloat(studentProfile.bank_balance);
    const workExp = parseFloat(studentProfile.work_experience);
    const age = parseFloat(studentProfile.age);

    // IELTS Check
    if (ieltsScore >= requirements.ielts_min) {
      score += 20;
    } else {
      missing.push(`IELTS score below ${requirements.ielts_min} (you have ${ieltsScore})`);
      recommendations.push(`Improve IELTS score to at least ${requirements.ielts_min}`);
    }
    totalChecks += 20;

    // TOEFL Check (if provided)
    if (studentProfile.toefl_score) {
      if (toeflScore >= requirements.toefl_min) {
        score += 15;
      } else {
        missing.push(`TOEFL score below ${requirements.toefl_min} (you have ${toeflScore})`);
        recommendations.push(`Improve TOEFL score to at least ${requirements.toefl_min}`);
      }
      totalChecks += 15;
    }

    // GPA Check
    if (gpa >= requirements.gpa_min) {
      score += 20;
    } else {
      missing.push(`GPA below ${requirements.gpa_min} (you have ${gpa})`);
      recommendations.push(`Improve GPA to at least ${requirements.gpa_min}`);
    }
    totalChecks += 20;

    // Bank Balance Check
    if (bankBalance >= requirements.bank_balance_min) {
      score += 20;
    } else {
      missing.push(`Bank balance below ${requirements.currency} ${requirements.bank_balance_min.toLocaleString()} (you have ${requirements.currency} ${bankBalance.toLocaleString()})`);
      recommendations.push(`Increase bank balance to at least ${requirements.currency} ${requirements.bank_balance_min.toLocaleString()}`);
    }
    totalChecks += 20;

    // Work Experience Check
    if (workExp >= requirements.work_experience_min) {
      score += 15;
    } else {
      missing.push(`Work experience below ${requirements.work_experience_min} years (you have ${workExp})`);
      recommendations.push(`Gain more work experience (${requirements.work_experience_min} years required)`);
    }
    totalChecks += 15;

    // Age Check
    if (age <= requirements.age_limit) {
      score += 10;
    } else {
      missing.push(`Age above ${requirements.age_limit} (you are ${age})`);
      recommendations.push(`Consider countries with higher age limits`);
    }
    totalChecks += 10;

    const percentage = (score / totalChecks) * 100;
    const eligible = percentage >= 70 && missing.length <= 2;

    let probability: 'high' | 'medium' | 'low';
    if (percentage >= 85) probability = 'high';
    else if (percentage >= 70) probability = 'medium';
    else probability = 'low';

    // Add general recommendations
    if (studentProfile.nationality === 'Nigeria' || studentProfile.nationality === 'Ghana') {
      recommendations.push('Consider applying during off-peak seasons for better chances');
    }
    
    if (studentProfile.study_level === 'Master\'s') {
      recommendations.push('Highlight your research experience and academic achievements');
    }

    setEligibility({
      eligible,
      score: Math.round(percentage),
      missing_requirements: missing,
      recommendations,
      probability
    });

    setIsCalculating(false);
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getProbabilityIcon = (probability: string) => {
    switch (probability) {
      case 'high': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'low': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visa Eligibility Calculator</h2>
          <p className="text-muted-foreground">Check your visa eligibility for different countries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            Compare Countries
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="country">Select Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISA_REQUIREMENTS).map(([key, req]) => (
                    <SelectItem key={key} value={key}>
                      {req.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="ielts">IELTS Score</Label>
                <Input
                  id="ielts"
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  value={studentProfile.ielts_score}
                  onChange={(e) => setStudentProfile({ ...studentProfile, ielts_score: e.target.value })}
                  placeholder="e.g., 7.5"
                />
              </div>
              <div>
                <Label htmlFor="toefl">TOEFL Score (Optional)</Label>
                <Input
                  id="toefl"
                  type="number"
                  min="0"
                  max="120"
                  value={studentProfile.toefl_score}
                  onChange={(e) => setStudentProfile({ ...studentProfile, toefl_score: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  value={studentProfile.gpa}
                  onChange={(e) => setStudentProfile({ ...studentProfile, gpa: e.target.value })}
                  placeholder="e.g., 3.5"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="16"
                  max="50"
                  value={studentProfile.age}
                  onChange={(e) => setStudentProfile({ ...studentProfile, age: e.target.value })}
                  placeholder="e.g., 25"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bank_balance">Bank Balance</Label>
              <Input
                id="bank_balance"
                type="number"
                value={studentProfile.bank_balance}
                onChange={(e) => setStudentProfile({ ...studentProfile, bank_balance: e.target.value })}
                placeholder="e.g., 15000"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="work_experience">Work Experience (Years)</Label>
                <Input
                  id="work_experience"
                  type="number"
                  min="0"
                  max="20"
                  value={studentProfile.work_experience}
                  onChange={(e) => setStudentProfile({ ...studentProfile, work_experience: e.target.value })}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Select value={studentProfile.nationality} onValueChange={(value) => setStudentProfile({ ...studentProfile, nationality: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="South Africa">South Africa</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={calculateEligibility}
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Eligibility
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Eligibility Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligibility ? (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(eligibility.score)}`}>
                    {eligibility.score}%
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {getProbabilityIcon(eligibility.probability)}
                    <span className={`font-medium ${getProbabilityColor(eligibility.probability)}`}>
                      {eligibility.probability.toUpperCase()} PROBABILITY
                    </span>
                  </div>
                  <Progress value={eligibility.score} className="mt-4" />
                </div>

                {/* Eligibility Status */}
                <div className={`p-4 rounded-lg border ${eligibility.eligible ? 'bg-success-light border-success/40 dark:bg-success/10' : 'bg-destructive/10 border-destructive/40'}`}>
                  <div className="flex items-center gap-2">
                    {eligibility.eligible ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className={`font-medium ${eligibility.eligible ? 'text-success' : 'text-destructive'}`}>
                      {eligibility.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${eligibility.eligible ? 'text-success' : 'text-destructive'}`}>
                    {eligibility.eligible 
                      ? 'You meet the basic requirements for visa application'
                      : 'You need to improve some requirements before applying'
                    }
                  </p>
                </div>

                {/* Missing Requirements */}
                {eligibility.missing_requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-destructive mb-2">Missing Requirements:</h4>
                    <ul className="space-y-1">
                      {eligibility.missing_requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-destructive">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {eligibility.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-info mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {eligibility.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-info">
                          <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Country Requirements */}
                {selectedCountry && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Requirements for {VISA_REQUIREMENTS[selectedCountry].country}:</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>IELTS Minimum:</span>
                        <span className="font-medium">{VISA_REQUIREMENTS[selectedCountry].ielts_min}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GPA Minimum:</span>
                        <span className="font-medium">{VISA_REQUIREMENTS[selectedCountry].gpa_min}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bank Balance:</span>
                        <span className="font-medium">
                          {VISA_REQUIREMENTS[selectedCountry].currency} {VISA_REQUIREMENTS[selectedCountry].bank_balance_min.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Experience:</span>
                        <span className="font-medium">{VISA_REQUIREMENTS[selectedCountry].work_experience_min} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Age Limit:</span>
                        <span className="font-medium">{VISA_REQUIREMENTS[selectedCountry].age_limit} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Time:</span>
                        <span className="font-medium">{VISA_REQUIREMENTS[selectedCountry].processing_time_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-medium text-success">{VISA_REQUIREMENTS[selectedCountry].success_rate}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Calculate Your Eligibility</h3>
                <p className="text-muted-foreground">Fill in your details and click "Calculate Eligibility" to see your visa chances</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}