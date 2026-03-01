-- =====================================================
-- PDP ENHANCEMENTS - Amazon-Level Features
-- Migration Date: February 10, 2026
-- =====================================================

-- 1. ADD PRODUCT BADGES TABLE
CREATE TABLE IF NOT EXISTS product_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('best_seller', 'amazons_choice', 'deal', 'limited_time', 'new_arrival', 'top_rated')),
  badge_text VARCHAR(100),
  priority INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(product_id, badge_type)
);

CREATE INDEX idx_product_badges_product ON product_badges(product_id);
CREATE INDEX idx_product_badges_type ON product_badges(badge_type);
CREATE INDEX idx_product_badges_valid ON product_badges(valid_from, valid_until);

-- 2. ADD INVENTORY RESERVATIONS (Soft Locks)
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reserved_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'released', 'converted')),
  cart_id UUID,
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX idx_inventory_reservations_user ON inventory_reservations(user_id);
CREATE INDEX idx_inventory_reservations_session ON inventory_reservations(session_id);
CREATE INDEX idx_inventory_reservations_expires ON inventory_reservations(expires_at);
CREATE INDEX idx_inventory_reservations_status ON inventory_reservations(status);

-- 3. ADD PRODUCT IMAGES TABLE (Multiple Images)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_type VARCHAR(20) DEFAULT 'product' CHECK (image_type IN ('product', 'lifestyle', 'detail', 'size_chart', 'video_thumbnail')),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX idx_product_images_order ON product_images(product_id, display_order);

-- 4. ADD PRODUCT VIDEOS TABLE
CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  video_type VARCHAR(20) DEFAULT 'demo' CHECK (video_type IN ('demo', 'unboxing', 'review', 'tutorial')),
  duration_seconds INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_videos_product ON product_videos(product_id);

-- 5. ADD DELIVERY ZONES TABLE
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_name VARCHAR(100) NOT NULL,
  postal_code_prefix VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'US',
  standard_delivery_days INTEGER DEFAULT 5,
  express_delivery_days INTEGER DEFAULT 2,
  same_day_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delivery_zones_postal ON delivery_zones(postal_code_prefix);
CREATE INDEX idx_delivery_zones_city ON delivery_zones(city, state);

-- 6. ADD PRODUCT QUANTITY LIMITS
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_quantity_per_order INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity_per_order INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- 7. ADD PRICE HISTORY (Prevent Tampering)
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2),
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,
  changed_by UUID REFERENCES users(id),
  change_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON product_price_history(product_id);
CREATE INDEX idx_price_history_effective ON product_price_history(product_id, effective_from, effective_until);

-- 8. ADD FREQUENTLY BOUGHT TOGETHER
CREATE TABLE IF NOT EXISTS product_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  associated_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  association_type VARCHAR(50) DEFAULT 'frequently_bought' CHECK (association_type IN ('frequently_bought', 'similar', 'alternative', 'accessory')),
  association_score DECIMAL(5, 4) DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, associated_product_id, association_type)
);

CREATE INDEX idx_product_associations_product ON product_associations(product_id);
CREATE INDEX idx_product_associations_type ON product_associations(product_id, association_type);
CREATE INDEX idx_product_associations_score ON product_associations(association_score DESC);

-- 9. ADD PRODUCT Q&A
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answer_text TEXT NOT NULL,
  is_seller_answer BOOLEAN DEFAULT FALSE,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_questions_product ON product_questions(product_id);
CREATE INDEX idx_product_questions_status ON product_questions(status);
CREATE INDEX idx_product_answers_question ON product_answers(question_id);

-- 10. ENHANCE REVIEWS TABLE
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_images JSONB;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_videos JSONB;

-- 11. ADD CART ITEM METADATA
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS price_at_add DECIMAL(10, 2);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES inventory_reservations(id);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS added_at TIMESTAMP DEFAULT NOW();

-- 12. ADD PRODUCT VIEW TRACKING
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT NOW(),
  referrer VARCHAR(500),
  device_type VARCHAR(50)
);

CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_user ON product_views(user_id);
CREATE INDEX idx_product_views_session ON product_views(session_id);
CREATE INDEX idx_product_views_date ON product_views(viewed_at);

-- 13. CREATE WISHLIST TABLE (if not exists) AND ADD ENHANCEMENTS
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

-- Add enhancement columns
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS price_at_add DECIMAL(10, 2);
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS price_drop_alert BOOLEAN DEFAULT FALSE;
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS back_in_stock_alert BOOLEAN DEFAULT FALSE;

-- 14. CREATE FUNCTION TO AUTO-EXPIRE RESERVATIONS
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS void AS $$
BEGIN
  UPDATE inventory_reservations
  SET status = 'released'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 15. CREATE FUNCTION TO GET AVAILABLE INVENTORY
CREATE OR REPLACE FUNCTION get_available_inventory(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_stock INTEGER;
  reserved_stock INTEGER;
BEGIN
  -- Get total stock (column is 'quantity' not 'stock_quantity')
  SELECT quantity INTO total_stock
  FROM inventory
  WHERE product_id = p_product_id;
  
  -- Get active reservations
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_stock
  FROM inventory_reservations
  WHERE product_id = p_product_id
    AND status = 'active'
    AND expires_at > NOW();
  
  RETURN GREATEST(total_stock - reserved_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- 16. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- 17. ADD CONSTRAINTS (constraints already exist in base schema, skip if they exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_stock_non_negative') THEN
    ALTER TABLE inventory ADD CONSTRAINT check_stock_non_negative CHECK (quantity >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_reserved_non_negative') THEN
    ALTER TABLE inventory ADD CONSTRAINT check_reserved_non_negative CHECK (reserved_quantity >= 0);
  END IF;
END $$;

-- 18. CREATE VIEW FOR PRODUCT DETAILS
CREATE OR REPLACE VIEW product_details_view AS
SELECT 
  p.*,
  i.quantity as stock_quantity,
  i.reserved_quantity,
  get_available_inventory(p.id) as available_quantity,
  CASE 
    WHEN get_available_inventory(p.id) = 0 THEN 'OUT_OF_STOCK'
    WHEN get_available_inventory(p.id) <= p.low_stock_threshold THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status,
  u.display_name as seller_name,
  u.average_rating as seller_rating,
  u.total_reviews as seller_review_count,
  c.name as category_name,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'type', badge_type,
      'text', badge_text,
      'priority', priority
    ) ORDER BY priority DESC)
    FROM product_badges pb
    WHERE pb.product_id = p.id
      AND pb.valid_from <= NOW()
      AND (pb.valid_until IS NULL OR pb.valid_until > NOW())
    ), '[]'::json
  ) as badges
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN users u ON p.seller_id = u.id
LEFT JOIN categories c ON p.category_id = c.id;

COMMENT ON VIEW product_details_view IS 'Comprehensive product view with inventory, seller, and badge information';
