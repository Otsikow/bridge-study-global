-- Add RLS policy for partners to manage programs for their university
-- Partners should be able to insert, update, and delete programs

-- Policy: Partners can insert programs for their university
CREATE POLICY "Partners can insert programs"
ON public.programs
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'partner'
  )
);

-- Policy: Partners can update programs in their tenant
CREATE POLICY "Partners can update programs"
ON public.programs
FOR UPDATE
USING (
  tenant_id = get_user_tenant(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'partner'
  )
)
WITH CHECK (
  tenant_id = get_user_tenant(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'partner'
  )
);

-- Policy: Partners can delete programs in their tenant
CREATE POLICY "Partners can delete programs"
ON public.programs
FOR DELETE
USING (
  tenant_id = get_user_tenant(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'partner'
  )
);

-- Also allow partners to view all programs (active and inactive) in their tenant
CREATE POLICY "Partners can view all programs in their tenant"
ON public.programs
FOR SELECT
USING (
  tenant_id = get_user_tenant(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'partner'
  )
);