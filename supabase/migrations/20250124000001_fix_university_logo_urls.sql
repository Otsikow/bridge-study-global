-- Fix university logo URLs
-- Remove incorrect /src/assets/ paths from logo_url field
-- These universities are handled by local imported assets in the frontend

UPDATE public.universities 
SET logo_url = NULL
WHERE logo_url LIKE '/src/assets/%';
