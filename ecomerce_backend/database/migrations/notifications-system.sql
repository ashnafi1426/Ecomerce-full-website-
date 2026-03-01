-- =====================================================
-- NOTIFICATIONS SYSTEM - DATABASE MIGRATION
-- =====================================================
-- Creates comprehensive notification system for FastShop
-- Supports in-app, email, and SMS notifications
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'order_placed',
  'order_confirmed',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'payment_received',
  'payment_failed',
  'payout_processed',
  'product_approved',
  'product_rejected',
  'product_low_stock',
  'product_out_of_stock',
  'new_review',
  'new_message',
  'seller_approved',
  'seller_rejected',
  'commission_updated',
  'system_announcement',
  'account_update',
  'security_alert'
);

-- Notification priority levels
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Notification channels
CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms',
  'push'
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority DEFAULT 'medium',
  
  -- Metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',
  
  -- Action link (optional)
  action_url VARCHAR(500),
  action_text VARCHAR(100),
  
  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  
  -- Delivery tracking
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT valid_read_at CHECK (read_at IS NULL OR is_read = TRUE),
  CONSTRAINT valid_archived_at CHECK (archived_at IS NULL OR is_archived = TRUE)
);

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  
  -- Type-specific preferences (JSONB for flexibility)
  -- Example: {"order_placed": {"email": true, "sms": false}, ...}
  type_preferences JSONB DEFAULT '{}',
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Frequency settings
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly
  digest_time TIME DEFAULT '09:00:00',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint
  UNIQUE(user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_archived ON notifications(is_archived);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Notification preferences indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set read_at when is_read changes to true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set archived_at when is_archived changes to true
CREATE OR REPLACE FUNCTION set_notification_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_archived = TRUE AND OLD.is_archived = FALSE THEN
    NEW.archived_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
      AND is_archived = FALSE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE,
      read_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
    AND is_read = FALSE
    AND is_archived = FALSE;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at on notifications
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- Trigger to set read_at on notifications
CREATE TRIGGER trigger_notifications_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_read_at();

-- Trigger to set archived_at on notifications
CREATE TRIGGER trigger_notifications_archived_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_archived_at();

-- Trigger to update updated_at on notification_preferences
CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- Trigger to create default preferences for new users
CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE notifications IS 'Stores all user notifications across the platform';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery';
COMMENT ON COLUMN notifications.metadata IS 'Flexible JSONB field for notification-specific data';
COMMENT ON COLUMN notifications.channels IS 'Array of channels where notification should be delivered';
COMMENT ON FUNCTION get_unread_notification_count IS 'Returns count of unread notifications for a user';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all unread notifications as read for a user';
COMMENT ON FUNCTION delete_expired_notifications IS 'Deletes notifications past their expiration date';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
SELECT 
  'notifications' as table_name,
  COUNT(*) as row_count
FROM notifications
UNION ALL
SELECT 
  'notification_preferences' as table_name,
  COUNT(*) as row_count
FROM notification_preferences;
