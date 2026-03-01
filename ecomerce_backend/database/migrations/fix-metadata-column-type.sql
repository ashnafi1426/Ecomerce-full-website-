-- FIX METADATA COLUMN TYPE
-- Drop and recreate the metadata column as proper JSONB

-- Drop the existing column
ALTER TABLE conversations DROP COLUMN IF EXISTS metadata;

-- Add it back as JSONB with proper default
ALTER TABLE conversations 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_metadata 
ON conversations USING GIN (metadata);

-- Verify the column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name = 'metadata';
