-- =====================================================
-- EXTENDED SEED - MORE PRODUCTS FOR EACH CATEGORY
-- FastShop E-Commerce Platform
-- Date: February 10, 2026
-- =====================================================
-- This file adds MORE products to each category
-- Run this AFTER seed-sample-products.sql
-- =====================================================

-- =====================================================
-- MORE ELECTRONICS PRODUCTS (12 additional)
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('PlayStation 5 Console', 'Next-gen gaming console with ultra-high speed SSD, ray tracing.', 499.99, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 1567, 'PS5-CONSOLE-STD'),
('Xbox Series X', 'Most powerful Xbox ever with 4K gaming at 120fps.', 499.99, 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 1234, 'XBOX-SX-1TB'),
('Nintendo Switch OLED', 'Handheld gaming console with vibrant 7" OLED screen.', 349.99, 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 987, 'NSW-OLED-64GB'),
('LG 27" 4K UHD Monitor', 'IPS display with HDR10, USB-C, perfect for productivity.', 399.99, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 445, 'LG-27UK-4K-IPS'),
('Samsung Odyssey G7 Gaming', '32" curved gaming monitor, 240Hz, 1ms response time.', 699.99, 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 567, 'SAM-ODY-G7-32'),
('Canon EOS R6 Mark II', 'Full-frame mirrorless camera with 24.2MP sensor, 4K 60fps video.', 2499.99, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 167, 'CANON-R6-MK2'),
('GoPro HERO 11 Black', 'Waterproof action camera with 5.3K video, HyperSmooth 5.0.', 399.99, 'https://images.unsplash.com/photo-1606941369e88-8dfdd5e0c9e5?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 892, 'GOPRO-H11-BLK'),
('Amazon Kindle Paperwhite', 'Waterproof e-reader with 6.8" display, adjustable warm light.', 139.99, 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 3456, 'KINDLE-PW-8GB'),
('Apple Watch Series 9', 'Advanced health and fitness tracking, always-on Retina display.', 399.99, 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 2341, 'AW-S9-45MM'),
('Fitbit Charge 6', 'Advanced fitness tracker with built-in GPS, heart rate monitoring.', 159.99, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 1567, 'FITBIT-C6'),
('Logitech MX Master 3S', 'Advanced wireless mouse with ultra-fast scrolling, 8K DPI.', 99.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 2876, 'LOGI-MX3S'),
('Keychron K8 Mechanical Keyboard', 'Wireless mechanical keyboard with hot-swappable switches.', 89.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 1234, 'KEY-K8-RGB');

INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 100, 5, 10 FROM products WHERE sku LIKE 'PS5-%' OR sku LIKE 'XBOX-%' OR sku LIKE 'NSW-%' OR sku LIKE 'LG-%' OR sku LIKE 'SAM-ODY%' OR sku LIKE 'CANON-%' OR sku LIKE 'GOPRO-%' OR sku LIKE 'KINDLE-%' OR sku LIKE 'AW-%' OR sku LIKE 'FITBIT-%' OR sku LIKE 'LOGI-%' OR sku LIKE 'KEY-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- MORE FASHION PRODUCTS (12 additional)
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('Zara Floral Summer Dress', 'Elegant floral print dress, perfect for summer occasions.', 79.99, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.6, 678, 'ZARA-FLOR-DRESS'),
('H&M Skinny Fit Jeans', 'Stretchy denim jeans with high waist, comfortable fit.', 49.99, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.4, 892, 'HM-SKIN-JEAN-BLU'),
('Lululemon Yoga Pants', 'High-rise yoga pants with four-way stretch, moisture-wicking.', 98.99, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.9, 1567, 'LULU-YOGA-BLK'),
('Converse Chuck Taylor All Star', 'Classic canvas sneakers, iconic design, comfortable fit.', 59.99, 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.7, 3456, 'CONV-CT-WHT-HI'),
('Timberland 6-Inch Boots', 'Waterproof leather boots, durable construction, classic style.', 199.99, 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.8, 987, 'TIMB-6IN-WHEAT'),
('Michael Kors Leather Watch', 'Elegant chronograph watch with stainless steel case.', 249.99, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.7, 567, 'MK-CHRONO-ROSE'),
('Coach Leather Handbag', 'Premium leather handbag with signature hardware, multiple compartments.', 349.99, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.8, 445, 'COACH-LEATH-BRN'),
('Fossil Leather Belt', 'Genuine leather belt with reversible buckle, classic design.', 49.99, 'https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.6, 678, 'FOSSIL-BELT-BLK'),
('Canada Goose Parka', 'Premium down-filled parka for extreme cold weather.', 899.99, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.8, 334, 'CG-PARKA-NAVY'),
('Patagonia Fleece Jacket', 'Lightweight fleece jacket, eco-friendly materials.', 149.99, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.7, 567, 'PATA-FLEECE-GRY'),
('Columbia Winter Gloves', 'Waterproof insulated gloves with touchscreen compatibility.', 39.99, 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.5, 445, 'COL-GLOVE-BLK'),
('Under Armour Sports Bra', 'High-impact sports bra with moisture-wicking technology.', 44.99, 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.6, 892, 'UA-BRA-BLK');

INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 150, 8, 10 FROM products WHERE sku LIKE 'ZARA-%' OR sku LIKE 'HM-%' OR sku LIKE 'LULU-%' OR sku LIKE 'CONV-%' OR sku LIKE 'TIMB-%' OR sku LIKE 'MK-%' OR sku LIKE 'COACH-%' OR sku LIKE 'FOSSIL-%' OR sku LIKE 'CG-%' OR sku LIKE 'PATA-%' OR sku LIKE 'COL-GLOVE%' OR sku LIKE 'UA-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- MORE HOME & KITCHEN PRODUCTS (12 additional)
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('Keurig K-Elite Coffee Maker', 'Single-serve coffee maker with iced coffee capability.', 169.99, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.6, 1234, 'KEUR-ELITE-BLK'),
('All-Clad Stainless Steel Set', '10-piece cookware set, tri-ply construction, dishwasher safe.', 599.99, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.9, 567, 'AC-SS-10PC'),
('Pyrex Glass Baking Dish Set', '3-piece glass baking dish set, microwave and oven safe.', 29.99, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.7, 892, 'PYREX-BAKE-3PC'),
('IKEA POÄNG Armchair', 'Comfortable bentwood armchair with cushion, modern design.', 149.99, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.6, 1567, 'IKEA-POANG-BRN'),
('Zinus Memory Foam Mattress', 'Queen size memory foam mattress, pressure relief, CertiPUR-US.', 299.99, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.5, 2876, 'ZINUS-MF-QUEEN'),
('Umbra Photo Frame Set', '7-piece gallery wall frame set, various sizes, black finish.', 49.99, 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.6, 678, 'UMBRA-FRAME-7PC'),
('Ruggable Washable Rug', '5x7 machine washable area rug, non-slip pad included.', 249.99, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.7, 892, 'RUG-WASH-5X7'),
('Sterilite Storage Bins', '6-pack clear storage containers with lids, stackable.', 39.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.5, 1234, 'STER-BIN-6PK'),
('Parachute Down Comforter', 'All-season down comforter, hypoallergenic, machine washable.', 269.99, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.7, 567, 'PARA-DOWN-QUEEN'),
('Casper Pillow Set', '2-pack memory foam pillows with breathable cover.', 129.99, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.6, 892, 'CASP-PILL-2PK'),
('Boll & Branch Bath Towels', '6-piece organic cotton towel set, ultra-absorbent.', 179.99, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.9, 445, 'BB-TOWEL-6PC'),
('Shark Navigator Vacuum', 'Upright vacuum with lift-away technology, HEPA filter.', 199.99, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.7, 1876, 'SHARK-NAV-LIFT');

INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 80, 3, 10 FROM products WHERE sku LIKE 'KEUR-%' OR sku LIKE 'AC-%' OR sku LIKE 'PYREX-%' OR sku LIKE 'IKEA-%' OR sku LIKE 'ZINUS-%' OR sku LIKE 'UMBRA-%' OR sku LIKE 'RUG-%' OR sku LIKE 'STER-%' OR sku LIKE 'PARA-%' OR sku LIKE 'CASP-%' OR sku LIKE 'BB-%' OR sku LIKE 'SHARK-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Additional Products: 36 more products
-- Electronics: +12 (total 20)
-- Fashion: +12 (total 20)
-- Home & Kitchen: +12 (total 20)
--
-- GRAND TOTAL: 84 products across 6 categories
-- Run this AFTER seed-sample-products.sql
-- =====================================================
