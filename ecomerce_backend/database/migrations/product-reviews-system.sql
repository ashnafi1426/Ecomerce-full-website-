-- Product Reviews and Ratings System Migration
-- Creates tables for product reviews, ratings, and helpful votes

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200) NOT NULL,
    review_text TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id) -- One review per user per product
);

-- Create review_helpful_votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id) -- One vote per user per review
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review ON review_helpful_votes(review_id);

-- Function to update helpful_count when vote is added/removed
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE product_reviews 
        SET helpful_count = helpful_count + 1 
        WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE product_reviews 
        SET helpful_count = helpful_count - 1 
        WHERE id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for helpful votes
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_helpful_votes;
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Function to calculate product average rating
CREATE OR REPLACE FUNCTION calculate_product_rating(p_product_id UUID)
RETURNS TABLE (
    average_rating NUMERIC(3,2),
    total_reviews INTEGER,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as average_rating,
        COUNT(*)::INTEGER as total_reviews,
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        ) as rating_distribution
    FROM product_reviews
    WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Add rating columns to products table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'average_rating') THEN
        ALTER TABLE products ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'total_reviews') THEN
        ALTER TABLE products ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'rating_distribution') THEN
        ALTER TABLE products ADD COLUMN rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb;
    END IF;
END $$;

-- Function to update product rating stats
CREATE OR REPLACE FUNCTION update_product_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_product_id UUID;
    v_stats RECORD;
BEGIN
    -- Get product_id from the affected review
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
    ELSE
        v_product_id := NEW.product_id;
    END IF;
    
    -- Calculate new stats
    SELECT * INTO v_stats FROM calculate_product_rating(v_product_id);
    
    -- Update products table
    UPDATE products 
    SET 
        average_rating = v_stats.average_rating,
        total_reviews = v_stats.total_reviews,
        rating_distribution = v_stats.rating_distribution,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_product_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update product stats when review is added/updated/deleted
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating_stats();

-- Insert sample reviews for testing (optional)
-- You can remove this section in production
INSERT INTO product_reviews (product_id, user_id, rating, title, review_text, verified_purchase)
SELECT 
    p.id,
    u.id,
    (FLOOR(RANDOM() * 2) + 4)::INTEGER, -- Random rating 4-5
    'Great product!',
    'This product exceeded my expectations. Highly recommended!',
    true
FROM products p
CROSS JOIN users u
WHERE u.role = 'customer'
LIMIT 10
ON CONFLICT (product_id, user_id) DO NOTHING;

COMMENT ON TABLE product_reviews IS 'Stores customer reviews and ratings for products';
COMMENT ON TABLE review_helpful_votes IS 'Tracks which users found reviews helpful';
COMMENT ON FUNCTION calculate_product_rating IS 'Calculates average rating and distribution for a product';
COMMENT ON FUNCTION update_product_rating_stats IS 'Updates product rating statistics when reviews change';
