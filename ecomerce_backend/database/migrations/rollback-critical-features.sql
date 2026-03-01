
-- =====================================================
-- ROLLBACK SCRIPT FOR CRITICAL FEATURES MIGRATIONS
-- =====================================================
-- WARNING: This will delete all data in these tables!
-- Create a backup before running this script.
-- =====================================================

-- Drop tables in reverse order (to handle foreign key constraints)

-- 5. Enhanced Refund Process
DROP TABLE IF EXISTS refund_images CASCADE;
DROP TABLE IF EXISTS refund_details CASCADE;

-- 4. Replacement Process
DROP TABLE IF EXISTS replacement_shipments CASCADE;
DROP TABLE IF EXISTS replacement_requests CASCADE;

-- 3. Delivery Rating System
DROP TABLE IF EXISTS delivery_ratings CASCADE;

-- 2. Discount and Promotion System
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS promotional_pricing CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- 1. Product Variants System
DROP TABLE IF EXISTS variant_inventory CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_variant_price(UUID);
DROP FUNCTION IF EXISTS check_variant_availability(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_variant_available_quantity(UUID);
DROP FUNCTION IF EXISTS validate_coupon_eligibility(VARCHAR, UUID, DECIMAL, UUID[]);
DROP FUNCTION IF EXISTS get_active_promotional_price(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_order_discounts(DECIMAL, DECIMAL, VARCHAR, UUID);
DROP FUNCTION IF EXISTS get_seller_delivery_metrics(UUID);
DROP FUNCTION IF EXISTS get_seller_rating_distribution(UUID);
DROP FUNCTION IF EXISTS can_submit_delivery_rating(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_delivery_rating_analytics(TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS can_create_replacement_request(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_replacement_analytics(TIMESTAMP, TIMESTAMP, UUID);
DROP FUNCTION IF EXISTS get_product_replacement_rate(UUID);
DROP FUNCTION IF EXISTS get_seller_replacement_metrics(UUID);
DROP FUNCTION IF EXISTS reserve_replacement_inventory(UUID);
DROP FUNCTION IF EXISTS can_create_refund_request(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS calculate_refund_commission_adjustment(UUID, DECIMAL);
DROP FUNCTION IF EXISTS get_cumulative_refunds(UUID);
DROP FUNCTION IF EXISTS get_refund_analytics(TIMESTAMP, TIMESTAMP, UUID);
DROP FUNCTION IF EXISTS get_seller_refund_rate(UUID);
DROP FUNCTION IF EXISTS get_product_refund_rate(UUID);
DROP FUNCTION IF EXISTS get_seller_refund_metrics(UUID);
DROP FUNCTION IF EXISTS check_refund_processing_time_alerts();

-- Remove columns added to existing tables
ALTER TABLE cart_items DROP COLUMN IF EXISTS variant_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS coupon_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS coupon_code CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS discount_amount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS promotional_discount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivered_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_rated CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS refund_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS total_refunded CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS is_returnable CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS replacement_count CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS refund_count CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS is_flagged_high_refund CASCADE;
ALTER TABLE inventory DROP COLUMN IF EXISTS reserved_quantity CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================
