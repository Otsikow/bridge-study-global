-- Add featured_listing_status column to universities table
ALTER TABLE universities ADD COLUMN IF NOT EXISTS featured_listing_status text;