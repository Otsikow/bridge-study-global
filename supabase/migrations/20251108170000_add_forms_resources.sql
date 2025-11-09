-- Add 'forms' to the resource_content_type enum if it does not already exist
DO $$
BEGIN
  ALTER TYPE public.resource_content_type ADD VALUE IF NOT EXISTS 'forms';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Insert new form resources into the resource_library table
INSERT INTO public.resource_library (title, description, file_type, access_level, resource_type, storage_path, file_name, file_extension)
VALUES
  (
    'Student Application Form',
    'Standard form for prospective students to apply for university admission.',
    'pdf',
    'public',
    'forms',
    'forms/student-application-form.pdf',
    'student-application-form.pdf',
    'pdf'
  ),
  (
    'Agent Registration Form',
    'Online form for new agents to register with our platform.',
    'other',
    'agents',
    'forms',
    'https://forms.example.com/agent-registration',
    'Agent Registration Form',
    NULL
  ),
  (
    'Payment Claim Form',
    'Form for agents to claim commission payments.',
    'pdf',
    'agents',
    'forms',
    'forms/payment-claim-form.pdf',
    'payment-claim-form.pdf',
    'pdf'
  ),
  (
    'Referral Submission Form',
    'URL for submitting student referrals.',
    'other',
    'agents',
    'forms',
    'https://forms.example.com/referral-submission',
    'Referral Submission Form',
    NULL
  );
