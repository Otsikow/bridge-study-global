import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, logError, formatErrorForToast } from '@/lib/errorUtils';
import BackButton from '@/components/BackButton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CheckCircle, Loader2 } from 'lucide-react';

// Import step components
import PersonalInfoStep from '@/components/application/PersonalInfoStep';
import EducationHistoryStep from '@/components/application/EducationHistoryStep';
import ProgramSelectionStep from '@/components/application/ProgramSelectionStep';
import DocumentsUploadStep from '@/components/application/DocumentsUploadStep';
import ReviewSubmitStep from '@/components/application/ReviewSubmitStep';

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Your basic details' },
  { id: 2, title: 'Education History', description: 'Academic background' },
  { id: 3, title: 'Desired Course', description: 'Select your program' },
  { id: 4, title: 'Documents', description: 'Upload required files' },
  { id: 5, title: 'Review & Submit', description: 'Final review' },
];

export interface ApplicationFormData {
  // Personal Information
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    passportNumber: string;
    currentCountry: string;
    address: string;
  };
  // Education History
  educationHistory: Array<{
    id: string;
    level: string;
    institutionName: string;
    country: string;
    startDate: string;
    endDate: string;
    gpa: string;
    gradeScale: string;
  }>;
  // Program Selection
  programSelection: {
    programId: string;
    intakeYear: number;
    intakeMonth: number;
    intakeId?: string;
  };
  // Documents
  documents: {
    transcript: File | null;
    passport: File | null;
    ielts: File | null;
    sop: File | null;
  };
  // Additional
  notes: string;
}

const DRAFT_STORAGE_KEY = 'application_draft';

export default function NewApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programIdFromUrl = searchParams.get('program');
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState<ApplicationFormData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      passportNumber: '',
      currentCountry: '',
      address: '',
    },
    educationHistory: [],
    programSelection: {
      programId: programIdFromUrl || '',
      intakeYear: new Date().getFullYear(),
      intakeMonth: 1,
    },
    documents: {
      transcript: null,
      passport: null,
      ielts: null,
      sop: null,
    },
    notes: '',
  });

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        toast({
          title: 'Draft Loaded',
          description: 'Your previous progress has been restored.',
        });
      } catch (error) {
        console.error('Failed to parse saved draft:', error);
      }
    }
  }, [toast]);

  // Fetch student data and pre-fill personal info
  const fetchStudentData = useCallback(async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        toast({
          title: 'Profile Required',
          description: 'Please complete your student profile first.',
          variant: 'destructive',
        });
        navigate('/student/onboarding');
        return;
      }

      setStudentId(studentData.id);

      // Pre-fill personal information
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          fullName: studentData.legal_name || profile?.full_name || '',
          email: studentData.contact_email || profile?.email || '',
          phone: studentData.contact_phone || profile?.phone || '',
          dateOfBirth: studentData.date_of_birth || '',
          nationality: studentData.nationality || '',
          passportNumber: studentData.passport_number || '',
          currentCountry: studentData.current_country || '',
          address: (studentData.address as any)?.street || '',
        },
      }));

      // Fetch education records
      const { data: eduRecords, error: eduError } = await supabase
        .from('education_records')
        .select('*')
        .eq('student_id', studentData.id)
        .order('start_date', { ascending: false });

      if (eduError) throw eduError;

      if (eduRecords && eduRecords.length > 0) {
        setFormData((prev) => ({
          ...prev,
          educationHistory: eduRecords.map((record) => ({
            id: record.id,
            level: record.level,
            institutionName: record.institution_name,
            country: record.country,
            startDate: record.start_date,
            endDate: record.end_date || '',
            gpa: record.gpa?.toString() || '',
            gradeScale: record.grade_scale || '',
          })),
        }));
      }
    } catch (error) {
      logError(error, 'NewApplication.fetchStudentData');
      toast(formatErrorForToast(error, 'Failed to load student data'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile, navigate, toast]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user, fetchStudentData]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      // Create a serializable version without File objects
      const serializableData = {
        ...formData,
        documents: {
          transcript: null,
          passport: null,
          ielts: null,
          sop: null,
        },
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serializableData));
      toast({
        title: 'Draft Saved',
        description: 'Your progress has been saved.',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      });
    }
  }, [formData, toast]);

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!studentId || !formData.programSelection.programId) {
      toast({
        title: 'Error',
        description: 'Missing required information',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get tenant ID from profile
      const tenantId = profile?.tenant_id || '00000000-0000-0000-0000-000000000001';

      // Create application
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .insert({
          student_id: studentId,
          program_id: formData.programSelection.programId,
          intake_year: formData.programSelection.intakeYear,
          intake_month: formData.programSelection.intakeMonth,
          intake_id: formData.programSelection.intakeId || null,
          status: 'submitted',
          notes: formData.notes || null,
          tenant_id: tenantId,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (appError) throw appError;

      setApplicationId(applicationData.id);

      // Upload documents to storage and create document records
      const documentTypes = ['transcript', 'passport', 'ielts', 'sop'] as const;
      
      for (const docType of documentTypes) {
        const file = formData.documents[docType];
        if (file) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${docType}_${Date.now()}.${fileExt}`;
            const filePath = `${applicationData.id}/${fileName}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('application-documents')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error(`Failed to upload ${docType}:`, uploadError);
              continue; // Continue with other documents
            }

            // Create document record
            await supabase.from('application_documents').insert({
              application_id: applicationData.id,
              document_type: docType,
              storage_path: filePath,
              file_size: file.size,
              mime_type: file.type,
            });
          } catch (error) {
            console.error(`Error processing ${docType}:`, error);
          }
        }
      }

      // Get program details for notifications
      const { data: programData } = await supabase
        .from('programs')
        .select('*, university:universities(*)')
        .eq('id', formData.programSelection.programId)
        .single();

      // Send notification to agent if assigned
      const { data: assignmentData } = await supabase
        .from('student_assignments')
        .select('counselor_id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (assignmentData?.counselor_id) {
        await supabase.from('notifications').insert({
          user_id: assignmentData.counselor_id,
          tenant_id: tenantId,
          template_key: 'new_application',
          subject: 'New Application Submitted',
          body: `A new application has been submitted for ${programData?.name || 'a program'}.`,
          channel: 'in_app',
          status: 'pending',
        });
      }

      // Clear draft from localStorage
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      logError(error, 'NewApplication.handleSubmit');
      toast(formatErrorForToast(error, 'Failed to submit application'));
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <BackButton variant="ghost" size="sm" className="mb-4" fallback="/dashboard" />

      {/* Header */}
      <div className="space-y-1.5 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
          New Application
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Complete all steps to submit your application
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center flex-1 ${
                  step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${
                    step.id < currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'border-primary bg-background'
                      : 'border-muted bg-background'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span className="text-xs text-center hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="animate-fade-in">
        {currentStep === 1 && (
          <PersonalInfoStep
            data={formData.personalInfo}
            onChange={(data) => setFormData((prev) => ({ ...prev, personalInfo: data }))}
            onNext={goToNextStep}
          />
        )}
        {currentStep === 2 && (
          <EducationHistoryStep
            data={formData.educationHistory}
            onChange={(data) => setFormData((prev) => ({ ...prev, educationHistory: data }))}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}
        {currentStep === 3 && (
          <ProgramSelectionStep
            data={formData.programSelection}
            onChange={(data) => setFormData((prev) => ({ ...prev, programSelection: data }))}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}
        {currentStep === 4 && (
          <DocumentsUploadStep
            data={formData.documents}
            onChange={(data) => setFormData((prev) => ({ ...prev, documents: data }))}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}
        {currentStep === 5 && (
          <ReviewSubmitStep
            formData={formData}
            onBack={goToPreviousStep}
            onSubmit={handleSubmit}
            submitting={submitting}
            onNotesChange={(notes) => setFormData((prev) => ({ ...prev, notes }))}
          />
        )}
      </div>

      {/* Save Draft Button */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={saveDraft} className="w-full sm:w-auto">
            Save & Continue Later
          </Button>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Application Submitted!</DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <p>
                Your application has been successfully submitted. You will receive updates via
                email and notifications.
              </p>
              {applicationId && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Application Tracking ID:</p>
                  <p className="text-lg font-mono font-bold">{applicationId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={() => navigate(`/student/applications/${applicationId}`)}
              className="flex-1"
            >
              View Application
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/student/applications')}
              className="flex-1"
            >
              My Applications
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
