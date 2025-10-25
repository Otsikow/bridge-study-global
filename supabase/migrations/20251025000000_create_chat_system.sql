-- Create real-time chat system for students, agents, and admins
-- Similar to WhatsApp Web functionality

-- Conversations table (chat threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT, -- Optional group name (null for 1-on-1)
  is_group BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants (many-to-many)
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE, -- For group chats
  UNIQUE(conversation_id, user_id)
);

-- Conversation messages
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, file, system
  attachments JSONB DEFAULT '[]',
  reply_to_id UUID REFERENCES conversation_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Typing indicators
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 seconds'),
  UNIQUE(conversation_id, user_id)
);

-- User presence/online status
CREATE TABLE user_presence (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline', -- online, offline, away
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_sender ON conversation_messages(sender_id);
CREATE INDEX idx_conversation_messages_created ON conversation_messages(created_at DESC);
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_expires ON typing_indicators(expires_at);
CREATE INDEX idx_user_presence_status ON user_presence(status);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they're part of"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
    OR created_by = auth.uid()
  );

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
    OR conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can update their own participant record"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for conversation_messages
CREATE POLICY "Users can view messages in their conversations"
  ON conversation_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON conversation_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON conversation_messages FOR DELETE
  USING (sender_id = auth.uid());

-- RLS Policies for typing_indicators
CREATE POLICY "Users can view typing indicators in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own typing indicators"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for user_presence
CREATE POLICY "Users can view presence of others in their tenant"
  ON user_presence FOR SELECT
  USING (
    id IN (
      SELECT id FROM profiles
      WHERE tenant_id = get_user_tenant(auth.uid())
    )
  );

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR ALL
  USING (id = auth.uid());

-- Trigger to update conversation updated_at on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Trigger to update conversations updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update user_presence updated_at
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID, p_conversation_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_read TIMESTAMPTZ;
  unread INTEGER;
BEGIN
  SELECT last_read_at INTO last_read
  FROM conversation_participants
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id;
  
  SELECT COUNT(*) INTO unread
  FROM conversation_messages
  WHERE conversation_id = p_conversation_id
    AND created_at > last_read
    AND sender_id != p_user_id;
  
  RETURN unread;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get or create 1-on-1 conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_tenant_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT cp1.conversation_id INTO conversation_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2 
    ON cp1.conversation_id = cp2.conversation_id
  INNER JOIN conversations c 
    ON c.id = cp1.conversation_id
  WHERE cp1.user_id = p_user1_id
    AND cp2.user_id = p_user2_id
    AND c.is_group = FALSE
  LIMIT 1;
  
  -- If not exists, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (tenant_id, is_group, created_by)
    VALUES (p_tenant_id, FALSE, p_user1_id)
    RETURNING id INTO conversation_id;
    
    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, p_user1_id), (conversation_id, p_user2_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
