-- Create a helper function that exposes featured universities for the marketing site
-- without requiring an authenticated Supabase session. The function runs with elevated
-- privileges so that it can bypass the tenant-based row level security that is applied
-- to the universities table.
CREATE OR REPLACE FUNCTION public.get_public_featured_universities(p_tenant_slug text DEFAULT 'geg')
RETURNS TABLE (
  id uuid,
  name text,
  country text,
  city text,
  logo_url text,
  website text,
  ranking jsonb,
  featured boolean,
  featured_priority integer,
  featured_summary text,
  featured_highlight text
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
    u.featured_highlight
  FROM public.universities u
  JOIN public.tenants t ON t.id = u.tenant_id
  WHERE
    t.slug = COALESCE(NULLIF(p_tenant_slug, ''), 'geg')
    AND u.active IS TRUE
    AND u.featured IS TRUE
  ORDER BY
    COALESCE(u.featured_priority, 9999),
    u.name ASC
  LIMIT 12;
$$;

COMMENT ON FUNCTION public.get_public_featured_universities(text)
  IS 'Returns the list of featured universities for a tenant so it can be displayed on the public marketing site.';

GRANT EXECUTE ON FUNCTION public.get_public_featured_universities(text) TO anon, authenticated;
