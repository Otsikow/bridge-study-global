DO $$
BEGIN
  ALTER TYPE payment_purpose ADD VALUE 'featured_listing';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create status enum for featured listing lifecycle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'featured_listing_status'
  ) THEN
    CREATE TYPE featured_listing_status AS ENUM ('inactive', 'pending', 'active', 'expired', 'cancelled');
  END IF;
END $$;

-- Table to track featured listing purchases from universities
CREATE TABLE IF NOT EXISTS public.featured_listing_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status featured_listing_status NOT NULL DEFAULT 'pending',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  summary TEXT,
  highlight TEXT,
  image_url TEXT,
  priority INTEGER,
  notes TEXT,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_listing_orders_tenant ON public.featured_listing_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_featured_listing_orders_university ON public.featured_listing_orders(university_id);

CREATE TRIGGER trg_update_featured_listing_orders_updated_at
  BEFORE UPDATE ON public.featured_listing_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend universities with lifecycle metadata for featured listings
ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_listing_status featured_listing_status DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS featured_listing_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_listing_last_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_listing_current_order_id UUID REFERENCES public.featured_listing_orders(id) ON DELETE SET NULL;

-- Seed lifecycle column based on existing featured flag
UPDATE public.universities
SET featured_listing_status = CASE WHEN featured IS TRUE THEN 'active' ELSE 'inactive' END
WHERE featured_listing_status IS NULL;

-- RLS for featured listing orders
ALTER TABLE public.featured_listing_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can view featured listing orders" ON public.featured_listing_orders;
CREATE POLICY "Partners can view featured listing orders"
  ON public.featured_listing_orders
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.has_role(auth.uid(), 'partner'::app_role)
  );

DROP POLICY IF EXISTS "Admins manage featured listing orders" ON public.featured_listing_orders;
CREATE POLICY "Admins manage featured listing orders"
  ON public.featured_listing_orders
  FOR ALL
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- Ensure public featured query respects lifecycle
CREATE OR REPLACE FUNCTION public.get_public_featured_universities(p_tenant_slug TEXT DEFAULT 'unidoxia')
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  city TEXT,
  website TEXT,
  logo_url TEXT,
  featured BOOLEAN,
  featured_priority INTEGER,
  featured_summary TEXT,
  featured_highlight TEXT,
  featured_image_url TEXT
)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT
    u.id,
    u.name,
    u.country,
    u.city,
    u.website,
    u.logo_url,
    u.featured,
    u.featured_priority,
    u.featured_summary,
    u.featured_highlight,
    u.featured_image_url
  FROM public.universities u
  JOIN public.tenants t ON u.tenant_id = t.id
  WHERE t.slug = COALESCE(p_tenant_slug, 'unidoxia')
    AND COALESCE(u.featured, FALSE) = TRUE
    AND COALESCE(u.active, TRUE) = TRUE
    AND COALESCE(u.featured_listing_status, 'inactive') IN ('active', 'pending')
  ORDER BY COALESCE(u.featured_priority, 9999), u.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_featured_universities(TEXT) TO anon, authenticated;
