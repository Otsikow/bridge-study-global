-- Add missing fields for Profile & Settings page

-- Add referral_code to agents table if not exists
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Generate referral codes for existing agents
UPDATE public.agents 
SET referral_code = 'REF-' || SUBSTRING(id::text, 1, 8)
WHERE referral_code IS NULL;

-- Add country to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  application_updates BOOLEAN DEFAULT TRUE,
  document_reminders BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_documents table for document uploads
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 
  'profile-photos', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents', 
  'user-documents', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for user_documents
CREATE POLICY "Users can view their own documents"
  ON public.user_documents FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
  ON public.user_documents FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON public.user_documents FOR DELETE
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all documents"
  ON public.user_documents FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

-- Storage policies for profile photos
CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view all profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for user documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_profile ON public.notification_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_profile ON public.user_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_tenant ON public.user_documents(tenant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
