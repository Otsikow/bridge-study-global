-- Add featured_listing_last_paid_at column to universities table  
ALTER TABLE universities ADD COLUMN IF NOT EXISTS featured_listing_last_paid_at timestamp with time zone;