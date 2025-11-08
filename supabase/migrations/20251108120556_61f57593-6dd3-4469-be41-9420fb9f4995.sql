-- Add featured_listing_expires_at column to universities table
ALTER TABLE universities ADD COLUMN IF NOT EXISTS featured_listing_expires_at timestamp with time zone;