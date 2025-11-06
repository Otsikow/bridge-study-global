-- Track engagement events for analytics dashboard insights
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_source TEXT,
  event_properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.analytics_events IS 'Stores engagement events for analytics dashboards and reporting.';
COMMENT ON COLUMN public.analytics_events.event_name IS 'Event identifier, e.g., visa_calculator_card_click.';
COMMENT ON COLUMN public.analytics_events.event_source IS 'Component or surface where the event originated.';
COMMENT ON COLUMN public.analytics_events.event_properties IS 'Additional metadata captured with the event.';

CREATE INDEX IF NOT EXISTS analytics_events_event_name_created_at_idx
  ON public.analytics_events (event_name, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_events_insert_policy
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY analytics_events_select_policy
  ON public.analytics_events
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

GRANT INSERT ON public.analytics_events TO anon;
GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
