-- Add spotlight image column to universities
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Ensure the public helper without parameters returns the image URL
CREATE OR REPLACE FUNCTION public.get_public_featured_universities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  city TEXT,
  logo_url TEXT,
  featured_summary TEXT,
  featured_highlight TEXT,
  featured_priority INTEGER,
  featured_image_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    name,
    country,
    city,
    logo_url,
    featured_summary,
    featured_highlight,
    featured_priority,
    featured_image_url
  FROM public.universities
  WHERE featured = TRUE
    AND active = TRUE
  ORDER BY featured_priority DESC, name ASC;
$$;

-- Ensure the tenant-aware helper also returns the image URL
CREATE OR REPLACE FUNCTION public.get_public_featured_universities(p_tenant_slug TEXT DEFAULT 'geg')
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  city TEXT,
  logo_url TEXT,
  website TEXT,
  ranking JSONB,
  featured BOOLEAN,
  featured_priority INTEGER,
  featured_summary TEXT,
  featured_highlight TEXT,
  featured_image_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.name,
    u.country,
    u.city,
    u.logo_url,
    u.website,
    u.ranking,
    u.featured,
    u.featured_priority,
    u.featured_summary,
    u.featured_highlight,
    u.featured_image_url
  FROM public.universities u
  JOIN public.tenants t ON t.id = u.tenant_id
  WHERE t.slug = COALESCE(NULLIF(p_tenant_slug, ''), 'geg')
    AND u.active IS TRUE
    AND u.featured IS TRUE
  ORDER BY COALESCE(u.featured_priority, 9999), u.name ASC
  LIMIT 12;
$$;

COMMENT ON FUNCTION public.get_public_featured_universities(TEXT)
  IS 'Returns the list of featured universities for a tenant so it can be displayed on the public marketing site.';

GRANT EXECUTE ON FUNCTION public.get_public_featured_universities(TEXT) TO anon, authenticated;
