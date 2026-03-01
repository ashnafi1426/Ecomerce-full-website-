-- ============================================================================
-- FIX: Audit Trigger Function - Correct Column Names
-- Description: Updates the enhanced_audit_trigger_func to use correct column names
-- Issue: The Phase 1 migration used wrong column names (operation, user_id, ip_address)
-- Fix: Use correct column names (action, performed_by, and remove ip_address)
-- Date: February 8, 2026
-- ============================================================================

-- Drop and recreate the enhanced audit trigger function with correct column names
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
      table_name, action, action_type, entity_type, entity_id,
      performed_by, user_role, user_email, old_data
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
      row_to_json(OLD)
    );
    RETURN OLD;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (
      table_name, action, action_type, entity_type, entity_id,
      performed_by, user_role, user_email, old_data, new_data, changes
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
      ))
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (
      table_name, action, action_type, entity_type, entity_id,
      performed_by, user_role, user_email, new_data
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
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
SELECT 'Audit trigger function fixed successfully!' as status;

-- Show which tables have audit triggers
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_name LIKE '%audit%'
  AND trigger_schema = 'public'
ORDER BY event_object_table, event_manipulation;
