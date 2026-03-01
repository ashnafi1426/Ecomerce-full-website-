-- ============================================================================
-- FASTSHOP MIGRATION: Phase 1.5 - Notifications and Audit Enhancement
-- Description: Creates comprehensive notification system and enhanced audit logging
-- Version: 1.0
-- Date: February 7, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    -- Order notifications
    'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
    -- Payment notifications
    'payment_received', 'payment_failed', 'refund_processed', 'payout_completed', 'payout_failed',
    -- Product notifications
    'product_approved', 'product_rejected', 'low_stock_alert', 'out_of_stock',
    -- Seller notifications
    'seller_verified', 'seller_rejected', 'new_order', 'new_review',
    -- Return/Dispute notifications
    'return_requested', 'return_approved', 'return_rejected', 'dispute_created', 'dispute_resolved',
    -- System notifications
    'account_verified', 'password_reset', 'security_alert', 'system_announcement'
  )),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Entities
  related_entity_type VARCHAR(50), -- order, product, payment, dispute, return, etc.
  related_entity_id UUID,
  
  -- Channels
  send_email BOOLEAN DEFAULT TRUE,
  send_sms BOOLEAN DEFAULT FALSE,
  send_push BOOLEAN DEFAULT TRUE,
  send_in_app BOOLEAN DEFAULT TRUE,
  
  -- Status
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Read Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE notifications IS 'Multi-channel notification system';
COMMENT ON COLUMN notifications.notification_type IS 'Type/category of notification';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of entity this notification relates to';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';

-- ============================================================================
-- STEP 2: Create Notification Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Reference (1:1)
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Channel Preferences
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notification Type Preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{
    "order_placed": {"email": true, "sms": false, "push": true},
    "order_shipped": {"email": true, "sms": true, "push": true},
    "payment_received": {"email": true, "sms": false, "push": true},
    "low_stock_alert": {"email": true, "sms": false, "push": true},
    "new_review": {"email": true, "sms": false, "push": false}
  }'::jsonb,
  
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Frequency Limits
  max_emails_per_day INTEGER DEFAULT 50,
  max_sms_per_day INTEGER DEFAULT 10,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';

-- ============================================================================
-- STEP 3: Enhance Audit Log Table
-- ============================================================================

-- Add new columns to existing audit_log table
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent_parsed JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS geo_location JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info' 
  CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'));

COMMENT ON COLUMN audit_log.action_type IS 'Type of action performed (create, update, delete, login, etc.)';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected (user, product, order, etc.)';
COMMENT ON COLUMN audit_log.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN audit_log.changes IS 'Detailed field-level changes';
COMMENT ON COLUMN audit_log.severity IS 'Severity level of the audit event';

-- ============================================================================
-- STEP 4: Create Security Events Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Reference
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 'password_changed', 
    'password_reset_requested', 'password_reset_completed',
    'mfa_enabled', 'mfa_disabled', 'mfa_failed',
    'account_locked', 'account_unlocked', 'suspicious_activity',
    'unauthorized_access_attempt', 'api_key_created', 'api_key_revoked'
  )),
  
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  device_info JSONB,
  
  -- Additional Details
  details JSONB,
  success BOOLEAN,
  failure_reason TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE security_events IS 'Security-related events and authentication logs';

-- ============================================================================
-- STEP 5: Create System Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Log Details
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  category VARCHAR(50) NOT NULL, -- payment, email, api, database, etc.
  message TEXT NOT NULL,
  
  -- Context
  service_name VARCHAR(100),
  function_name VARCHAR(100),
  file_path VARCHAR(255),
  line_number INTEGER,
  
  -- Request Context
  request_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  
  -- Error Details
  error_code VARCHAR(50),
  error_message TEXT,
  stack_trace TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE system_logs IS 'Application-level logs for debugging and monitoring';

-- ============================================================================
-- STEP 6: Create Indexes
-- ============================================================================

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, notification_type);

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_notifications_pending_email ON notifications(id, created_at) 
  WHERE send_email = TRUE AND email_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_pending_sms ON notifications(id, created_at) 
  WHERE send_sms = TRUE AND sms_sent = FALSE;

-- Notification Preferences Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Enhanced Audit Log Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log(request_id);

-- Security Events Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_email ON security_events(email);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);

-- Partial index for failed logins
CREATE INDEX IF NOT EXISTS idx_security_events_failed_logins ON security_events(email, created_at DESC) 
  WHERE event_type = 'login_failed';

-- System Logs Indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_request ON system_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);

-- Partial index for errors
CREATE INDEX IF NOT EXISTS idx_system_logs_errors ON system_logs(id, created_at, category) 
  WHERE log_level IN ('error', 'critical');

-- ============================================================================
-- STEP 7: Create Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Enhanced audit trigger function
CREATE OR REPLACE FUNCTION enhanced_audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_role VARCHAR(50);
  v_user_email VARCHAR(255);
BEGIN
  -- Get current user info
  v_user_id := NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
  
  IF v_user_id IS NOT NULL THEN
    SELECT role, email INTO v_user_role, v_user_email
    FROM users WHERE id = v_user_id;
  END IF;
  
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (
      table_name, operation, action_type, entity_type, entity_id,
      user_id, user_role, user_email, old_data, ip_address
    )
    VALUES (
      TG_TABLE_NAME, 
      TG_OP,
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      v_user_id,
      v_user_role,
      v_user_email,
      row_to_json(OLD),
      NULLIF(current_setting('app.client_ip', TRUE), '')::INET
    );
    RETURN OLD;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (
      table_name, operation, action_type, entity_type, entity_id,
      user_id, user_role, user_email, old_data, new_data, changes, ip_address
    )
    VALUES (
      TG_TABLE_NAME, 
      TG_OP,
      'update',
      TG_TABLE_NAME,
      NEW.id,
      v_user_id,
      v_user_role,
      v_user_email,
      row_to_json(OLD),
      row_to_json(NEW),
      jsonb_build_object('changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
      )),
      NULLIF(current_setting('app.client_ip', TRUE), '')::INET
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (
      table_name, operation, action_type, entity_type, entity_id,
      user_id, user_role, user_email, new_data, ip_address
    )
    VALUES (
      TG_TABLE_NAME, 
      TG_OP,
      'create',
      TG_TABLE_NAME,
      NEW.id,
      v_user_id,
      v_user_role,
      v_user_email,
      row_to_json(NEW),
      NULLIF(current_setting('app.client_ip', TRUE), '')::INET
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Replace old audit triggers with enhanced version
DROP TRIGGER IF EXISTS audit_users ON users;
DROP TRIGGER IF EXISTS audit_orders ON orders;
DROP TRIGGER IF EXISTS audit_payments ON payments;
DROP TRIGGER IF EXISTS audit_products ON products;

CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

-- Add audit triggers to new tables
CREATE TRIGGER audit_seller_payouts
  AFTER INSERT OR UPDATE OR DELETE ON seller_payouts
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

CREATE TRIGGER audit_disputes
  AFTER INSERT OR UPDATE OR DELETE ON disputes
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

CREATE TRIGGER audit_returns
  AFTER INSERT OR UPDATE OR DELETE ON returns
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger_func();

-- ============================================================================
-- STEP 8: Create Views
-- ============================================================================

-- View for unread notifications
CREATE OR REPLACE VIEW unread_notifications AS
SELECT
  n.id,
  n.user_id,
  n.notification_type,
  n.title,
  n.message,
  n.priority,
  n.related_entity_type,
  n.related_entity_id,
  n.created_at,
  (NOW() - n.created_at) as age
FROM notifications n
WHERE n.is_read = FALSE
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY 
  CASE n.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  n.created_at DESC;

COMMENT ON VIEW unread_notifications IS 'All unread notifications sorted by priority';

-- View for recent security events
CREATE OR REPLACE VIEW recent_security_events AS
SELECT
  se.id,
  se.user_id,
  se.email,
  se.event_type,
  se.severity,
  se.ip_address,
  se.success,
  se.failure_reason,
  se.created_at,
  u.display_name,
  u.role
FROM security_events se
LEFT JOIN users u ON se.user_id = u.id
WHERE se.created_at > NOW() - INTERVAL '30 days'
ORDER BY se.created_at DESC;

COMMENT ON VIEW recent_security_events IS 'Security events from the last 30 days';

-- View for failed login attempts
CREATE OR REPLACE VIEW failed_login_attempts AS
SELECT
  email,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt,
  array_agg(DISTINCT ip_address::TEXT) as ip_addresses
FROM security_events
WHERE event_type = 'login_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC, last_attempt DESC;

COMMENT ON VIEW failed_login_attempts IS 'Accounts with multiple failed login attempts in the last hour';

-- ============================================================================
-- STEP 9: Create Helper Functions
-- ============================================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id, notification_type, title, message,
    related_entity_type, related_entity_id, priority,
    send_email, send_sms, send_push
  )
  VALUES (
    p_user_id, p_type, p_title, p_message,
    p_related_entity_type, p_related_entity_id, p_priority,
    COALESCE(v_prefs.email_enabled, TRUE),
    COALESCE(v_prefs.sms_enabled, FALSE),
    COALESCE(v_prefs.push_enabled, TRUE)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification IS 'Create a notification respecting user preferences';

-- Function to log security event
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_email VARCHAR,
  p_event_type VARCHAR,
  p_severity VARCHAR DEFAULT 'info',
  p_success BOOLEAN DEFAULT TRUE,
  p_ip_address INET DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    user_id, email, event_type, severity, success,
    ip_address, details
  )
  VALUES (
    p_user_id, p_email, p_event_type, p_severity, p_success,
    p_ip_address, p_details
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_security_event IS 'Log a security-related event';

-- ============================================================================
-- STEP 10: Create Default Notification Preferences for Existing Users
-- ============================================================================

INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Phase 1.5 Migration Completed Successfully!' as status;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notifications', 'notification_preferences', 'security_events', 'system_logs')
ORDER BY table_name;

-- Show notification preferences count
SELECT COUNT(*) as user_count
FROM notification_preferences;
