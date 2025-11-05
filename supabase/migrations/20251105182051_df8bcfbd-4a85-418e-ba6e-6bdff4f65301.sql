-- Add missing columns to conversation_messages
ALTER TABLE public.conversation_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL;

-- Add missing columns to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT false;

-- Add featured columns to universities
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_summary TEXT,
ADD COLUMN IF NOT EXISTS featured_highlight TEXT;

-- Create user_presence table
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_presence
CREATE POLICY "Anyone can view user presence"
  ON public.user_presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON public.user_presence FOR ALL
  USING (user_id = auth.uid());

-- Enable realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create function for featured universities
CREATE OR REPLACE FUNCTION public.get_public_featured_universities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  city TEXT,
  logo_url TEXT,
  featured_summary TEXT,
  featured_highlight TEXT,
  featured_priority INTEGER
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
    featured_priority
  FROM universities
  WHERE featured = true AND active = true
  ORDER BY featured_priority DESC, name ASC;
$$;