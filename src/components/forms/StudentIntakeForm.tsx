import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  DollarSign,
  Globe,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  QrCode,
  Share2,
  Copy,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface IntakeFormData {
  // Personal Information
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  gender: string;
  marital_status: string;
  
  // Address Information
  current_address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  
  // Education History
  education_history: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    gpa: string;
    country: string;
  }>;
  
  // Test Scores
  test_scores: {
    ielts: {
      overall: string;
      listening: string;
      reading: string;
      writing: string;
      speaking: string;
      test_date: string;
    };
    toefl: {
      overall: string;
      test_date: string;
    };
    gre: {
      verbal: string;
      quantitative: string;
      analytical: string;
      test_date: string;
    };
    gmat: {
      overall: string;
      test_date: string;
    };
  };
  
  // Study Preferences
  study_preferences: {
    preferred_countries: string[];
    preferred_programs: string[];
    preferred_universities: string[];
    budget_range: string;
    intake_preference: string;
    study_level: string;
  };
  
  // Work Experience
  work_experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    country: string;
  }>;
  
  // Additional Information
  additional_info: {
    motivation: string;
    career_goals: string;
    special_requirements: string;
    how_did_you_hear: string;
    referral_code: string;
  };
}

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Tunisia',
  'Algeria', 'Ethiopia', 'Uganda', 'Tanzania', 'Rwanda', 'Senegal', 'Ivory Coast',
  'Cameroon', 'Zimbabwe', 'Botswana', 'Namibia', 'Mauritius', 'Other'
];

const STUDY_LEVELS = [
  'High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Certificate'
];

const PROGRAM_FIELDS = [
  'Business Administration', 'Computer Science', 'Engineering', 'Medicine',
  'Law', 'Arts & Humanities', 'Sciences', 'Social Sciences', 'Education',
  'Health Sciences', 'Agriculture', 'Architecture', 'Other'
];

const BUDGET_RANGES = [
  'Under $10,000', '$10,000 - $25,000', '$25,000 - $50,000',
  '$50,000 - $100,000', 'Over $100,000'
];

const INTAKE_PREFERENCES = [
  'January 2025', 'September 2025', 'January 2026', 'September 2026',
  'Flexible', 'As soon as possible'
];

export default function StudentIntakeForm() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<IntakeFormData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    passport_number: '',
    gender: '',
    marital_status: '',
    current_address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    },
    education_history: [{
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      gpa: '',
      country: ''
    }],
    test_scores: {
      ielts: { overall: '', listening: '', reading: '', writing: '', speaking: '', test_date: '' },
      toefl: { overall: '', test_date: '' },
      gre: { verbal: '', quantitative: '', analytical: '', test_date: '' },
      gmat: { overall: '', test_date: '' }
    },
    study_preferences: {
      preferred_countries: [],
      preferred_programs: [],
      preferred_universities: [],
      budget_range: '',
      intake_preference: '',
      study_level: ''
    },
    work_experience: [],
    additional_info: {
      motivation: '',
      career_goals: '',
      special_requirements: '',
      how_did_you_hear: '',
      referral_code: ''
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (profile?.email) {
      setFormData(prev => ({
        ...prev,
        email: profile.email || '',
        full_name: profile.full_name || ''
      }));
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof IntakeFormData],
        [childField]: value
      }
    }));
  };

  const handleArrayInputChange = (field: string, index: number, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof IntakeFormData].map((item: any, i: number) => 
        i === index ? { ...item, [childField]: value } : item
      )
    }));
  };

  const addEducationEntry = () => {
    setFormData(prev => ({
      ...prev,
      education_history: [...prev.education_history, {
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        gpa: '',
        country: ''
      }]
    }));
  };

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, {
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: '',
        country: ''
      }]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof IntakeFormData].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleMultiSelect = (field: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field as keyof IntakeFormData] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      // Create or update student profile
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .upsert({
          profile_id: profile?.id,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
          passport_number: formData.passport_number,
          address: formData.current_address,
          education_history: formData.education_history,
          test_scores: formData.test_scores,
          guardian: {
            motivation: formData.additional_info.motivation,
            career_goals: formData.additional_info.career_goals,
            special_requirements: formData.additional_info.special_requirements
          }
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Create lead record
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          student_id: studentData.id,
          source: formData.additional_info.how_did_you_hear,
          referral_code: formData.additional_info.referral_code,
          study_preferences: formData.study_preferences,
          work_experience: formData.work_experience,
          status: 'new',
          form_data: formData
        })
        .select()
        .single();

      if (leadError) throw leadError;

      setFormId(leadData.id);
      toast({
        title: 'Success',
        description: 'Intake form submitted successfully!'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit form. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/intake/${formId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied',
      description: 'Form link copied to clipboard'
    });
  };

  const generateQRCode = () => {
    // In a real implementation, you would generate a QR code
    toast({
      title: 'QR Code Generated',
      description: 'QR code has been generated for sharing'
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>
        <div>
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="passport_number">Passport Number</Label>
          <Input
            id="passport_number"
            value={formData.passport_number}
            onChange={(e) => handleInputChange('passport_number', e.target.value)}
            placeholder="Enter passport number"
          />
        </div>
        <div>
          <Label>Gender</Label>
          <RadioGroup value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label htmlFor="marital_status">Marital Status</Label>
          <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Current Address</h3>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            value={formData.current_address.street}
            onChange={(e) => handleNestedInputChange('current_address', 'street', e.target.value)}
            placeholder="Enter street address"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.current_address.city}
              onChange={(e) => handleNestedInputChange('current_address', 'city', e.target.value)}
              placeholder="Enter city"
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={formData.current_address.state}
              onChange={(e) => handleNestedInputChange('current_address', 'state', e.target.value)}
              placeholder="Enter state/province"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select 
              value={formData.current_address.country} 
              onValueChange={(value) => handleNestedInputChange('current_address', 'country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.current_address.postal_code}
              onChange={(e) => handleNestedInputChange('current_address', 'postal_code', e.target.value)}
              placeholder="Enter postal code"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Education History</h3>
        <Button type="button" variant="outline" onClick={addEducationEntry}>
          <GraduationCap className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>
      {formData.education_history.map((education, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Education #{index + 1}</h4>
                {formData.education_history.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('education_history', index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Institution Name</Label>
                  <Input
                    value={education.institution}
                    onChange={(e) => handleArrayInputChange('education_history', index, 'institution', e.target.value)}
                    placeholder="Enter institution name"
                  />
                </div>
                <div>
                  <Label>Degree/Qualification</Label>
                  <Input
                    value={education.degree}
                    onChange={(e) => handleArrayInputChange('education_history', index, 'degree', e.target.value)}
                    placeholder="Enter degree/qualification"
                  />
                </div>
                <div>
                  <Label>Field of Study</Label>
                  <Select 
                    value={education.field_of_study} 
                    onValueChange={(value) => handleArrayInputChange('education_history', index, 'field_of_study', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field of study" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_FIELDS.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country</Label>
                  <Select 
                    value={education.country} 
                    onValueChange={(value) => handleArrayInputChange('education_history', index, 'country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={education.start_date}
                    onChange={(e) => handleArrayInputChange('education_history', index, 'start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={education.end_date}
                    onChange={(e) => handleArrayInputChange('education_history', index, 'end_date', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>GPA/Score</Label>
                  <Input
                    value={education.gpa}
                    onChange={(e) => handleArrayInputChange('education_history', index, 'gpa', e.target.value)}
                    placeholder="Enter GPA or final score"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Test Scores</h3>
      
      {/* IELTS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">IELTS Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Overall Score</Label>
              <Input
                value={formData.test_scores.ielts.overall}
                onChange={(e) => handleNestedInputChange('test_scores', 'ielts', { ...formData.test_scores.ielts, overall: e.target.value })}
                placeholder="e.g., 7.5"
              />
            </div>
            <div>
              <Label>Listening</Label>
              <Input
                value={formData.test_scores.ielts.listening}
                onChange={(e) => handleNestedInputChange('test_scores', 'ielts', { ...formData.test_scores.ielts, listening: e.target.value })}
                placeholder="e.g., 8.0"
              />
            </div>
            <div>
              <Label>Reading</Label>
              <Input
                value={formData.test_scores.ielts.reading}
                onChange={(e) => handleNestedInputChange('test_scores', 'ielts', { ...formData.test_scores.ielts, reading: e.target.value })}
                placeholder="e.g., 7.0"
              />
            </div>
            <div>
              <Label>Writing</Label>
              <Input
                value={formData.test_scores.ielts.writing}
                onChange={(e) => handleNestedInputChange('test_scores', 'ielts', { ...formData.test_scores.ielts, writing: e.target.value })}
                placeholder="e.g., 6.5"
              />
            </div>
            <div>
              <Label>Speaking</Label>
              <Input
                value={formData.test_scores.ielts.speaking}
                onChange={(e) => handleNestedInputChange('test_scores', 'ielts', { ...formData.test_scores.ielts, speaking: e.target.value })}
                placeholder="e.g., 7.5"
              />
            </div>
            <div>
              <Label>Test Date</Label>
              <Input
                type="date"
                value={formData.test_scores.ielts.test_date}
                onChange={(e) => handleNestedInputChange('test_scores', 'ielts', { ...formData.test_scores.ielts, test_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TOEFL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">TOEFL Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Overall Score</Label>
              <Input
                value={formData.test_scores.toefl.overall}
                onChange={(e) => handleNestedInputChange('test_scores', 'toefl', { ...formData.test_scores.toefl, overall: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label>Test Date</Label>
              <Input
                type="date"
                value={formData.test_scores.toefl.test_date}
                onChange={(e) => handleNestedInputChange('test_scores', 'toefl', { ...formData.test_scores.toefl, test_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Study Preferences</h3>
      
      <div className="space-y-4">
        <div>
          <Label>Preferred Countries (Select all that apply)</Label>
          <div className="grid gap-2 md:grid-cols-3 mt-2">
            {COUNTRIES.map(country => (
              <div key={country} className="flex items-center space-x-2">
                <Checkbox
                  id={country}
                  checked={formData.study_preferences.preferred_countries.includes(country)}
                  onCheckedChange={() => handleMultiSelect('preferred_countries', country)}
                />
                <Label htmlFor={country} className="text-sm">{country}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Preferred Study Level</Label>
          <Select 
            value={formData.study_preferences.study_level} 
            onValueChange={(value) => handleNestedInputChange('study_preferences', 'study_level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select study level" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Budget Range</Label>
          <Select 
            value={formData.study_preferences.budget_range} 
            onValueChange={(value) => handleNestedInputChange('study_preferences', 'budget_range', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map(range => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Intake Preference</Label>
          <Select 
            value={formData.study_preferences.intake_preference} 
            onValueChange={(value) => handleNestedInputChange('study_preferences', 'intake_preference', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select intake preference" />
            </SelectTrigger>
            <SelectContent>
              {INTAKE_PREFERENCES.map(intake => (
                <SelectItem key={intake} value={intake}>{intake}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Additional Information</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="motivation">Motivation for Studying Abroad</Label>
          <Textarea
            id="motivation"
            value={formData.additional_info.motivation}
            onChange={(e) => handleNestedInputChange('additional_info', 'motivation', e.target.value)}
            placeholder="Tell us why you want to study abroad..."
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="career_goals">Career Goals</Label>
          <Textarea
            id="career_goals"
            value={formData.additional_info.career_goals}
            onChange={(e) => handleNestedInputChange('additional_info', 'career_goals', e.target.value)}
            placeholder="Describe your career aspirations..."
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="special_requirements">Special Requirements</Label>
          <Textarea
            id="special_requirements"
            value={formData.additional_info.special_requirements}
            onChange={(e) => handleNestedInputChange('additional_info', 'special_requirements', e.target.value)}
            placeholder="Any special requirements or accommodations needed..."
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="how_did_you_hear">How did you hear about us?</Label>
          <Select 
            value={formData.additional_info.how_did_you_hear} 
            onValueChange={(value) => handleNestedInputChange('additional_info', 'how_did_you_hear', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="agent">Education Agent</SelectItem>
              <SelectItem value="university">University Partner</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="referral_code">Referral Code (if any)</Label>
          <Input
            id="referral_code"
            value={formData.additional_info.referral_code}
            onChange={(e) => handleNestedInputChange('additional_info', 'referral_code', e.target.value)}
            placeholder="Enter referral code"
          />
        </div>
      </div>
    </div>
  );

  const renderShareOptions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Intake Form
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={`${window.location.origin}/intake/${formId}`}
            readOnly
            className="flex-1"
          />
          <Button variant="outline" onClick={copyFormLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateQRCode}>
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Embed Widget
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (formId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for completing the intake form. We'll review your information and get back to you soon.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setShowShareOptions(!showShareOptions)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Form
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Form
            </Button>
          </div>
        </div>
        
        {showShareOptions && renderShareOptions()}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Form Steps */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="1">Personal</TabsTrigger>
              <TabsTrigger value="2">Address</TabsTrigger>
              <TabsTrigger value="3">Education</TabsTrigger>
              <TabsTrigger value="4">Test Scores</TabsTrigger>
              <TabsTrigger value="5">Preferences</TabsTrigger>
              <TabsTrigger value="6">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="mt-6">
              {renderStep1()}
            </TabsContent>
            <TabsContent value="2" className="mt-6">
              {renderStep2()}
            </TabsContent>
            <TabsContent value="3" className="mt-6">
              {renderStep3()}
            </TabsContent>
            <TabsContent value="4" className="mt-6">
              {renderStep4()}
            </TabsContent>
            <TabsContent value="5" className="mt-6">
              {renderStep5()}
            </TabsContent>
            <TabsContent value="6" className="mt-6">
              {renderStep6()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}>
              Next
            </Button>
          ) : (
            <Button onClick={submitForm} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}