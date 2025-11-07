-- Allow university partners to view supporting records required for their dashboard
-- Enables partners to load agents and document requests scoped to their tenant

-- Grant partners read access to agent records in their tenant
CREATE POLICY "Partners can view agents in their tenant"
  ON public.agents
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.has_role(auth.uid(), 'partner'::app_role)
  );

-- Grant partners read access to document requests in their tenant
CREATE POLICY "Partners can view document requests in their tenant"
  ON public.document_requests
  FOR SELECT
  USING (
    tenant_id = public.get_user_tenant(auth.uid())
    AND public.has_role(auth.uid(), 'partner'::app_role)
  );
