-- Zoe knowledge base, retrieval RPC, and chat analytics tables

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "vector";

-- Knowledge base entries that power Zoe's retrieval-augmented responses
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT ARRAY['general'],
  locale TEXT NOT NULL DEFAULT 'en',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_type TEXT NOT NULL DEFAULT 'internal',
  source_url TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_audience ON public.knowledge_base USING GIN (audience);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_locale ON public.knowledge_base(locale);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON public.knowledge_base USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_verified ON public.knowledge_base(verified);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding
  ON public.knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Keep updated_at fresh
CREATE TRIGGER trg_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce row level security with admin visibility
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read knowledge base"
  ON public.knowledge_base
  FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins manage knowledge base"
  ON public.knowledge_base
  FOR ALL
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- Retrieval RPC for vector search with optional filters
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding VECTOR(1536),
  match_count INTEGER DEFAULT 6,
  match_threshold DOUBLE PRECISION DEFAULT 0.70,
  audience_filter TEXT[] DEFAULT NULL,
  locale_filter TEXT DEFAULT NULL,
  tenant_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  content TEXT,
  source_url TEXT,
  source_type TEXT,
  audience TEXT[],
  locale TEXT,
  tags TEXT[],
  similarity DOUBLE PRECISION,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
AS
$$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.category,
    kb.content,
    kb.source_url,
    kb.source_type,
    kb.audience,
    kb.locale,
    kb.tags,
    1 - (kb.embedding <=> query_embedding) AS similarity,
    kb.metadata
  FROM public.knowledge_base kb
  WHERE kb.embedding IS NOT NULL
    AND kb.verified IS TRUE
    AND (kb.expires_at IS NULL OR kb.expires_at > NOW())
    AND (tenant_filter IS NULL OR kb.tenant_id = tenant_filter)
    AND (audience_filter IS NULL OR kb.audience && audience_filter)
    AND (
      locale_filter IS NULL OR
      kb.locale = locale_filter OR
      kb.locale ILIKE CONCAT(locale_filter, '-%')
    )
    AND (
      match_threshold IS NULL OR
      1 - (kb.embedding <=> query_embedding) >= match_threshold
    )
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

ALTER FUNCTION public.match_knowledge(
  VECTOR(1536), INTEGER, DOUBLE PRECISION, TEXT[], TEXT, UUID
) SET search_path = public;

-- Zoe chat analytics tables
CREATE TABLE IF NOT EXISTS public.zoe_chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_session_id TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  persona TEXT NOT NULL DEFAULT 'zoe',
  locale TEXT,
  audience TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_user_message_at TIMESTAMPTZ,
  last_assistant_message_at TIMESTAMPTZ,
  UNIQUE (external_session_id)
);

CREATE INDEX IF NOT EXISTS idx_zoe_chat_conversations_user ON public.zoe_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_zoe_chat_conversations_created ON public.zoe_chat_conversations(created_at DESC);

CREATE TRIGGER trg_zoe_chat_conversations_updated_at
  BEFORE UPDATE ON public.zoe_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.zoe_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.zoe_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  tokens INTEGER,
  response_time_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoe_chat_messages_conversation ON public.zoe_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_zoe_chat_messages_created ON public.zoe_chat_messages(created_at DESC);

-- Real-time publication for analytics dashboards
ALTER PUBLICATION supabase_realtime ADD TABLE public.zoe_chat_messages;

-- Row level security for chat analytics
ALTER TABLE public.zoe_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoe_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their Zoe conversations"
  ON public.zoe_chat_conversations
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can view their Zoe messages"
  ON public.zoe_chat_messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    conversation_id IN (
      SELECT id FROM public.zoe_chat_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view Zoe analytics"
  ON public.zoe_chat_conversations
  FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can view Zoe messages"
  ON public.zoe_chat_messages
  FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

