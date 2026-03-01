-- =====================================================
-- CLEANUP SEED DATA
-- FastShop E-Commerce Platform
-- =====================================================
-- Run this to remove all sample products and start fresh
-- =====================================================

-- Step 1: Delete inventory records
DELETE FROM inventory 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE sku LIKE 'MBP-%' 
     OR sku LIKE 'DELL-%' 
     OR sku LIKE 'HP-%' 
     OR sku LIKE 'IPH%' 
     OR sku LIKE 'SAM-%' 
     OR sku LIKE 'IPAD-%' 
     OR sku LIKE 'SONY-%' 
     OR sku LIKE 'APP-%'
     OR sku LIKE 'PS5-%'
     OR sku LIKE 'XBOX-%'
     OR sku LIKE 'NSW-%'
     OR sku LIKE 'LG-%'
     OR sku LIKE 'CANON-%'
     OR sku LIKE 'GOPRO-%'
     OR sku LIKE 'KINDLE-%'
     OR sku LIKE 'AW-%'
     OR sku LIKE 'FITBIT-%'
     OR sku LIKE 'LOGI-%'
     OR sku LIKE 'KEY-%'
     OR sku LIKE 'LEVI-%' 
     OR sku LIKE 'NIKE-%' 
     OR sku LIKE 'ADIDAS-%' 
     OR sku LIKE 'RL-%' 
     OR sku LIKE 'RB-%' 
     OR sku LIKE 'TNF-%'
     OR sku LIKE 'ZARA-%'
     OR sku LIKE 'HM-%'
     OR sku LIKE 'LULU-%'
     OR sku LIKE 'CONV-%'
     OR sku LIKE 'TIMB-%'
     OR sku LIKE 'MK-%'
     OR sku LIKE 'COACH-%'
     OR sku LIKE 'FOSSIL-%'
     OR sku LIKE 'CG-%'
     OR sku LIKE 'PATA-%'
     OR sku LIKE 'COL-%'
     OR sku LIKE 'UA-%'
     OR sku LIKE 'KA-%' 
     OR sku LIKE 'NINJA-%' 
     OR sku LIKE 'IP-%' 
     OR sku LIKE 'LODGE-%' 
     OR sku LIKE 'DYSON-%' 
     OR sku LIKE 'IROBOT-%' 
     OR sku LIKE 'PHIL-%' 
     OR sku LIKE 'BROOK-%'
     OR sku LIKE 'KEUR-%'
     OR sku LIKE 'AC-%'
     OR sku LIKE 'PYREX-%'
     OR sku LIKE 'IKEA-%'
     OR sku LIKE 'ZINUS-%'
     OR sku LIKE 'UMBRA-%'
     OR sku LIKE 'RUG-%'
     OR sku LIKE 'STER-%'
     OR sku LIKE 'PARA-%'
     OR sku LIKE 'CASP-%'
     OR sku LIKE 'BB-%'
     OR sku LIKE 'SHARK-%'
     OR sku LIKE 'BOOK-%'
     OR sku LIKE 'BOWFLEX-%'
     OR sku LIKE 'YOGA-%'
     OR sku LIKE 'HYDRO-%'
     OR sku LIKE 'WILSON-%'
     OR sku LIKE 'SCHW-%'
     OR sku LIKE 'SPEED-%'
     OR sku LIKE 'LEGO-%'
     OR sku LIKE 'BARB-%'
     OR sku LIKE 'MONO-%'
     OR sku LIKE 'CATAN-%'
     OR sku LIKE 'OSMO-%'
     OR sku LIKE 'DJI-%'
     OR sku LIKE 'CRAY-%'
     OR sku LIKE 'PD-%'
);

-- Step 2: Delete products
DELETE FROM products 
WHERE sku LIKE 'MBP-%' 
   OR sku LIKE 'DELL-%' 
   OR sku LIKE 'HP-%' 
   OR sku LIKE 'IPH%' 
   OR sku LIKE 'SAM-%' 
   OR sku LIKE 'IPAD-%' 
   OR sku LIKE 'SONY-%' 
   OR sku LIKE 'APP-%'
   OR sku LIKE 'PS5-%'
   OR sku LIKE 'XBOX-%'
   OR sku LIKE 'NSW-%'
   OR sku LIKE 'LG-%'
   OR sku LIKE 'CANON-%'
   OR sku LIKE 'GOPRO-%'
   OR sku LIKE 'KINDLE-%'
   OR sku LIKE 'AW-%'
   OR sku LIKE 'FITBIT-%'
   OR sku LIKE 'LOGI-%'
   OR sku LIKE 'KEY-%'
   OR sku LIKE 'LEVI-%' 
   OR sku LIKE 'NIKE-%' 
   OR sku LIKE 'ADIDAS-%' 
   OR sku LIKE 'RL-%' 
   OR sku LIKE 'RB-%' 
   OR sku LIKE 'TNF-%'
   OR sku LIKE 'ZARA-%'
   OR sku LIKE 'HM-%'
   OR sku LIKE 'LULU-%'
   OR sku LIKE 'CONV-%'
   OR sku LIKE 'TIMB-%'
   OR sku LIKE 'MK-%'
   OR sku LIKE 'COACH-%'
   OR sku LIKE 'FOSSIL-%'
   OR sku LIKE 'CG-%'
   OR sku LIKE 'PATA-%'
   OR sku LIKE 'COL-%'
   OR sku LIKE 'UA-%'
   OR sku LIKE 'KA-%' 
   OR sku LIKE 'NINJA-%' 
   OR sku LIKE 'IP-%' 
   OR sku LIKE 'LODGE-%' 
   OR sku LIKE 'DYSON-%' 
   OR sku LIKE 'IROBOT-%' 
   OR sku LIKE 'PHIL-%' 
   OR sku LIKE 'BROOK-%'
   OR sku LIKE 'KEUR-%'
   OR sku LIKE 'AC-%'
   OR sku LIKE 'PYREX-%'
   OR sku LIKE 'IKEA-%'
   OR sku LIKE 'ZINUS-%'
   OR sku LIKE 'UMBRA-%'
   OR sku LIKE 'RUG-%'
   OR sku LIKE 'STER-%'
   OR sku LIKE 'PARA-%'
   OR sku LIKE 'CASP-%'
   OR sku LIKE 'BB-%'
   OR sku LIKE 'SHARK-%'
   OR sku LIKE 'BOOK-%'
   OR sku LIKE 'BOWFLEX-%'
   OR sku LIKE 'YOGA-%'
   OR sku LIKE 'HYDRO-%'
   OR sku LIKE 'WILSON-%'
   OR sku LIKE 'SCHW-%'
   OR sku LIKE 'SPEED-%'
   OR sku LIKE 'LEGO-%'
   OR sku LIKE 'BARB-%'
   OR sku LIKE 'MONO-%'
   OR sku LIKE 'CATAN-%'
   OR sku LIKE 'OSMO-%'
   OR sku LIKE 'DJI-%'
   OR sku LIKE 'CRAY-%'
   OR sku LIKE 'PD-%';

-- Step 3: Delete sample categories
DELETE FROM categories 
WHERE name IN (
  'Electronics', 
  'Fashion', 
  'Home & Kitchen', 
  'Books', 
  'Sports & Outdoors', 
  'Toys & Games'
);

-- Step 4: Delete sample sellers
DELETE FROM users 
WHERE email IN (
  'seller1@fastshop.com',
  'seller2@fastshop.com',
  'seller3@fastshop.com'
);

-- =====================================================
-- DONE! Database is clean
-- Now you can run seed-sample-products.sql again
-- =====================================================
