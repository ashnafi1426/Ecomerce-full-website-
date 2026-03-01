-- =====================================================
-- CHAT SYSTEM COMPLETE FIX
-- =====================================================
-- Fixes:
-- 1. metadata column type (TEXT -> JSONB)
-- 2. participant_ids column type (TEXT -> JSONB) if needed
-- 3. Creates missing get_unread_message_count function
-- =====================================================

-- 1. Fix metadata column
ALTER TABLE conversations DROP COLUMN IF EXISTS metadata;
ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_metadata ON conversations USING GIN (metadata);

-- 2. Ensure participant_ids is JSONB (in case it's TEXT)
DO $
BEGIN
  -- Check if participant_ids is not JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'participant_ids' 
    AND data_type != 'jsonb'
  ) THEN
    -- Drop and recreate as JSONB
    ALTER TABLE conversations DROP COLUMN participant_ids;
    ALTER TABLE conversations ADD COLUMN participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participant_ids);
  END IF;
END $;

-- 3. Create the missing get_unread_message_count function
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    (SELECT COUNT(*)
     FROM messages m
     WHERE m.conversation_id = c.id
       AND m.sender_id != user_id
       AND NOT (m.read_by @> to_jsonb(ARRAY[user_id::text]))
       AND m.is_deleted = FALSE
    )
  ), 0)::INTEGER INTO unread_count
  FROM conversations c
  WHERE c.participant_ids @> to_jsonb(ARRAY[user_id::text]);
  
  RETURN unread_count;
END;
$ LANGUAGE plpgsql;

-- 4. Verify the fixes
SELECT 
  'metadata' as column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'metadata'
UNION ALL
SELECT 
  'participant_ids' as column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'participant_ids';

-- 5. Test the function
SELECT get_unread_message_count('00000000-0000-0000-0000-000000000000'::uuid) as test_result;

