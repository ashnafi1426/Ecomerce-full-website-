-- ============================================================================
-- FASTSHOP MIGRATION: Phase 1.4 - Disputes and Enhanced Returns
-- Description: Creates comprehensive dispute resolution and enhanced return management
-- Version: 1.0
-- Date: February 7, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Disputes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Dispute Details
  dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN (
    'product_not_received', 'product_damaged', 'wrong_product', 
    'product_not_as_described', 'quality_issue', 'refund_not_received', 'other'
  )),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Evidence
  evidence_files JSONB, -- Array of file URLs/metadata
  customer_evidence TEXT,
  seller_response TEXT,
  seller_evidence JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN (
    'open', 'under_review', 'awaiting_seller_response', 
    'awaiting_customer_response', 'resolved', 'closed', 'escalated'
  )),
  
  -- Resolution
  resolution_type VARCHAR(50) CHECK (resolution_type IN (
    'full_refund', 'partial_refund', 'replacement', 'no_action', 'other'
  )),
  resolution_details TEXT,
  resolution_amount DECIMAL(10, 2),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Manager handling the dispute
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  seller_responded_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE disputes IS 'Customer-seller dispute resolution system';
COMMENT ON COLUMN disputes.dispute_type IS 'Category of the dispute';
COMMENT ON COLUMN disputes.status IS 'Current status of the dispute';
COMMENT ON COLUMN disputes.resolution_type IS 'How the dispute was resolved';

-- ============================================================================
-- STEP 2: Create Dispute Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dispute Reference
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  
  -- Message Details
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) NOT NULL, -- customer, seller, manager, admin
  message TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB, -- Array of file URLs/metadata
  
  -- Visibility
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes visible only to managers/admins
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE dispute_messages IS 'Communication thread for disputes';
COMMENT ON COLUMN dispute_messages.is_internal IS 'Internal notes not visible to customer/seller';

-- ============================================================================
-- STEP 3: Enhance Returns Table
-- ============================================================================

-- Drop existing returns table to recreate with enhanced fields
DROP TABLE IF EXISTS returns CASCADE;

CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Return Details
  return_type VARCHAR(50) NOT NULL CHECK (return_type IN (
    'defective', 'wrong_item', 'not_as_described', 'changed_mind', 
    'damaged_in_shipping', 'quality_issue', 'other'
  )),
  items JSONB NOT NULL, -- Products being returned
  reason TEXT NOT NULL,
  detailed_description TEXT,
  
  -- Evidence
  images JSONB, -- Array of image URLs
  video_url VARCHAR(500),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'return_shipped', 
    'return_received', 'inspecting', 'completed', 'cancelled'
  )),
  
  -- Approval
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Return Shipping
  return_tracking_number VARCHAR(255),
  return_carrier VARCHAR(100),
  return_label_url VARCHAR(500),
  return_shipped_at TIMESTAMP WITH TIME ZONE,
  return_received_at TIMESTAMP WITH TIME ZONE,
  
  -- Inspection
  inspection_notes TEXT,
  inspection_passed BOOLEAN,
  inspected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  inspected_at TIMESTAMP WITH TIME ZONE,
  
  -- Refund
  refund_amount DECIMAL(10, 2),
  refund_method VARCHAR(50) CHECK (refund_method IN (
    'original_payment_method', 'store_credit', 'bank_transfer', 'check'
  )),
  refund_status VARCHAR(50) DEFAULT 'pending' CHECK (refund_status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  refund_processed_at TIMESTAMP WITH TIME ZONE,
  refund_transaction_id VARCHAR(255),
  
  -- Restocking
  restocked BOOLEAN DEFAULT FALSE,
  restocked_at TIMESTAMP WITH TIME ZONE,
  restocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE returns IS 'Enhanced return request and refund processing';
COMMENT ON COLUMN returns.return_type IS 'Reason category for the return';
COMMENT ON COLUMN returns.inspection_passed IS 'Whether returned items passed inspection';
COMMENT ON COLUMN returns.restocked IS 'Whether items were returned to inventory';

-- ============================================================================
-- STEP 4: Create Return Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS return_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Return Reference
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  
  -- Message Details
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB,
  
  -- Visibility
  is_internal BOOLEAN DEFAULT FALSE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE return_messages IS 'Communication thread for returns';

-- ============================================================================
-- STEP 5: Create Indexes
-- ============================================================================

-- Disputes Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_to ON disputes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_disputes_status_priority ON disputes(status, priority);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_status ON disputes(assigned_to, status);

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_disputes_open ON disputes(id, created_at, priority) 
  WHERE status IN ('open', 'under_review', 'awaiting_seller_response', 'awaiting_customer_response');

CREATE INDEX IF NOT EXISTS idx_disputes_unassigned ON disputes(id, created_at, priority) 
  WHERE assigned_to IS NULL AND status IN ('open', 'under_review');

-- Dispute Messages Indexes
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender ON dispute_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at DESC);

-- Returns Indexes
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_seller ON returns(seller_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_refund_status ON returns(refund_status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_approved_by ON returns(approved_by);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_returns_customer_status ON returns(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_seller_status ON returns(seller_id, status);

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_returns_pending ON returns(id, created_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_returns_awaiting_inspection ON returns(id, return_received_at) 
  WHERE status = 'inspecting';

-- Return Messages Indexes
CREATE INDEX IF NOT EXISTS idx_return_messages_return ON return_messages(return_id);
CREATE INDEX IF NOT EXISTS idx_return_messages_sender ON return_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_return_messages_created_at ON return_messages(created_at DESC);

-- ============================================================================
-- STEP 6: Create Triggers
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-assign priority based on dispute type
CREATE OR REPLACE FUNCTION auto_assign_dispute_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- High priority for certain dispute types
  IF NEW.dispute_type IN ('product_not_received', 'refund_not_received') THEN
    NEW.priority = 'high';
  END IF;
  
  -- Escalate if dispute is open for more than 7 days
  IF NEW.status = 'open' AND (NOW() - NEW.created_at) > INTERVAL '7 days' THEN
    NEW.priority = 'urgent';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dispute_priority_trigger
  BEFORE INSERT OR UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_dispute_priority();

-- Trigger to handle return status changes
CREATE OR REPLACE FUNCTION handle_return_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When return is approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  END IF;
  
  -- When return is received
  IF NEW.status = 'return_received' AND OLD.status != 'return_received' THEN
    NEW.return_received_at = NOW();
  END IF;
  
  -- When return is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_status_change_trigger
  BEFORE UPDATE ON returns
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_return_status_change();

-- ============================================================================
-- STEP 7: Create Views
-- ============================================================================

-- View for open disputes (Manager queue)
CREATE OR REPLACE VIEW open_disputes AS
SELECT
  d.id,
  d.order_id,
  d.dispute_type,
  d.subject,
  d.status,
  d.priority,
  d.created_at,
  c.email as customer_email,
  c.display_name as customer_name,
  s.business_name as seller_name,
  s.email as seller_email,
  m.display_name as assigned_to_name,
  (NOW() - d.created_at) as age,
  CASE
    WHEN (NOW() - d.created_at) > INTERVAL '7 days' THEN 'overdue'
    WHEN (NOW() - d.created_at) > INTERVAL '3 days' THEN 'due_soon'
    ELSE 'on_time'
  END as urgency
FROM disputes d
JOIN users c ON d.customer_id = c.id
LEFT JOIN users s ON d.seller_id = s.id
LEFT JOIN users m ON d.assigned_to = m.id
WHERE d.status IN ('open', 'under_review', 'awaiting_seller_response', 'awaiting_customer_response')
ORDER BY 
  CASE d.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  d.created_at ASC;

COMMENT ON VIEW open_disputes IS 'Manager queue of open disputes with priority sorting';

-- View for pending returns (Manager queue)
CREATE OR REPLACE VIEW pending_returns AS
SELECT
  r.id,
  r.order_id,
  r.return_type,
  r.reason,
  r.status,
  r.refund_amount,
  r.created_at,
  c.email as customer_email,
  c.display_name as customer_name,
  s.business_name as seller_name,
  (NOW() - r.created_at) as age
FROM returns r
JOIN users c ON r.customer_id = c.id
LEFT JOIN users s ON r.seller_id = s.id
WHERE r.status IN ('pending', 'return_shipped', 'return_received', 'inspecting')
ORDER BY r.created_at ASC;

COMMENT ON VIEW pending_returns IS 'Manager queue of pending returns';

-- View for dispute statistics
CREATE OR REPLACE VIEW dispute_statistics AS
SELECT
  COUNT(*) as total_disputes,
  COUNT(*) FILTER (WHERE status IN ('open', 'under_review')) as open_disputes,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_disputes,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_disputes,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_disputes,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as disputes_last_7_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as disputes_last_30_days
FROM disputes;

COMMENT ON VIEW dispute_statistics IS 'Overall dispute statistics';

-- View for return statistics
CREATE OR REPLACE VIEW return_statistics AS
SELECT
  COUNT(*) as total_returns,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_returns,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_returns,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_returns,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_returns,
  SUM(refund_amount) FILTER (WHERE refund_status = 'completed') as total_refunded,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) FILTER (WHERE completed_at IS NOT NULL) as avg_processing_hours,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as returns_last_30_days,
  (COUNT(*) FILTER (WHERE status = 'approved')::DECIMAL / NULLIF(COUNT(*), 0) * 100) as approval_rate
FROM returns;

COMMENT ON VIEW return_statistics IS 'Overall return statistics';

-- ============================================================================
-- STEP 8: Create Helper Functions
-- ============================================================================

-- Function to get dispute history
CREATE OR REPLACE FUNCTION get_dispute_history(dispute_uuid UUID)
RETURNS TABLE (
  event_time TIMESTAMP WITH TIME ZONE,
  event_type VARCHAR,
  event_description TEXT,
  actor_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.created_at as event_time,
    'message'::VARCHAR as event_type,
    dm.message as event_description,
    u.display_name as actor_name
  FROM dispute_messages dm
  JOIN users u ON dm.sender_id = u.id
  WHERE dm.dispute_id = dispute_uuid
  ORDER BY dm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate return rate for a seller
CREATE OR REPLACE FUNCTION calculate_seller_return_rate(seller_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_orders INTEGER;
  total_returns INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders
  FROM orders
  WHERE seller_id = seller_uuid AND status = 'delivered';
  
  SELECT COUNT(*) INTO total_returns
  FROM returns
  WHERE seller_id = seller_uuid AND status IN ('approved', 'completed');
  
  IF total_orders = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (total_returns::DECIMAL / total_orders * 100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_seller_return_rate IS 'Calculate return rate percentage for a seller';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Phase 1.4 Migration Completed Successfully!' as status;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('disputes', 'dispute_messages', 'returns', 'return_messages')
ORDER BY table_name;

-- Show views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('open_disputes', 'pending_returns', 'dispute_statistics', 'return_statistics')
ORDER BY table_name;
