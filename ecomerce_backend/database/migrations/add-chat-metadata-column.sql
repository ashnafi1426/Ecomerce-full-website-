-- =====================================================
-- ADD METADATA COLUMN TO CONVERSATIONS TABLE
-- =====================================================
-- This migration adds the missing metadata JSONB column
-- that the chat service is trying to use
-- =====================================================

-- Add metadata column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_conversations_metadata ON conversations USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN conversations.metadata IS 'Additional metadata for the conversation (flexible JSONB storage)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
