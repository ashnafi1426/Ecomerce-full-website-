-- =====================================================
-- STEP 1: CREATE STORES TABLE
-- Test this first before proceeding
-- =====================================================

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name VARCHAR(255) NOT NULL,
  store_slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  business_email VARCHAR(255),
  business_phone VARCHAR(50),
  business_address TEXT,
  tax_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  verification_status VARCHAR(50) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seller_id)
);

CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(store_slug);

-- Verify
SELECT 'stores table created successfully!' AS status;
SELECT COUNT(*) as stores_count FROM stores;
