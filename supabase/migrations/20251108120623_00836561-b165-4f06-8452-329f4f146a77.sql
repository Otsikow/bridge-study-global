-- Add featured_listing_current_order_id column to universities table  
ALTER TABLE universities ADD COLUMN IF NOT EXISTS featured_listing_current_order_id uuid;