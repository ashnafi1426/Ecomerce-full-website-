/**
 * ADD MESSAGE STATUS TRACKING
 * 
 * Adds columns to track message delivery and read status
 * Feature 1: Message Status Indicators
 */

-- Add status columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON messages(delivered_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Update existing messages to have 'sent' status
UPDATE messages 
SET status = 'sent' 
WHERE status IS NULL;

-- Create function to auto-update delivered_at when status changes to delivered
CREATE OR REPLACE FUNCTION update_message_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delivered_at
DROP TRIGGER IF EXISTS trigger_update_message_delivered_at ON messages;
CREATE TRIGGER trigger_update_message_delivered_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_delivered_at();

-- Create function to auto-update read_at when status changes to read
CREATE OR REPLACE FUNCTION update_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'read' AND OLD.status != 'read' AND NEW.read_at IS NULL THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for read_at
DROP TRIGGER IF EXISTS trigger_update_message_read_at ON messages;
CREATE TRIGGER trigger_update_message_read_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_read_at();

-- Add comment
COMMENT ON COLUMN messages.status IS 'Message delivery status: sending, sent, delivered, read, failed';
COMMENT ON COLUMN messages.delivered_at IS 'Timestamp when message was delivered to recipient';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read by recipient';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Message status tracking columns added successfully!';
  RAISE NOTICE 'Status values: sending, sent, delivered, read, failed';
END $$;
