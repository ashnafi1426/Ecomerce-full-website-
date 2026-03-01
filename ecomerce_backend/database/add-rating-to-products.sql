-- Add rating and review_count columns to products table

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 1.00 AND rating <= 5.00),
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add index for rating
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);

-- Comments
COMMENT ON COLUMN products.rating IS 'Average rating from 1.00 to 5.00';
COMMENT ON COLUMN products.review_count IS 'Total number of approved reviews';
