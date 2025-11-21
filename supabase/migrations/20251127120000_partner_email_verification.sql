-- Add a database-level flag to track partner email verification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS partner_email_verified BOOLEAN DEFAULT FALSE;
