-- =====================================================
-- TELEGRAM-STYLE CHAT ENHANCEMENTS
-- =====================================================
-- Adds columns to support Telegram-like features:
-- - Last message preview in conversation list
-- - User online status and last seen
-- - Better conversation sorting
-- =====================================================

-- Add columns to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_text TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add columns to users table for online status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Create index for faster conversation sorting
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at 
ON conversations(last_message_at DESC);

-- Create index for online users lookup
CREATE INDEX IF NOT EXISTS idx_users_is_online 
ON users(is_online) WHERE is_online = TRUE;

-- Create function to update last_message_at automatically
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation's last message info
  UPDATE conversations
  SET 
    last_message_text = NEW.message_text,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last message
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Update existing conversations with their last message
UPDATE conversations c
SET 
  last_message_text = (
    SELECT m.message_text
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ),
  last_message_at = (
    SELECT m.created_at
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  )
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);

-- Set default last_message_at for conversations without messages
UPDATE conversations
SET last_message_at = created_at
WHERE last_message_at IS NULL;

COMMENT ON COLUMN conversations.last_message_text IS 'Cached last message text for quick preview display';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of last message for sorting conversations';
COMMENT ON COLUMN users.last_seen_at IS 'When user was last active';
COMMENT ON COLUMN users.is_online IS 'Whether user is currently online';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Telegram chat enhancements migration completed successfully';
END $$;
