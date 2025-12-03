-- Allow partners to update universities in their own tenant
CREATE POLICY "Partners can update their university" 
ON public.universities 
FOR UPDATE 
USING (
  tenant_id = get_user_tenant(auth.uid()) 
  AND has_role(auth.uid(), 'partner'::app_role)
)
WITH CHECK (
  tenant_id = get_user_tenant(auth.uid()) 
  AND has_role(auth.uid(), 'partner'::app_role)
);

-- Allow partners to insert universities for their tenant (for first-time setup)
CREATE POLICY "Partners can create their university" 
ON public.universities 
FOR INSERT 
WITH CHECK (
  tenant_id = get_user_tenant(auth.uid()) 
  AND has_role(auth.uid(), 'partner'::app_role)
);