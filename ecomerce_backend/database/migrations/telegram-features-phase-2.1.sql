-- =====================================================
-- TELEGRAM-LIKE CHAT FEATURES - PHASE 2.1
-- =====================================================
-- Message Features: Editing, Deletion, Reactions, Threading
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MESSAGE REACTIONS TABLE
-- =====================================================
-- Stores emoji reactions to messages
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL, -- emoji character(s)
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate reactions from same user
  UNIQUE(message_id, user_id, reaction)
);

-- Create indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created ON message_reactions(created_at DESC);

-- =====================================================
-- 2. MESSAGE EDITS HISTORY TABLE
-- =====================================================
-- Stores edit history for messages
CREATE TABLE IF NOT EXISTS message_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  old_text TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edited_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for edits
CREATE INDEX IF NOT EXISTS idx_edits_message ON message_edits(message_id, edited_at DESC);
CREATE INDEX IF NOT EXISTS idx_edits_user ON message_edits(edited_by);

-- =====================================================
-- 3. UPDATE MESSAGES TABLE
-- =====================================================
-- Add new columns for threading and deletion types
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deletion_type VARCHAR(20) CHECK (deletion_type IN ('for_me', 'for_everyone')),
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON messages(deleted_by);

-- =====================================================
-- 4. MESSAGE REACTIONS AGGREGATED VIEW
-- =====================================================
-- Helper view to get reaction counts per message
CREATE OR REPLACE VIEW message_reaction_counts AS
SELECT 
  message_id,
  reaction,
  COUNT(*) as count,
  array_agg(user_id) as user_ids
FROM message_reactions
GROUP BY message_id, reaction;

-- =====================================================
-- 5. MESSAGES WITH REACTIONS VIEW
-- =====================================================
-- Helper view to get messages with their reactions
CREATE OR REPLACE VIEW messages_with_reactions AS
SELECT 
  m.*,
  COALESCE(
    json_agg(
      json_build_object(
        'reaction', mrc.reaction,
        'count', mrc.count,
        'user_ids', mrc.user_ids
      )
    ) FILTER (WHERE mrc.message_id IS NOT NULL),
    '[]'::json
  ) as reactions
FROM messages m
LEFT JOIN message_reaction_counts mrc ON m.id = mrc.message_id
GROUP BY m.id;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to add reaction to message
CREATE OR REPLACE FUNCTION add_message_reaction(
  p_message_id UUID,
  p_user_id UUID,
  p_reaction VARCHAR(10)
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO message_reactions (message_id, user_id, reaction)
  VALUES (p_message_id, p_user_id, p_reaction)
  ON CONFLICT (message_id, user_id, reaction) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to remove reaction from message
CREATE OR REPLACE FUNCTION remove_message_reaction(
  p_message_id UUID,
  p_user_id UUID,
  p_reaction VARCHAR(10)
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM message_reactions
  WHERE message_id = p_message_id
    AND user_id = p_user_id
    AND reaction = p_reaction;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to edit message
CREATE OR REPLACE FUNCTION edit_message(
  p_message_id UUID,
  p_user_id UUID,
  p_new_text TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_text TEXT;
  v_sender_id UUID;
BEGIN
  -- Get current message text and verify sender
  SELECT message_text, sender_id INTO v_old_text, v_sender_id
  FROM messages
  WHERE id = p_message_id AND is_deleted = FALSE;
  
  -- Check if user is the sender
  IF v_sender_id != p_user_id THEN
    RAISE EXCEPTION 'Only message sender can edit the message';
  END IF;
  
  -- Store edit history
  INSERT INTO message_edits (message_id, old_text, edited_by)
  VALUES (p_message_id, v_old_text, p_user_id);
  
  -- Update message
  UPDATE messages
  SET 
    message_text = p_new_text,
    is_edited = TRUE,
    edit_count = edit_count + 1,
    last_edited_at = NOW(),
    updated_at = NOW()
  WHERE id = p_message_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to delete message
CREATE OR REPLACE FUNCTION delete_message(
  p_message_id UUID,
  p_user_id UUID,
  p_deletion_type VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
  v_conversation_id UUID;
BEGIN
  -- Get message info
  SELECT sender_id, conversation_id INTO v_sender_id, v_conversation_id
  FROM messages
  WHERE id = p_message_id AND is_deleted = FALSE;
  
  -- For "delete for everyone", only sender can delete
  IF p_deletion_type = 'for_everyone' AND v_sender_id != p_user_id THEN
    RAISE EXCEPTION 'Only message sender can delete for everyone';
  END IF;
  
  -- Update message
  UPDATE messages
  SET 
    is_deleted = TRUE,
    deletion_type = p_deletion_type,
    deleted_by = p_user_id,
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_message_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get message edit history
CREATE OR REPLACE FUNCTION get_message_edit_history(
  p_message_id UUID
)
RETURNS TABLE (
  old_text TEXT,
  edited_by UUID,
  edited_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT me.old_text, me.edited_by, me.edited_at
  FROM message_edits me
  WHERE me.message_id = p_message_id
  ORDER BY me.edited_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get message with full details (reactions, replies, etc.)
CREATE OR REPLACE FUNCTION get_message_details(
  p_message_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'message', row_to_json(m.*),
    'reactions', (
      SELECT json_agg(
        json_build_object(
          'reaction', mr.reaction,
          'count', COUNT(*),
          'user_ids', array_agg(mr.user_id)
        )
      )
      FROM message_reactions mr
      WHERE mr.message_id = m.id
      GROUP BY mr.reaction
    ),
    'reply_to', (
      SELECT row_to_json(rm.*)
      FROM messages rm
      WHERE rm.id = m.reply_to_message_id
    ),
    'edit_history', (
      SELECT json_agg(
        json_build_object(
          'old_text', me.old_text,
          'edited_at', me.edited_at
        )
      )
      FROM message_edits me
      WHERE me.message_id = m.id
      ORDER BY me.edited_at DESC
    )
  ) INTO v_result
  FROM messages m
  WHERE m.id = p_message_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to update conversation when message is edited
CREATE OR REPLACE FUNCTION update_conversation_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_edit ON messages;
CREATE TRIGGER trigger_update_conversation_on_edit
  AFTER UPDATE OF message_text ON messages
  FOR EACH ROW
  WHEN (OLD.message_text IS DISTINCT FROM NEW.message_text)
  EXECUTE FUNCTION update_conversation_on_edit();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE message_reactions IS 'Stores emoji reactions to messages';
COMMENT ON TABLE message_edits IS 'Stores edit history for messages';
COMMENT ON COLUMN messages.reply_to_message_id IS 'Reference to message being replied to (threading)';
COMMENT ON COLUMN messages.deletion_type IS 'Type of deletion: for_me or for_everyone';
COMMENT ON COLUMN messages.edit_count IS 'Number of times message has been edited';

