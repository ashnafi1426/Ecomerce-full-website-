-- =====================================================
-- LIVE CHAT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration creates tables for real-time chat functionality
-- Supports: Customer-Seller, Customer-Support, Seller-Support, Internal messaging
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONVERSATIONS TABLE
-- =====================================================
-- Stores chat conversations between users
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'customer_seller',      -- Customer asking seller about product
    'customer_support',     -- Customer contacting support
    'seller_support',       -- Seller contacting support
    'internal'              -- Admin/Manager internal communication
  )),
  
  -- Participants (array of user IDs)
  participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  subject VARCHAR(255),                    -- Optional conversation subject
  related_entity_type VARCHAR(50),         -- 'product', 'order', 'general'
  related_entity_id UUID,                  -- ID of related product/order
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  
  -- Timestamps
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT conversations_participants_check CHECK (jsonb_array_length(participant_ids) >= 2)
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_related_entity ON conversations(related_entity_type, related_entity_id);

-- =====================================================
-- 2. MESSAGES TABLE
-- =====================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message content
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  
  -- Attachments (for images/files)
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Read tracking
  read_by JSONB DEFAULT '[]'::jsonb,  -- Array of user IDs who read the message
  delivered_to JSONB DEFAULT '[]'::jsonb,  -- Array of user IDs message was delivered to
  
  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_by ON messages USING GIN (read_by);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_undeleted ON messages(conversation_id) WHERE is_deleted = FALSE;

-- =====================================================
-- 3. TYPING INDICATORS TABLE
-- =====================================================
-- Tracks who is currently typing in a conversation
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  last_typed_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

-- Create indexes for typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_last_typed ON typing_indicators(last_typed_at);

-- =====================================================
-- 4. USER ONLINE STATUS TABLE
-- =====================================================
-- Tracks online/offline status of users
CREATE TABLE IF NOT EXISTS user_online_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMP DEFAULT NOW(),
  socket_id VARCHAR(255),  -- Socket.IO connection ID
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for online status
CREATE INDEX IF NOT EXISTS idx_user_online_status ON user_online_status(is_online, last_seen_at DESC);

-- =====================================================
-- 5. CONVERSATION PARTICIPANTS VIEW
-- =====================================================
-- Helper view to easily query conversation participants
CREATE OR REPLACE VIEW conversation_participants AS
SELECT 
  c.id as conversation_id,
  c.type,
  c.status,
  jsonb_array_elements_text(c.participant_ids)::uuid as user_id,
  c.last_message_at,
  c.created_at
FROM conversations c;

-- =====================================================
-- 6. UNREAD MESSAGE COUNTS VIEW
-- =====================================================
-- Helper view to get unread message counts per user per conversation
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT 
  m.conversation_id,
  cp.user_id,
  COUNT(*) as unread_count
FROM messages m
CROSS JOIN conversation_participants cp
WHERE 
  m.conversation_id = cp.conversation_id
  AND m.sender_id != cp.user_id
  AND NOT (m.read_by @> to_jsonb(ARRAY[cp.user_id::text]))
  AND m.is_deleted = FALSE
GROUP BY m.conversation_id, cp.user_id;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Update conversation last_message_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Auto-cleanup old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE last_typed_at < NOW() - INTERVAL '10 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_typing_indicators ON typing_indicators;
CREATE TRIGGER trigger_cleanup_typing_indicators
  AFTER INSERT OR UPDATE ON typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_typing_indicators();

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is participant in conversation
CREATE OR REPLACE FUNCTION is_conversation_participant(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
    AND participant_ids @> to_jsonb(ARRAY[p_user_id::text])
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE messages
  SET 
    read_by = CASE 
      WHEN read_by @> to_jsonb(ARRAY[p_user_id::text]) THEN read_by
      ELSE read_by || to_jsonb(ARRAY[p_user_id::text])
    END,
    updated_at = NOW()
  WHERE 
    conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND NOT (read_by @> to_jsonb(ARRAY[p_user_id::text]))
    AND is_deleted = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Insert sample conversation (commented out for production)
-- INSERT INTO conversations (type, participant_ids, subject, status)
-- VALUES (
--   'customer_support',
--   '["user-id-1", "user-id-2"]'::jsonb,
--   'Help with order',
--   'active'
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE conversations IS 'Stores chat conversations between users';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE typing_indicators IS 'Tracks real-time typing status';
COMMENT ON TABLE user_online_status IS 'Tracks user online/offline status';
