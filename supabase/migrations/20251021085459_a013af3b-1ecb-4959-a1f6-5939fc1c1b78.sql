-- Create storage bucket for partnership documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('partnership-documents', 'partnership-documents', false);

-- Create partnership_applications table
CREATE TABLE public.partnership_applications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  
  -- University Information
  university_name text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  website text,
  
  -- Contact Information
  primary_contact_name text NOT NULL,
  primary_contact_email text NOT NULL,
  primary_contact_phone text,
  primary_contact_position text,
  
  -- Programs and Requirements
  programs_offered jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_student_demographics text,
  partnership_terms text,
  
  -- Documents
  accreditation_document_url text,
  brochure_document_url text,
  additional_documents jsonb DEFAULT '[]'::jsonb,
  
  -- Status and Metadata
  status text NOT NULL DEFAULT 'pending',
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.partnership_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public application)
CREATE POLICY "Anyone can submit partnership applications"
ON public.partnership_applications
FOR INSERT
WITH CHECK (true);

-- Staff can view and manage all applications
CREATE POLICY "Staff can view all applications"
ON public.partnership_applications
FOR SELECT
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Staff can update applications"
ON public.partnership_applications
FOR UPDATE
USING (public.is_admin_or_staff(auth.uid()));

-- Storage policies for partnership documents
CREATE POLICY "Anyone can upload partnership documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'partnership-documents');

CREATE POLICY "Staff can view partnership documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partnership-documents' AND public.is_admin_or_staff(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_partnership_applications_updated_at
BEFORE UPDATE ON public.partnership_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_partnership_applications_status ON public.partnership_applications(status);
CREATE INDEX idx_partnership_applications_created_at ON public.partnership_applications(created_at DESC);