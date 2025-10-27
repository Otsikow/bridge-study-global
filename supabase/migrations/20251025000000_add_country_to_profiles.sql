-- Migration: Add country field to profiles table
-- Description: Adds country field to support user location tracking for better personalization

-- Add country column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add index for country field to improve query performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.country IS 'User country for location-based features and analytics';
