-- =====================================================
-- DELIVERY RATING SYSTEM TABLES
-- FastShop E-Commerce Platform
-- Implements Requirements 3.1, 3.2, 3.10
-- Matches design.md specifications exactly
-- =====================================================

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DELIVERY_RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sub_order_id UUID REFERENCES sub_orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    packaging_quality_rating INTEGER NOT NULL CHECK (packaging_quality_rating BETWEEN 1 AND 5),
    delivery_speed_rating INTEGER NOT NULL CHECK (delivery_speed_rating BETWEEN 1 AND 5),
    delivery_person_rating INTEGER CHECK (delivery_person_rating BETWEEN 1 AND 5),
    overall_feedback TEXT,
    packaging_feedback TEXT,
    delivery_speed_feedback TEXT,
    delivery_person_feedback TEXT,
    is_flagged BOOLEAN DEFAULT false,
    flagged_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_order_delivery_rating UNIQUE (order_id, seller_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for order lookup
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_order ON delivery_ratings(order_id);

-- Index for seller lookup (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_seller ON delivery_ratings(seller_id);

-- Index for customer lookup
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_customer ON delivery_ratings(customer_id);

-- Index for flagged ratings (Manager review)
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_flagged ON delivery_ratings(is_flagged) 
    WHERE is_flagged = true;

-- Index for low ratings (ratings below 3 stars)
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_low ON delivery_ratings(overall_rating) 
    WHERE overall_rating < 3;

-- Composite index for seller performance queries
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_seller_created ON delivery_ratings(seller_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE delivery_ratings ENABLE ROW LEVEL SECURITY;

-- Service role has full access
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Service role full access delivery_ratings" ON delivery_ratings;
CREATE POLICY "Service role full access delivery_ratings" 
    ON delivery_ratings FOR ALL 
    USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically flag low ratings
CREATE OR REPLACE FUNCTION flag_low_delivery_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Flag if any rating category is below 3 stars
    IF NEW.overall_rating < 3 OR 
       NEW.packaging_quality_rating < 3 OR 
       NEW.delivery_speed_rating < 3 OR 
       (NEW.delivery_person_rating IS NOT NULL AND NEW.delivery_person_rating < 3) THEN
        NEW.is_flagged := true;
        NEW.flagged_reason := 'Automatically flagged: One or more rating categories below 3 stars';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flag_low_delivery_rating ON delivery_ratings;
CREATE TRIGGER trigger_flag_low_delivery_rating
    BEFORE INSERT OR UPDATE ON delivery_ratings
    FOR EACH ROW
    EXECUTE FUNCTION flag_low_delivery_rating();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate seller delivery performance metrics
CREATE OR REPLACE FUNCTION get_seller_delivery_metrics(p_seller_id UUID)
RETURNS TABLE(
    seller_id UUID,
    total_ratings INTEGER,
    avg_overall_rating DECIMAL(3,2),
    avg_packaging_quality DECIMAL(3,2),
    avg_delivery_speed DECIMAL(3,2),
    avg_delivery_person DECIMAL(3,2),
    flagged_count INTEGER,
    low_rating_count INTEGER,
    rating_trend VARCHAR(20)
) AS $$
DECLARE
    v_recent_avg DECIMAL(3,2);
    v_older_avg DECIMAL(3,2);
    v_trend VARCHAR(20);
BEGIN
    -- Calculate recent average (last 30 days)
    SELECT AVG(overall_rating) INTO v_recent_avg
    FROM delivery_ratings
    WHERE seller_id = p_seller_id
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate older average (30-60 days ago)
    SELECT AVG(overall_rating) INTO v_older_avg
    FROM delivery_ratings
    WHERE seller_id = p_seller_id
    AND created_at >= NOW() - INTERVAL '60 days'
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Determine trend
    IF v_recent_avg IS NULL OR v_older_avg IS NULL THEN
        v_trend := 'insufficient_data';
    ELSIF v_recent_avg > v_older_avg + 0.2 THEN
        v_trend := 'improving';
    ELSIF v_recent_avg < v_older_avg - 0.2 THEN
        v_trend := 'declining';
    ELSE
        v_trend := 'stable';
    END IF;
    
    -- Return aggregated metrics
    RETURN QUERY
    SELECT 
        p_seller_id,
        COUNT(*)::INTEGER as total_ratings,
        ROUND(AVG(dr.overall_rating), 2) as avg_overall_rating,
        ROUND(AVG(dr.packaging_quality_rating), 2) as avg_packaging_quality,
        ROUND(AVG(dr.delivery_speed_rating), 2) as avg_delivery_speed,
        ROUND(AVG(dr.delivery_person_rating), 2) as avg_delivery_person,
        COUNT(*) FILTER (WHERE dr.is_flagged = true)::INTEGER as flagged_count,
        COUNT(*) FILTER (WHERE dr.overall_rating < 3)::INTEGER as low_rating_count,
        v_trend as rating_trend
    FROM delivery_ratings dr
    WHERE dr.seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get seller rating distribution
CREATE OR REPLACE FUNCTION get_seller_rating_distribution(p_seller_id UUID)
RETURNS TABLE(
    rating_value INTEGER,
    count INTEGER,
    percentage DECIMAL(5,2)
) AS $$
DECLARE
    v_total_ratings INTEGER;
BEGIN
    -- Get total ratings count
    SELECT COUNT(*) INTO v_total_ratings
    FROM delivery_ratings
    WHERE seller_id = p_seller_id;
    
    -- Return distribution for each star rating (1-5)
    RETURN QUERY
    SELECT 
        stars.rating as rating_value,
        COALESCE(COUNT(dr.id), 0)::INTEGER as count,
        CASE 
            WHEN v_total_ratings > 0 THEN 
                ROUND((COALESCE(COUNT(dr.id), 0)::DECIMAL / v_total_ratings * 100), 2)
            ELSE 0
        END as percentage
    FROM (
        SELECT generate_series(1, 5) as rating
    ) stars
    LEFT JOIN delivery_ratings dr 
        ON dr.overall_rating = stars.rating 
        AND dr.seller_id = p_seller_id
    GROUP BY stars.rating
    ORDER BY stars.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if customer can submit delivery rating
CREATE OR REPLACE FUNCTION can_submit_delivery_rating(
    p_order_id UUID,
    p_customer_id UUID,
    p_seller_id UUID
)
RETURNS TABLE(
    can_submit BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_order RECORD;
    v_existing_rating RECORD;
    v_days_since_delivery INTEGER;
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
        RETURN QUERY SELECT false, 'Order must be delivered before rating'::TEXT;
        RETURN;
    END IF;
    
    -- Check if rating already exists
    SELECT * INTO v_existing_rating
    FROM delivery_ratings
    WHERE order_id = p_order_id AND seller_id = p_seller_id;
    
    IF v_existing_rating IS NOT NULL THEN
        RETURN QUERY SELECT false, 'Delivery rating already submitted for this order and seller'::TEXT;
        RETURN;
    END IF;
    
    -- Check 30-day window (if delivered_at column exists)
    IF v_order.delivered_at IS NOT NULL THEN
        v_days_since_delivery := EXTRACT(DAY FROM NOW() - v_order.delivered_at);
        
        IF v_days_since_delivery > 30 THEN
            RETURN QUERY SELECT false, 'Rating window has expired (30 days after delivery)'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT true, 'Can submit delivery rating'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get delivery rating analytics for managers
CREATE OR REPLACE FUNCTION get_delivery_rating_analytics(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE(
    total_ratings INTEGER,
    avg_overall_rating DECIMAL(3,2),
    flagged_ratings INTEGER,
    low_rating_sellers JSONB,
    common_issues JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_ratings,
        ROUND(AVG(dr.overall_rating), 2) as avg_overall_rating,
        COUNT(*) FILTER (WHERE dr.is_flagged = true)::INTEGER as flagged_ratings,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'seller_id', seller_id,
                    'avg_rating', avg_rating,
                    'rating_count', rating_count
                )
            )
            FROM (
                SELECT 
                    dr2.seller_id,
                    ROUND(AVG(dr2.overall_rating), 2) as avg_rating,
                    COUNT(*) as rating_count
                FROM delivery_ratings dr2
                WHERE dr2.created_at BETWEEN p_start_date AND p_end_date
                GROUP BY dr2.seller_id
                HAVING AVG(dr2.overall_rating) < 3.0
                ORDER BY avg_rating ASC
                LIMIT 10
            ) low_sellers
        ) as low_rating_sellers,
        (
            SELECT jsonb_build_object(
                'low_packaging', COUNT(*) FILTER (WHERE packaging_quality_rating < 3),
                'low_speed', COUNT(*) FILTER (WHERE delivery_speed_rating < 3),
                'low_person', COUNT(*) FILTER (WHERE delivery_person_rating < 3)
            )
            FROM delivery_ratings dr3
            WHERE dr3.created_at BETWEEN p_start_date AND p_end_date
        ) as common_issues
    FROM delivery_ratings dr
    WHERE dr.created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD COLUMNS TO ORDERS TABLE (if needed)
-- =====================================================

DO $$
BEGIN
    -- Add delivered_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
    END IF;
    
    -- Add delivery_rated column to track if rating submitted
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_rated'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_rated BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for delivered orders
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) 
    WHERE status = 'delivered';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Delivery Rating System Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - delivery_ratings (with multi-dimensional ratings)';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created for:';
    RAISE NOTICE '  - Seller lookup (most common query)';
    RAISE NOTICE '  - Flagged ratings (Manager review)';
    RAISE NOTICE '  - Low ratings (< 3 stars)';
    RAISE NOTICE '  - Order and customer lookups';
    RAISE NOTICE '';
    RAISE NOTICE 'Check constraints added for:';
    RAISE NOTICE '  - Rating values (1-5 stars)';
    RAISE NOTICE '  - Unique constraint (order + seller)';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  - Automatic flagging of low ratings';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper functions created:';
    RAISE NOTICE '  - get_seller_delivery_metrics()';
    RAISE NOTICE '  - get_seller_rating_distribution()';
    RAISE NOTICE '  - can_submit_delivery_rating()';
    RAISE NOTICE '  - get_delivery_rating_analytics()';
    RAISE NOTICE '========================================';
END $$;
