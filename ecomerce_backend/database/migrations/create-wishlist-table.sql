-- ==========================================
-- WISHLIST SYSTEM MIGRATION
-- ==========================================

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique user-product combination
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wishlist_updated_at
    BEFORE UPDATE ON wishlist
    FOR EACH ROW
    EXECUTE FUNCTION update_wishlist_updated_at();

-- Insert some sample wishlist data for testing
DO $$
DECLARE
    customer_id UUID;
    product_ids UUID[];
BEGIN
    -- Get a customer user ID
    SELECT id INTO customer_id FROM users WHERE role = 'customer' LIMIT 1;
    
    -- Get some product IDs
    SELECT ARRAY(SELECT id FROM products WHERE status = 'active' LIMIT 5) INTO product_ids;
    
    -- Insert sample wishlist items if we have data
    IF customer_id IS NOT NULL AND array_length(product_ids, 1) > 0 THEN
        INSERT INTO wishlist (user_id, product_id) VALUES
        (customer_id, product_ids[1]),
        (customer_id, product_ids[2]),
        (customer_id, product_ids[3])
        ON CONFLICT (user_id, product_id) DO NOTHING;
    END IF;
END $$;

COMMIT;