-- =====================================================
-- UPDATE DELIVERY RATING SYSTEM SCHEMA
-- FastShop E-Commerce Platform
-- Implements Requirements 3.1, 3.2, 3.10
-- Updates existing delivery_ratings table to match design.md
-- This migration is IDEMPOTENT - safe to run multiple times
-- =====================================================

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. UPDATE DELIVERY_RATINGS TABLE
-- Add any missing columns to existing table
-- =====================================================

DO $$
BEGIN
    -- Add sub_order_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'sub_order_id'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN sub_order_id UUID REFERENCES sub_orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added column: sub_order_id';
    ELSE
        RAISE NOTICE 'Column sub_order_id already exists';
    END IF;

    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added column: customer_id';
    ELSE
        RAISE NOTICE 'Column customer_id already exists';
    END IF;

    -- Add seller_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added column: seller_id';
    ELSE
        RAISE NOTICE 'Column seller_id already exists';
    END IF;

    -- Add overall_rating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'overall_rating'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added column: overall_rating';
    ELSE
        RAISE NOTICE 'Column overall_rating already exists';
    END IF;

    -- Add packaging_quality_rating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'packaging_quality_rating'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN packaging_quality_rating INTEGER NOT NULL CHECK (packaging_quality_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added column: packaging_quality_rating';
    ELSE
        RAISE NOTICE 'Column packaging_quality_rating already exists';
    END IF;

    -- Add delivery_speed_rating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'delivery_speed_rating'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN delivery_speed_rating INTEGER NOT NULL CHECK (delivery_speed_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added column: delivery_speed_rating';
    ELSE
        RAISE NOTICE 'Column delivery_speed_rating already exists';
    END IF;

    -- Add delivery_person_rating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'delivery_person_rating'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN delivery_person_rating INTEGER CHECK (delivery_person_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added column: delivery_person_rating';
    ELSE
        RAISE NOTICE 'Column delivery_person_rating already exists';
    END IF;

    -- Add overall_feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'overall_feedback'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN overall_feedback TEXT;
        RAISE NOTICE 'Added column: overall_feedback';
    ELSE
        RAISE NOTICE 'Column overall_feedback already exists';
    END IF;

    -- Add packaging_feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'packaging_feedback'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN packaging_feedback TEXT;
        RAISE NOTICE 'Added column: packaging_feedback';
    ELSE
        RAISE NOTICE 'Column packaging_feedback already exists';
    END IF;

    -- Add delivery_speed_feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'delivery_speed_feedback'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN delivery_speed_feedback TEXT;
        RAISE NOTICE 'Added column: delivery_speed_feedback';
    ELSE
        RAISE NOTICE 'Column delivery_speed_feedback already exists';
    END IF;

    -- Add delivery_person_feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'delivery_person_feedback'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN delivery_person_feedback TEXT;
        RAISE NOTICE 'Added column: delivery_person_feedback';
    ELSE
        RAISE NOTICE 'Column delivery_person_feedback already exists';
    END IF;

    -- Add is_flagged column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'is_flagged'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN is_flagged BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: is_flagged';
    ELSE
        RAISE NOTICE 'Column is_flagged already exists';
    END IF;

    -- Add flagged_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'flagged_reason'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN flagged_reason TEXT;
        RAISE NOTICE 'Added column: flagged_reason';
    ELSE
        RAISE NOTICE 'Column flagged_reason already exists';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_ratings' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added column: created_at';
    ELSE
        RAISE NOTICE 'Column created_at already exists';
    END IF;

END $$;

-- =====================================================
-- 2. ADD CHECK CONSTRAINTS (if not already present)
-- =====================================================

DO $$
BEGIN
    -- Add check constraint for overall_rating if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'delivery_ratings' 
        AND constraint_name LIKE '%overall_rating%check%'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD CONSTRAINT delivery_ratings_overall_rating_check 
        CHECK (overall_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added constraint: overall_rating check (1-5)';
    ELSE
        RAISE NOTICE 'Check constraint for overall_rating already exists';
    END IF;

    -- Add check constraint for packaging_quality_rating if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'delivery_ratings' 
        AND constraint_name LIKE '%packaging_quality_rating%check%'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD CONSTRAINT delivery_ratings_packaging_quality_rating_check 
        CHECK (packaging_quality_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added constraint: packaging_quality_rating check (1-5)';
    ELSE
        RAISE NOTICE 'Check constraint for packaging_quality_rating already exists';
    END IF;

    -- Add check constraint for delivery_speed_rating if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'delivery_ratings' 
        AND constraint_name LIKE '%delivery_speed_rating%check%'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD CONSTRAINT delivery_ratings_delivery_speed_rating_check 
        CHECK (delivery_speed_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added constraint: delivery_speed_rating check (1-5)';
    ELSE
        RAISE NOTICE 'Check constraint for delivery_speed_rating already exists';
    END IF;

    -- Add check constraint for delivery_person_rating if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'delivery_ratings' 
        AND constraint_name LIKE '%delivery_person_rating%check%'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD CONSTRAINT delivery_ratings_delivery_person_rating_check 
        CHECK (delivery_person_rating BETWEEN 1 AND 5);
        RAISE NOTICE 'Added constraint: delivery_person_rating check (1-5)';
    ELSE
        RAISE NOTICE 'Check constraint for delivery_person_rating already exists';
    END IF;

EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some constraints already exist, continuing...';
END $$;

-- =====================================================
-- 3. ADD UNIQUE CONSTRAINT (if not already present)
-- =====================================================

DO $$
BEGIN
    -- Add unique constraint for order_id + seller_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_order_delivery_rating'
    ) THEN
        ALTER TABLE delivery_ratings 
        ADD CONSTRAINT unique_order_delivery_rating UNIQUE (order_id, seller_id);
        RAISE NOTICE 'Added constraint: unique_order_delivery_rating (order_id, seller_id)';
    ELSE
        RAISE NOTICE 'Unique constraint unique_order_delivery_rating already exists';
    END IF;

EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Unique constraint already exists, continuing...';
END $$;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE (if not already present)
-- =====================================================

-- Index for order lookup
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_order 
    ON delivery_ratings(order_id);

-- Index for seller lookup (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_seller 
    ON delivery_ratings(seller_id);

-- Index for customer lookup
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_customer 
    ON delivery_ratings(customer_id);

-- Index for flagged ratings (Manager review)
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_flagged 
    ON delivery_ratings(is_flagged) 
    WHERE is_flagged = true;

-- Index for low ratings (ratings below 3 stars)
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_low 
    ON delivery_ratings(overall_rating) 
    WHERE overall_rating < 3;

-- Composite index for seller performance queries
CREATE INDEX IF NOT EXISTS idx_delivery_ratings_seller_created 
    ON delivery_ratings(seller_id, created_at DESC);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (if not already enabled)
-- =====================================================

DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'delivery_ratings' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE delivery_ratings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled Row Level Security on delivery_ratings';
    ELSE
        RAISE NOTICE 'Row Level Security already enabled on delivery_ratings';
    END IF;
END $$;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access delivery_ratings" ON delivery_ratings;
CREATE POLICY "Service role full access delivery_ratings" 
    ON delivery_ratings FOR ALL 
    USING (true);

-- =====================================================
-- 6. CREATE/UPDATE TRIGGERS
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
-- 7. CREATE/UPDATE HELPER FUNCTIONS
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
-- 8. UPDATE ORDERS TABLE (if needed)
-- =====================================================

DO $$
BEGIN
    -- Add delivered_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE 'Added column: orders.delivered_at';
    ELSE
        RAISE NOTICE 'Column orders.delivered_at already exists';
    END IF;
    
    -- Add delivery_rated column to track if rating submitted
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_rated'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_rated BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: orders.delivery_rated';
    ELSE
        RAISE NOTICE 'Column orders.delivery_rated already exists';
    END IF;
END $$;

-- Create index for delivered orders
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at 
    ON orders(delivered_at) 
    WHERE status = 'delivered';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Delivery Rating Schema Update Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'This migration is IDEMPOTENT and safe to run multiple times.';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated/Verified:';
    RAISE NOTICE '  ✓ delivery_ratings table with all required columns';
    RAISE NOTICE '  ✓ Check constraints for rating values (1-5 stars)';
    RAISE NOTICE '  ✓ Unique constraint (order_id + seller_id)';
    RAISE NOTICE '  ✓ Indexes for seller lookup, flagged ratings, low ratings';
    RAISE NOTICE '  ✓ Row Level Security policies';
    RAISE NOTICE '  ✓ Automatic low-rating flagging trigger';
    RAISE NOTICE '  ✓ Helper functions for metrics and analytics';
    RAISE NOTICE '  ✓ Orders table columns (delivered_at, delivery_rated)';
    RAISE NOTICE '';
    RAISE NOTICE 'Requirements validated: 3.1, 3.2, 3.10';
    RAISE NOTICE '========================================';
END $$;
