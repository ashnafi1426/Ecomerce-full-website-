-- =====================================================
-- REPLACEMENT PROCESS SYSTEM TABLES
-- FastShop E-Commerce Platform
-- Implements Requirements 4.1, 4.2, 4.6, 4.7
-- Matches design.md specifications exactly
-- =====================================================

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. REPLACEMENT_REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS replacement_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    reason_category VARCHAR(50) NOT NULL CHECK (reason_category IN (
        'defective_product', 'wrong_item', 'damaged_shipping', 'missing_parts', 'other'
    )),
    reason_description TEXT NOT NULL,
    images JSONB DEFAULT '[]', -- Array of image URLs
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'shipped', 'completed', 'cancelled'
    )),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    return_tracking_number VARCHAR(100),
    return_received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. REPLACEMENT_SHIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS replacement_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    replacement_request_id UUID NOT NULL REFERENCES replacement_requests(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    shipped_at TIMESTAMP,
    estimated_delivery TIMESTAMP,
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_replacement_shipment UNIQUE (replacement_request_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for replacement_requests table
CREATE INDEX IF NOT EXISTS idx_replacement_order ON replacement_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_replacement_customer ON replacement_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_replacement_seller ON replacement_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_replacement_product ON replacement_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_replacement_variant ON replacement_requests(variant_id);
CREATE INDEX IF NOT EXISTS idx_replacement_status ON replacement_requests(status);

-- Index for pending requests (most common query for managers)
CREATE INDEX IF NOT EXISTS idx_replacement_pending ON replacement_requests(status, created_at) 
    WHERE status = 'pending';

-- Composite index for seller's replacement requests
CREATE INDEX IF NOT EXISTS idx_replacement_seller_status ON replacement_requests(seller_id, status, created_at DESC);

-- Index for reason category analytics
CREATE INDEX IF NOT EXISTS idx_replacement_reason ON replacement_requests(reason_category);

-- Indexes for replacement_shipments table
CREATE INDEX IF NOT EXISTS idx_replacement_shipment_request ON replacement_shipments(replacement_request_id);
CREATE INDEX IF NOT EXISTS idx_replacement_shipment_tracking ON replacement_shipments(tracking_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE replacement_shipments ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access replacement_requests" ON replacement_requests;
CREATE POLICY "Service role full access replacement_requests" 
    ON replacement_requests FOR ALL 
    USING (true);

DROP POLICY IF EXISTS "Service role full access replacement_shipments" ON replacement_shipments;
CREATE POLICY "Service role full access replacement_shipments" 
    ON replacement_shipments FOR ALL 
    USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_replacement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_replacement_requests_updated_at ON replacement_requests;
CREATE TRIGGER trigger_update_replacement_requests_updated_at
    BEFORE UPDATE ON replacement_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_replacement_updated_at();

DROP TRIGGER IF EXISTS trigger_update_replacement_shipments_updated_at ON replacement_shipments;
CREATE TRIGGER trigger_update_replacement_shipments_updated_at
    BEFORE UPDATE ON replacement_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_replacement_updated_at();

-- Trigger to set reviewed_at timestamp when status changes from pending
CREATE OR REPLACE FUNCTION set_replacement_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set reviewed_at when status changes from pending to approved or rejected
    IF OLD.status = 'pending' AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
        IF NEW.reviewed_at IS NULL THEN
            NEW.reviewed_at := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_replacement_reviewed_at ON replacement_requests;
CREATE TRIGGER trigger_set_replacement_reviewed_at
    BEFORE UPDATE ON replacement_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_replacement_reviewed_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if customer can create replacement request
CREATE OR REPLACE FUNCTION can_create_replacement_request(
    p_order_id UUID,
    p_customer_id UUID,
    p_product_id UUID
)
RETURNS TABLE(
    can_create BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_order RECORD;
    v_days_since_delivery INTEGER;
    v_product RECORD;
BEGIN
    -- Check if order exists and belongs to customer
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND customer_id = p_customer_id;
    
    IF v_order IS NULL THEN
        RETURN QUERY SELECT false, 'Order not found or does not belong to customer'::TEXT;
        RETURN;
    END IF;
    
    -- Check if order is delivered
    IF v_order.status != 'delivered' THEN
        RETURN QUERY SELECT false, 'Order must be delivered before requesting replacement'::TEXT;
        RETURN;
    END IF;
    
    -- Check 30-day window (if delivered_at column exists)
    IF v_order.delivered_at IS NOT NULL THEN
        v_days_since_delivery := EXTRACT(DAY FROM NOW() - v_order.delivered_at);
        
        IF v_days_since_delivery > 30 THEN
            RETURN QUERY SELECT false, 'Replacement window has expired (30 days after delivery)'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Check if product is returnable (if is_returnable column exists)
    SELECT * INTO v_product
    FROM products
    WHERE id = p_product_id;
    
    IF v_product IS NULL THEN
        RETURN QUERY SELECT false, 'Product not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if product is marked as non-returnable (if column exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_returnable'
    ) THEN
        IF NOT v_product.is_returnable THEN
            RETURN QUERY SELECT false, 'This product is marked as final sale and not eligible for replacement'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, 'Can create replacement request'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get replacement analytics
CREATE OR REPLACE FUNCTION get_replacement_analytics(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW(),
    p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_requests INTEGER,
    pending_requests INTEGER,
    approved_requests INTEGER,
    rejected_requests INTEGER,
    completed_requests INTEGER,
    avg_processing_time_hours DECIMAL(10,2),
    common_reasons JSONB,
    high_replacement_products JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        COUNT(*) FILTER (WHERE rr.status = 'pending')::INTEGER as pending_requests,
        COUNT(*) FILTER (WHERE rr.status = 'approved')::INTEGER as approved_requests,
        COUNT(*) FILTER (WHERE rr.status = 'rejected')::INTEGER as rejected_requests,
        COUNT(*) FILTER (WHERE rr.status = 'completed')::INTEGER as completed_requests,
        ROUND(
            AVG(
                CASE 
                    WHEN rr.reviewed_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (rr.reviewed_at - rr.created_at)) / 3600
                    ELSE NULL
                END
            ), 2
        ) as avg_processing_time_hours,
        (
            SELECT jsonb_object_agg(reason_category, count)
            FROM (
                SELECT 
                    rr2.reason_category,
                    COUNT(*) as count
                FROM replacement_requests rr2
                WHERE rr2.created_at BETWEEN p_start_date AND p_end_date
                AND (p_seller_id IS NULL OR rr2.seller_id = p_seller_id)
                GROUP BY rr2.reason_category
                ORDER BY count DESC
            ) reasons
        ) as common_reasons,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'product_id', product_id,
                    'replacement_count', replacement_count,
                    'replacement_rate', replacement_rate
                )
            )
            FROM (
                SELECT 
                    rr3.product_id,
                    COUNT(*) as replacement_count,
                    ROUND(
                        (COUNT(*)::DECIMAL / NULLIF(
                            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = rr3.product_id), 
                            0
                        ) * 100), 2
                    ) as replacement_rate
                FROM replacement_requests rr3
                WHERE rr3.created_at BETWEEN p_start_date AND p_end_date
                AND (p_seller_id IS NULL OR rr3.seller_id = p_seller_id)
                GROUP BY rr3.product_id
                HAVING COUNT(*) >= 5  -- At least 5 replacements
                ORDER BY replacement_count DESC
                LIMIT 10
            ) products
        ) as high_replacement_products
    FROM replacement_requests rr
    WHERE rr.created_at BETWEEN p_start_date AND p_end_date
    AND (p_seller_id IS NULL OR rr.seller_id = p_seller_id);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate replacement rate for a product
CREATE OR REPLACE FUNCTION get_product_replacement_rate(p_product_id UUID)
RETURNS TABLE(
    product_id UUID,
    total_orders INTEGER,
    replacement_requests INTEGER,
    replacement_rate DECIMAL(5,2),
    should_alert BOOLEAN
) AS $$
DECLARE
    v_total_orders INTEGER;
    v_replacement_count INTEGER;
    v_rate DECIMAL(5,2);
BEGIN
    -- Count total orders containing this product
    SELECT COUNT(DISTINCT oi.order_id) INTO v_total_orders
    FROM order_items oi
    WHERE oi.product_id = p_product_id;
    
    -- Count replacement requests for this product
    SELECT COUNT(*) INTO v_replacement_count
    FROM replacement_requests
    WHERE product_id = p_product_id;
    
    -- Calculate rate
    IF v_total_orders > 0 THEN
        v_rate := ROUND((v_replacement_count::DECIMAL / v_total_orders * 100), 2);
    ELSE
        v_rate := 0;
    END IF;
    
    -- Return results
    RETURN QUERY
    SELECT 
        p_product_id,
        v_total_orders,
        v_replacement_count,
        v_rate,
        (v_rate > 10.0 AND v_total_orders >= 10) as should_alert;
END;
$$ LANGUAGE plpgsql;

-- Function to get seller replacement metrics
CREATE OR REPLACE FUNCTION get_seller_replacement_metrics(p_seller_id UUID)
RETURNS TABLE(
    seller_id UUID,
    total_requests INTEGER,
    pending_count INTEGER,
    approved_count INTEGER,
    rejected_count INTEGER,
    completed_count INTEGER,
    avg_processing_hours DECIMAL(10,2),
    most_common_reason VARCHAR(50),
    replacement_rate DECIMAL(5,2)
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
        COUNT(*) FILTER (WHERE rr.status = 'pending')::INTEGER as pending_count,
        COUNT(*) FILTER (WHERE rr.status = 'approved')::INTEGER as approved_count,
        COUNT(*) FILTER (WHERE rr.status = 'rejected')::INTEGER as rejected_count,
        COUNT(*) FILTER (WHERE rr.status = 'completed')::INTEGER as completed_count,
        ROUND(
            AVG(
                CASE 
                    WHEN rr.reviewed_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (rr.reviewed_at - rr.created_at)) / 3600
                    ELSE NULL
                END
            ), 2
        ) as avg_processing_hours,
        (
            SELECT reason_category
            FROM replacement_requests rr2
            WHERE rr2.seller_id = p_seller_id
            GROUP BY reason_category
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_reason,
        CASE 
            WHEN v_total_orders > 0 THEN
                ROUND((COUNT(*)::DECIMAL / v_total_orders * 100), 2)
            ELSE 0
        END as replacement_rate
    FROM replacement_requests rr
    WHERE rr.seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory for approved replacement
CREATE OR REPLACE FUNCTION reserve_replacement_inventory(
    p_replacement_request_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_request RECORD;
    v_available_quantity INTEGER;
BEGIN
    -- Get replacement request details
    SELECT * INTO v_request
    FROM replacement_requests
    WHERE id = p_replacement_request_id;
    
    IF v_request IS NULL THEN
        RETURN QUERY SELECT false, 'Replacement request not found'::TEXT;
        RETURN;
    END IF;
    
    IF v_request.status != 'approved' THEN
        RETURN QUERY SELECT false, 'Replacement request must be approved before reserving inventory'::TEXT;
        RETURN;
    END IF;
    
    -- Check if variant-based or product-based
    IF v_request.variant_id IS NOT NULL THEN
        -- Check variant inventory
        SELECT quantity INTO v_available_quantity
        FROM variant_inventory
        WHERE variant_id = v_request.variant_id;
        
        IF v_available_quantity IS NULL OR v_available_quantity < v_request.quantity THEN
            RETURN QUERY SELECT false, 'Insufficient variant inventory for replacement'::TEXT;
            RETURN;
        END IF;
        
        -- Reserve inventory by increasing reserved_quantity
        UPDATE variant_inventory
        SET reserved_quantity = reserved_quantity + v_request.quantity,
            updated_at = NOW()
        WHERE variant_id = v_request.variant_id;
        
    ELSE
        -- Check product inventory (if inventory table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
            SELECT stock_quantity INTO v_available_quantity
            FROM inventory
            WHERE product_id = v_request.product_id;
            
            IF v_available_quantity IS NULL OR v_available_quantity < v_request.quantity THEN
                RETURN QUERY SELECT false, 'Insufficient product inventory for replacement'::TEXT;
                RETURN;
            END IF;
            
            -- Reserve inventory (if reserved_quantity column exists)
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'inventory' AND column_name = 'reserved_quantity'
            ) THEN
                UPDATE inventory
                SET reserved_quantity = reserved_quantity + v_request.quantity,
                    updated_at = NOW()
                WHERE product_id = v_request.product_id;
            END IF;
        END IF;
    END IF;
    
    RETURN QUERY SELECT true, 'Inventory reserved successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD COLUMNS TO PRODUCTS TABLE (if needed)
-- =====================================================

DO $$
BEGIN
    -- Add is_returnable column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_returnable'
    ) THEN
        ALTER TABLE products ADD COLUMN is_returnable BOOLEAN DEFAULT true;
    END IF;
    
    -- Add replacement_count column for tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'replacement_count'
    ) THEN
        ALTER TABLE products ADD COLUMN replacement_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index for non-returnable products
CREATE INDEX IF NOT EXISTS idx_products_returnable ON products(is_returnable) 
    WHERE is_returnable = false;

-- =====================================================
-- ADD COLUMNS TO INVENTORY TABLE (if needed)
-- =====================================================

DO $$
BEGIN
    -- Add reserved_quantity column to inventory table if it exists and doesn't have the column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'inventory' AND column_name = 'reserved_quantity'
        ) THEN
            ALTER TABLE inventory ADD COLUMN reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0);
        END IF;
    END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Replacement Process System Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - replacement_requests (with status workflow)';
    RAISE NOTICE '  - replacement_shipments (for tracking)';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created for:';
    RAISE NOTICE '  - Order, customer, seller, product lookups';
    RAISE NOTICE '  - Status filtering (especially pending requests)';
    RAISE NOTICE '  - Reason category analytics';
    RAISE NOTICE '  - Shipment tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Check constraints added for:';
    RAISE NOTICE '  - Reason categories (5 valid values)';
    RAISE NOTICE '  - Status values (6 valid states)';
    RAISE NOTICE '  - Quantity validation (> 0)';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  - Automatic updated_at timestamp updates';
    RAISE NOTICE '  - Automatic reviewed_at timestamp on approval/rejection';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper functions created:';
    RAISE NOTICE '  - can_create_replacement_request()';
    RAISE NOTICE '  - get_replacement_analytics()';
    RAISE NOTICE '  - get_product_replacement_rate()';
    RAISE NOTICE '  - get_seller_replacement_metrics()';
    RAISE NOTICE '  - reserve_replacement_inventory()';
    RAISE NOTICE '';
    RAISE NOTICE 'Additional columns added:';
    RAISE NOTICE '  - products.is_returnable (default true)';
    RAISE NOTICE '  - products.replacement_count (default 0)';
    RAISE NOTICE '  - inventory.reserved_quantity (if table exists)';
    RAISE NOTICE '========================================';
END $$;
