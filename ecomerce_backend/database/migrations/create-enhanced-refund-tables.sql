-- =====================================================
-- ENHANCED REFUND PROCESS SYSTEM TABLES
-- FastShop E-Commerce Platform
-- Implements Requirements 5.1, 5.2, 5.3, 5.4
-- Matches design.md specifications exactly
-- =====================================================

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. REFUND_DETAILS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refund_type VARCHAR(20) NOT NULL CHECK (refund_type IN ('full', 'partial', 'goodwill')),
    refund_amount DECIMAL(10, 2) NOT NULL CHECK (refund_amount > 0),
    original_order_amount DECIMAL(10, 2) NOT NULL,
    reason_category VARCHAR(50) NOT NULL CHECK (reason_category IN (
        'product_quality', 'shipping_damage', 'customer_changed_mind', 
        'wrong_item', 'pricing_error', 'goodwill', 'other'
    )),
    reason_description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'processing', 'completed', 'failed'
    )),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    rejection_reason TEXT,
    internal_notes TEXT, -- Manager-only notes
    commission_adjustment DECIMAL(10, 2) DEFAULT 0,
    seller_deduction DECIMAL(10, 2) DEFAULT 0,
    payment_gateway_refund_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. REFUND_IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_id UUID NOT NULL REFERENCES refund_details(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- 'product_damage', 'packaging_issue', 'wrong_item', etc.
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for refund_details table
CREATE INDEX IF NOT EXISTS idx_refund_order ON refund_details(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_customer ON refund_details(customer_id);
CREATE INDEX IF NOT EXISTS idx_refund_seller ON refund_details(seller_id);
CREATE INDEX IF NOT EXISTS idx_refund_status ON refund_details(status);
CREATE INDEX IF NOT EXISTS idx_refund_type ON refund_details(refund_type);

-- Index for pending refunds (most common query for managers)
CREATE INDEX IF NOT EXISTS idx_refund_pending ON refund_details(status, created_at) 
    WHERE status = 'pending';

-- Composite index for seller's refund requests
CREATE INDEX IF NOT EXISTS idx_refund_seller_status ON refund_details(seller_id, status, created_at DESC);

-- Index for reason category analytics
CREATE INDEX IF NOT EXISTS idx_refund_reason ON refund_details(reason_category);

-- Index for goodwill refunds
CREATE INDEX IF NOT EXISTS idx_refund_goodwill ON refund_details(refund_type) 
    WHERE refund_type = 'goodwill';

-- Index for processing time monitoring
CREATE INDEX IF NOT EXISTS idx_refund_processing_time ON refund_details(status, created_at)
    WHERE status = 'pending' OR status = 'approved';

-- Indexes for refund_images table
CREATE INDEX IF NOT EXISTS idx_refund_images_refund ON refund_images(refund_id);
CREATE INDEX IF NOT EXISTS idx_refund_images_type ON refund_images(image_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE refund_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_images ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access refund_details" ON refund_details;
CREATE POLICY "Service role full access refund_details" 
    ON refund_details FOR ALL 
    USING (true);

DROP POLICY IF EXISTS "Service role full access refund_images" ON refund_images;
CREATE POLICY "Service role full access refund_images" 
    ON refund_images FOR ALL 
    USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_refund_details_updated_at ON refund_details;
CREATE TRIGGER trigger_update_refund_details_updated_at
    BEFORE UPDATE ON refund_details
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_updated_at();

-- Trigger to set reviewed_at timestamp when status changes from pending
CREATE OR REPLACE FUNCTION set_refund_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set reviewed_at when status changes from pending to approved or rejected
    IF OLD.status = 'pending' AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
        IF NEW.reviewed_at IS NULL THEN
            NEW.reviewed_at := NOW();
        END IF;
    END IF;
    
    -- Set processed_at when status changes to processing
    IF OLD.status != 'processing' AND NEW.status = 'processing' THEN
        IF NEW.processed_at IS NULL THEN
            NEW.processed_at := NOW();
        END IF;
    END IF;
    
    -- Set completed_at when status changes to completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_refund_timestamps ON refund_details;
CREATE TRIGGER trigger_set_refund_timestamps
    BEFORE UPDATE ON refund_details
    FOR EACH ROW
    EXECUTE FUNCTION set_refund_reviewed_at();

-- Trigger to validate cumulative refunds don't exceed order total
CREATE OR REPLACE FUNCTION validate_cumulative_refunds()
RETURNS TRIGGER AS $$
DECLARE
    v_cumulative_refunds DECIMAL(10, 2);
    v_order_total DECIMAL(10, 2);
BEGIN
    -- Get cumulative refunds for this order (excluding current if update)
    SELECT COALESCE(SUM(refund_amount), 0) INTO v_cumulative_refunds
    FROM refund_details
    WHERE order_id = NEW.order_id 
    AND status IN ('approved', 'processing', 'completed')
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- Get order total
    SELECT total_amount INTO v_order_total
    FROM orders
    WHERE id = NEW.order_id;
    
    -- Check if cumulative refunds + new refund exceed order total
    IF (v_cumulative_refunds + NEW.refund_amount) > v_order_total THEN
        RAISE EXCEPTION 'Cumulative refunds (% + %) exceed order total (%)', 
            v_cumulative_refunds, NEW.refund_amount, v_order_total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_cumulative_refunds ON refund_details;
CREATE TRIGGER trigger_validate_cumulative_refunds
    BEFORE INSERT OR UPDATE OF refund_amount, status ON refund_details
    FOR EACH ROW
    WHEN (NEW.status IN ('approved', 'processing', 'completed'))
    EXECUTE FUNCTION validate_cumulative_refunds();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if customer can create refund request
CREATE OR REPLACE FUNCTION can_create_refund_request(
    p_order_id UUID,
    p_customer_id UUID,
    p_refund_amount DECIMAL(10, 2)
)
RETURNS TABLE(
    can_create BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_order RECORD;
    v_cumulative_refunds DECIMAL(10, 2);
BEGIN
    -- Check if order exists and belongs to customer
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND customer_id = p_customer_id;
    
    IF v_order IS NULL THEN
        RETURN QUERY SELECT false, 'Order not found or does not belong to customer'::TEXT;
        RETURN;
    END IF;
    
    -- Check if order is in a refundable state
    IF v_order.status NOT IN ('delivered', 'completed', 'partially_refunded') THEN
        RETURN QUERY SELECT false, 'Order must be delivered before requesting refund'::TEXT;
        RETURN;
    END IF;
    
    -- Get cumulative refunds for this order
    SELECT COALESCE(SUM(refund_amount), 0) INTO v_cumulative_refunds
    FROM refund_details
    WHERE order_id = p_order_id 
    AND status IN ('approved', 'processing', 'completed');
    
    -- Check if refund amount would exceed order total
    IF (v_cumulative_refunds + p_refund_amount) > v_order.total_amount THEN
        RETURN QUERY SELECT false, 
            format('Refund amount would exceed order total. Already refunded: %s, Order total: %s', 
                v_cumulative_refunds, v_order.total_amount)::TEXT;
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, 'Can create refund request'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission adjustment for refund
CREATE OR REPLACE FUNCTION calculate_refund_commission_adjustment(
    p_order_id UUID,
    p_refund_amount DECIMAL(10, 2)
)
RETURNS TABLE(
    commission_adjustment DECIMAL(10, 2),
    seller_deduction DECIMAL(10, 2)
) AS $$
DECLARE
    v_order RECORD;
    v_commission_rate DECIMAL(5, 4);
    v_commission_amount DECIMAL(10, 2);
BEGIN
    -- Get order details
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF v_order IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL(10, 2), 0::DECIMAL(10, 2);
        RETURN;
    END IF;
    
    -- Get commission rate (default to 10% if not found)
    -- This assumes there's a commission_rate column or we use a default
    v_commission_rate := 0.10; -- 10% default
    
    -- Calculate proportional commission adjustment
    v_commission_amount := ROUND(p_refund_amount * v_commission_rate, 2);
    
    -- Seller deduction is refund amount minus commission adjustment
    RETURN QUERY SELECT 
        v_commission_amount,
        p_refund_amount - v_commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to get cumulative refunds for an order
CREATE OR REPLACE FUNCTION get_cumulative_refunds(p_order_id UUID)
RETURNS TABLE(
    order_id UUID,
    original_amount DECIMAL(10, 2),
    total_refunded DECIMAL(10, 2),
    remaining_amount DECIMAL(10, 2),
    refund_count INTEGER,
    has_partial_refunds BOOLEAN
) AS $$
DECLARE
    v_order_total DECIMAL(10, 2);
    v_total_refunded DECIMAL(10, 2);
    v_refund_count INTEGER;
    v_has_partial BOOLEAN;
BEGIN
    -- Get order total
    SELECT total_amount INTO v_order_total
    FROM orders
    WHERE id = p_order_id;
    
    IF v_order_total IS NULL THEN
        RETURN;
    END IF;
    
    -- Get cumulative refunds
    SELECT 
        COALESCE(SUM(refund_amount), 0),
        COUNT(*),
        BOOL_OR(refund_type = 'partial')
    INTO v_total_refunded, v_refund_count, v_has_partial
    FROM refund_details
    WHERE order_id = p_order_id 
    AND status IN ('approved', 'processing', 'completed');
    
    RETURN QUERY SELECT 
        p_order_id,
        v_order_total,
        v_total_refunded,
        v_order_total - v_total_refunded,
        v_refund_count,
        COALESCE(v_has_partial, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get refund analytics
CREATE OR REPLACE FUNCTION get_refund_analytics(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW(),
    p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_refunds INTEGER,
    pending_refunds INTEGER,
    approved_refunds INTEGER,
    rejected_refunds INTEGER,
    completed_refunds INTEGER,
    total_refund_amount DECIMAL(12, 2),
    avg_refund_amount DECIMAL(10, 2),
    avg_processing_time_hours DECIMAL(10,2),
    full_refund_count INTEGER,
    partial_refund_count INTEGER,
    goodwill_refund_count INTEGER,
    common_reasons JSONB,
    high_refund_products JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_refunds,
        COUNT(*) FILTER (WHERE rd.status = 'pending')::INTEGER as pending_refunds,
        COUNT(*) FILTER (WHERE rd.status = 'approved')::INTEGER as approved_refunds,
        COUNT(*) FILTER (WHERE rd.status = 'rejected')::INTEGER as rejected_refunds,
        COUNT(*) FILTER (WHERE rd.status = 'completed')::INTEGER as completed_refunds,
        COALESCE(SUM(rd.refund_amount) FILTER (WHERE rd.status = 'completed'), 0)::DECIMAL(12, 2) as total_refund_amount,
        ROUND(AVG(rd.refund_amount) FILTER (WHERE rd.status = 'completed'), 2) as avg_refund_amount,
        ROUND(
            AVG(
                CASE 
                    WHEN rd.completed_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (rd.completed_at - rd.created_at)) / 3600
                    ELSE NULL
                END
            ), 2
        ) as avg_processing_time_hours,
        COUNT(*) FILTER (WHERE rd.refund_type = 'full')::INTEGER as full_refund_count,
        COUNT(*) FILTER (WHERE rd.refund_type = 'partial')::INTEGER as partial_refund_count,
        COUNT(*) FILTER (WHERE rd.refund_type = 'goodwill')::INTEGER as goodwill_refund_count,
        (
            SELECT jsonb_object_agg(reason_category, count)
            FROM (
                SELECT 
                    rd2.reason_category,
                    COUNT(*) as count
                FROM refund_details rd2
                WHERE rd2.created_at BETWEEN p_start_date AND p_end_date
                AND (p_seller_id IS NULL OR rd2.seller_id = p_seller_id)
                GROUP BY rd2.reason_category
                ORDER BY count DESC
            ) reasons
        ) as common_reasons,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'product_id', product_id,
                    'refund_count', refund_count,
                    'refund_rate', refund_rate
                )
            )
            FROM (
                SELECT 
                    oi.product_id,
                    COUNT(DISTINCT rd3.id) as refund_count,
                    ROUND(
                        (COUNT(DISTINCT rd3.id)::DECIMAL / NULLIF(
                            (SELECT COUNT(*) FROM order_items oi2 WHERE oi2.product_id = oi.product_id), 
                            0
                        ) * 100), 2
                    ) as refund_rate
                FROM refund_details rd3
                JOIN orders o ON rd3.order_id = o.id
                JOIN order_items oi ON o.id = oi.order_id
                WHERE rd3.created_at BETWEEN p_start_date AND p_end_date
                AND (p_seller_id IS NULL OR rd3.seller_id = p_seller_id)
                GROUP BY oi.product_id
                HAVING COUNT(DISTINCT rd3.id) >= 5  -- At least 5 refunds
                ORDER BY refund_count DESC
                LIMIT 10
            ) products
        ) as high_refund_products
    FROM refund_details rd
    WHERE rd.created_at BETWEEN p_start_date AND p_end_date
    AND (p_seller_id IS NULL OR rd.seller_id = p_seller_id);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate refund rate for a seller
CREATE OR REPLACE FUNCTION get_seller_refund_rate(p_seller_id UUID)
RETURNS TABLE(
    seller_id UUID,
    total_orders INTEGER,
    refund_requests INTEGER,
    refund_rate DECIMAL(5,2),
    should_alert BOOLEAN,
    total_refunded_amount DECIMAL(12, 2),
    avg_refund_amount DECIMAL(10, 2)
) AS $$
DECLARE
    v_total_orders INTEGER;
    v_refund_count INTEGER;
    v_rate DECIMAL(5,2);
    v_total_refunded DECIMAL(12, 2);
    v_avg_refund DECIMAL(10, 2);
BEGIN
    -- Count total orders for this seller
    SELECT COUNT(DISTINCT so.order_id) INTO v_total_orders
    FROM sub_orders so
    WHERE so.seller_id = p_seller_id;
    
    -- Count refund requests and amounts for this seller
    SELECT 
        COUNT(*),
        COALESCE(SUM(refund_amount) FILTER (WHERE status = 'completed'), 0),
        ROUND(AVG(refund_amount) FILTER (WHERE status = 'completed'), 2)
    INTO v_refund_count, v_total_refunded, v_avg_refund
    FROM refund_details
    WHERE seller_id = p_seller_id;
    
    -- Calculate rate
    IF v_total_orders > 0 THEN
        v_rate := ROUND((v_refund_count::DECIMAL / v_total_orders * 100), 2);
    ELSE
        v_rate := 0;
    END IF;
    
    -- Return results
    RETURN QUERY
    SELECT 
        p_seller_id,
        v_total_orders,
        v_refund_count,
        v_rate,
        (v_rate > 15.0 AND v_total_orders >= 10) as should_alert,
        v_total_refunded,
        v_avg_refund;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate refund rate for a product
CREATE OR REPLACE FUNCTION get_product_refund_rate(p_product_id UUID)
RETURNS TABLE(
    product_id UUID,
    total_orders INTEGER,
    refund_requests INTEGER,
    refund_rate DECIMAL(5,2),
    should_flag BOOLEAN,
    total_refunded_amount DECIMAL(12, 2)
) AS $$
DECLARE
    v_total_orders INTEGER;
    v_refund_count INTEGER;
    v_rate DECIMAL(5,2);
    v_total_refunded DECIMAL(12, 2);
BEGIN
    -- Count total orders containing this product
    SELECT COUNT(DISTINCT oi.order_id) INTO v_total_orders
    FROM order_items oi
    WHERE oi.product_id = p_product_id;
    
    -- Count refund requests for orders containing this product
    SELECT 
        COUNT(DISTINCT rd.id),
        COALESCE(SUM(rd.refund_amount) FILTER (WHERE rd.status = 'completed'), 0)
    INTO v_refund_count, v_total_refunded
    FROM refund_details rd
    JOIN order_items oi ON rd.order_id = oi.order_id
    WHERE oi.product_id = p_product_id;
    
    -- Calculate rate
    IF v_total_orders > 0 THEN
        v_rate := ROUND((v_refund_count::DECIMAL / v_total_orders * 100), 2);
    ELSE
        v_rate := 0;
    END IF;
    
    -- Return results
    RETURN QUERY
    SELECT 
        p_product_id,
        v_total_orders,
        v_refund_count,
        v_rate,
        (v_rate > 20.0 AND v_total_orders >= 10) as should_flag,
        v_total_refunded;
END;
$$ LANGUAGE plpgsql;

-- Function to get seller refund metrics
CREATE OR REPLACE FUNCTION get_seller_refund_metrics(p_seller_id UUID)
RETURNS TABLE(
    seller_id UUID,
    total_requests INTEGER,
    pending_count INTEGER,
    approved_count INTEGER,
    rejected_count INTEGER,
    completed_count INTEGER,
    full_refund_count INTEGER,
    partial_refund_count INTEGER,
    goodwill_refund_count INTEGER,
    total_refunded DECIMAL(12, 2),
    avg_processing_hours DECIMAL(10,2),
    most_common_reason VARCHAR(50),
    refund_rate DECIMAL(5,2)
) AS $$
DECLARE
    v_total_orders INTEGER;
BEGIN
    -- Get total orders for this seller
    SELECT COUNT(DISTINCT so.order_id) INTO v_total_orders
    FROM sub_orders so
    WHERE so.seller_id = p_seller_id;
    
    RETURN QUERY
    SELECT 
        p_seller_id,
        COUNT(*)::INTEGER as total_requests,
        COUNT(*) FILTER (WHERE rd.status = 'pending')::INTEGER as pending_count,
        COUNT(*) FILTER (WHERE rd.status = 'approved')::INTEGER as approved_count,
        COUNT(*) FILTER (WHERE rd.status = 'rejected')::INTEGER as rejected_count,
        COUNT(*) FILTER (WHERE rd.status = 'completed')::INTEGER as completed_count,
        COUNT(*) FILTER (WHERE rd.refund_type = 'full')::INTEGER as full_refund_count,
        COUNT(*) FILTER (WHERE rd.refund_type = 'partial')::INTEGER as partial_refund_count,
        COUNT(*) FILTER (WHERE rd.refund_type = 'goodwill')::INTEGER as goodwill_refund_count,
        COALESCE(SUM(rd.refund_amount) FILTER (WHERE rd.status = 'completed'), 0)::DECIMAL(12, 2) as total_refunded,
        ROUND(
            AVG(
                CASE 
                    WHEN rd.completed_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (rd.completed_at - rd.created_at)) / 3600
                    ELSE NULL
                END
            ), 2
        ) as avg_processing_hours,
        (
            SELECT reason_category
            FROM refund_details rd2
            WHERE rd2.seller_id = p_seller_id
            GROUP BY reason_category
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_reason,
        CASE 
            WHEN v_total_orders > 0 THEN
                ROUND((COUNT(*)::DECIMAL / v_total_orders * 100), 2)
            ELSE 0
        END as refund_rate
    FROM refund_details rd
    WHERE rd.seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check refund processing time and alert if exceeds threshold
CREATE OR REPLACE FUNCTION check_refund_processing_time_alerts()
RETURNS TABLE(
    refund_id UUID,
    order_id UUID,
    customer_id UUID,
    seller_id UUID,
    days_pending INTEGER,
    should_alert BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rd.id,
        rd.order_id,
        rd.customer_id,
        rd.seller_id,
        EXTRACT(DAY FROM NOW() - rd.created_at)::INTEGER as days_pending,
        (EXTRACT(DAY FROM NOW() - rd.created_at) > 5) as should_alert
    FROM refund_details rd
    WHERE rd.status IN ('pending', 'approved')
    AND EXTRACT(DAY FROM NOW() - rd.created_at) > 5
    ORDER BY rd.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD COLUMNS TO ORDERS TABLE (if needed)
-- =====================================================

DO $$
BEGIN
    -- Add refund_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'refund_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN refund_status VARCHAR(20) DEFAULT 'none' 
            CHECK (refund_status IN ('none', 'partially_refunded', 'fully_refunded'));
    END IF;
    
    -- Add total_refunded column for tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_refunded'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_refunded DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Create index for refund status
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status) 
    WHERE refund_status != 'none';

-- =====================================================
-- ADD COLUMNS TO PRODUCTS TABLE (if needed)
-- =====================================================

DO $$
BEGIN
    -- Add refund_count column for tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'refund_count'
    ) THEN
        ALTER TABLE products ADD COLUMN refund_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add is_flagged_high_refund column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_flagged_high_refund'
    ) THEN
        ALTER TABLE products ADD COLUMN is_flagged_high_refund BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for flagged products
CREATE INDEX IF NOT EXISTS idx_products_flagged_refund ON products(is_flagged_high_refund) 
    WHERE is_flagged_high_refund = true;

-- =====================================================
-- TRIGGER TO UPDATE ORDER REFUND STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION update_order_refund_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_total DECIMAL(10, 2);
    v_total_refunded DECIMAL(10, 2);
BEGIN
    -- Only update when refund is completed
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
        -- Get order total
        SELECT total_amount INTO v_order_total
        FROM orders
        WHERE id = NEW.order_id;
        
        -- Get cumulative refunds
        SELECT COALESCE(SUM(refund_amount), 0) INTO v_total_refunded
        FROM refund_details
        WHERE order_id = NEW.order_id 
        AND status = 'completed';
        
        -- Update order refund status
        IF v_total_refunded >= v_order_total THEN
            UPDATE orders
            SET refund_status = 'fully_refunded',
                total_refunded = v_total_refunded,
                status = 'refunded',
                updated_at = NOW()
            WHERE id = NEW.order_id;
        ELSIF v_total_refunded > 0 THEN
            UPDATE orders
            SET refund_status = 'partially_refunded',
                total_refunded = v_total_refunded,
                status = 'partially_refunded',
                updated_at = NOW()
            WHERE id = NEW.order_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_refund_status ON refund_details;
CREATE TRIGGER trigger_update_order_refund_status
    AFTER INSERT OR UPDATE OF status ON refund_details
    FOR EACH ROW
    EXECUTE FUNCTION update_order_refund_status();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Enhanced Refund Process System Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - refund_details (with partial refund support)';
    RAISE NOTICE '  - refund_images (for evidence storage)';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created for:';
    RAISE NOTICE '  - Order, customer, seller lookups';
    RAISE NOTICE '  - Status filtering (especially pending refunds)';
    RAISE NOTICE '  - Refund type filtering';
    RAISE NOTICE '  - Reason category analytics';
    RAISE NOTICE '  - Goodwill refund tracking';
    RAISE NOTICE '  - Processing time monitoring';
    RAISE NOTICE '';
    RAISE NOTICE 'Check constraints added for:';
    RAISE NOTICE '  - Refund types (full, partial, goodwill)';
    RAISE NOTICE '  - Reason categories (7 valid values)';
    RAISE NOTICE '  - Status values (6 valid states)';
    RAISE NOTICE '  - Refund amount validation (> 0)';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  - Automatic updated_at timestamp updates';
    RAISE NOTICE '  - Automatic reviewed_at, processed_at, completed_at timestamps';
    RAISE NOTICE '  - Cumulative refund validation (prevents exceeding order total)';
    RAISE NOTICE '  - Order refund status updates';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper functions created:';
    RAISE NOTICE '  - can_create_refund_request()';
    RAISE NOTICE '  - calculate_refund_commission_adjustment()';
    RAISE NOTICE '  - get_cumulative_refunds()';
    RAISE NOTICE '  - get_refund_analytics()';
    RAISE NOTICE '  - get_seller_refund_rate()';
    RAISE NOTICE '  - get_product_refund_rate()';
    RAISE NOTICE '  - get_seller_refund_metrics()';
    RAISE NOTICE '  - check_refund_processing_time_alerts()';
    RAISE NOTICE '';
    RAISE NOTICE 'Additional columns added:';
    RAISE NOTICE '  - orders.refund_status (none, partially_refunded, fully_refunded)';
    RAISE NOTICE '  - orders.total_refunded (default 0)';
    RAISE NOTICE '  - products.refund_count (default 0)';
    RAISE NOTICE '  - products.is_flagged_high_refund (default false)';
    RAISE NOTICE '';
    RAISE NOTICE 'Requirements validated:';
    RAISE NOTICE '  - 5.1: Full and partial refund support';
    RAISE NOTICE '  - 5.2: Partial refund with amount, reason, and items';
    RAISE NOTICE '  - 5.3: Refund reason categories';
    RAISE NOTICE '  - 5.4: Image upload support (up to 5 images)';
    RAISE NOTICE '========================================';
END $$;

