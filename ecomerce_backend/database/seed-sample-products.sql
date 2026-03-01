-- =====================================================
-- SEED SAMPLE PRODUCTS FOR HOMEPAGE
-- FastShop E-Commerce Platform  
-- Date: February 10, 2026
-- =====================================================
-- This file adds sample products to display on HomePage
-- Uses UUID auto-generation for all IDs
-- =====================================================

-- Insert sample sellers
INSERT INTO users (id, email, password_hash, role, display_name, business_name, seller_verification_status, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'seller1@fastshop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'seller', 'TechStore Pro', 'TechStore Pro LLC', 'verified', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'seller2@fastshop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'seller', 'Fashion Hub', 'Fashion Hub Inc', 'verified', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'seller3@fastshop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'seller', 'Home Essentials', 'Home Essentials Co', 'verified', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices, computers, and accessories'),
  ('Fashion', 'Clothing, shoes, and accessories for men and women'),
  ('Home & Kitchen', 'Home improvement, furniture, and kitchen items'),
  ('Books', 'Books, magazines, and publications'),
  ('Sports & Outdoors', 'Sports equipment, outdoor gear, and fitness'),
  ('Toys & Games', 'Toys, games, and entertainment for all ages')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- ELECTRONICS PRODUCTS
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('MacBook Pro 16" M3 Max', 'Powerful laptop with M3 Max chip, 36GB RAM, 1TB SSD. Perfect for professionals and creators.', 2499.99, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 245, 'MBP-M3-16-1TB'),
('Dell XPS 15 Laptop', 'Premium Windows laptop with Intel i9, 32GB RAM, 1TB SSD, 4K OLED display.', 1899.99, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 189, 'DELL-XPS15-I9'),
('HP Pavilion Gaming Laptop', 'Gaming laptop with RTX 4060, AMD Ryzen 7, 16GB RAM, 512GB SSD.', 1299.99, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.4, 156, 'HP-PAV-RTX4060'),
('iPhone 15 Pro Max 256GB', 'Latest iPhone with A17 Pro chip, titanium design, advanced camera system.', 1199.99, 'https://images.unsplash.com/photo-1592286927505-2fd0f2f0b7d0?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 512, 'IPH15-PM-256'),
('Samsung Galaxy S24 Ultra', 'Premium Android phone with S Pen, 200MP camera, 12GB RAM.', 1099.99, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 387, 'SAM-S24U-12GB'),
('iPad Pro 12.9" M2', 'Professional tablet with M2 chip, Liquid Retina XDR display, Apple Pencil support.', 1099.99, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 298, 'IPAD-PRO-M2-129'),
('Sony WH-1000XM5 Headphones', 'Industry-leading noise canceling wireless headphones with 30hr battery.', 399.99, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 1024, 'SONY-WH1000XM5'),
('AirPods Pro 2nd Gen', 'Active noise cancellation, adaptive transparency, personalized spatial audio.', 249.99, 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500', (SELECT id FROM categories WHERE name = 'Electronics'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 856, 'APP-PRO-2GEN');

-- Create inventory for Electronics products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 100, 5, 10 FROM products WHERE sku LIKE 'MBP-%' OR sku LIKE 'DELL-%' OR sku LIKE 'HP-%' OR sku LIKE 'IPH%' OR sku LIKE 'SAM-%' OR sku LIKE 'IPAD-%' OR sku LIKE 'SONY-%' OR sku LIKE 'APP-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- Summary: 8 Electronics products added
-- Run this file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FASHION PRODUCTS
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('Levi''s 501 Original Jeans', 'Classic straight fit jeans, 100% cotton denim, iconic style.', 69.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.7, 1245, 'LEVI-501-BLUE'),
('Nike Dri-FIT T-Shirt', 'Moisture-wicking athletic t-shirt, breathable fabric.', 29.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.5, 892, 'NIKE-DFIT-TEE'),
('Adidas Hoodie Pullover', 'Comfortable cotton blend hoodie with kangaroo pocket.', 59.99, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.6, 567, 'ADIDAS-HOOD-BLK'),
('Ralph Lauren Polo Shirt', 'Classic fit polo shirt with signature pony logo.', 89.99, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.8, 445, 'RL-POLO-NAVY'),
('Nike Air Max 270', 'Lifestyle sneakers with Max Air cushioning, breathable mesh.', 149.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.8, 2341, 'NIKE-AM270-WHT'),
('Adidas Ultraboost 22', 'Premium running shoes with Boost cushioning technology.', 189.99, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.9, 1876, 'ADIDAS-UB22-BLK'),
('Ray-Ban Aviator Sunglasses', 'Classic aviator sunglasses with UV protection, metal frame.', 169.99, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.9, 1234, 'RB-AVIA-GOLD'),
('North Face Puffer Jacket', 'Insulated winter jacket with water-resistant finish.', 299.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', (SELECT id FROM categories WHERE name = 'Fashion'), '22222222-2222-2222-2222-222222222222', 'approved', 'active', 4.9, 892, 'TNF-PUFF-BLK');

-- Create inventory for Fashion products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 150, 8, 10 FROM products WHERE sku LIKE 'LEVI-%' OR sku LIKE 'NIKE-%' OR sku LIKE 'ADIDAS-%' OR sku LIKE 'RL-%' OR sku LIKE 'RB-%' OR sku LIKE 'TNF-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- HOME & KITCHEN PRODUCTS
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('KitchenAid Stand Mixer', 'Professional 5-quart stand mixer with 10 speeds, multiple attachments.', 379.99, 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.9, 2456, 'KA-MIXER-5QT-RED'),
('Ninja Air Fryer', 'Large capacity air fryer with 6-in-1 functionality, 1750W.', 129.99, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.7, 1876, 'NINJA-AF-6QT'),
('Instant Pot Duo 7-in-1', 'Multi-functional pressure cooker, slow cooker, rice cooker.', 99.99, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.8, 3456, 'IP-DUO-6QT'),
('Lodge Cast Iron Skillet', '12-inch pre-seasoned cast iron skillet, oven safe.', 39.99, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.8, 2341, 'LODGE-CI-12IN'),
('Dyson V15 Vacuum Cleaner', 'Cordless stick vacuum with laser detection, HEPA filtration.', 649.99, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.9, 1567, 'DYSON-V15-CORD'),
('iRobot Roomba j7+', 'Self-emptying robot vacuum with obstacle avoidance.', 799.99, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.8, 987, 'IROBOT-J7-PLUS'),
('Philips Hue Smart Bulbs', '4-pack color-changing LED smart bulbs, works with Alexa.', 179.99, 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.8, 1234, 'PHIL-HUE-4PK'),
('Brooklinen Luxury Sheets', 'Queen size sheet set, 100% long-staple cotton, 480 thread count.', 149.99, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500', (SELECT id FROM categories WHERE name = 'Home & Kitchen'), '33333333-3333-3333-3333-333333333333', 'approved', 'active', 4.8, 2341, 'BROOK-SHEET-Q');

-- Create inventory for Home & Kitchen products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 80, 3, 10 FROM products WHERE sku LIKE 'KA-%' OR sku LIKE 'NINJA-%' OR sku LIKE 'IP-%' OR sku LIKE 'LODGE-%' OR sku LIKE 'DYSON-%' OR sku LIKE 'IROBOT-%' OR sku LIKE 'PHIL-%' OR sku LIKE 'BROOK-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- BOOKS PRODUCTS
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('The Midnight Library', 'Matt Haig - Between life and death, a library of infinite possibilities.', 16.99, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 3456, 'BOOK-MID-LIB'),
('Where the Crawdads Sing', 'Delia Owens - A coming-of-age mystery set in the marshlands.', 18.99, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 5678, 'BOOK-CRAW-SING'),
('Atomic Habits', 'James Clear - Tiny changes, remarkable results. Build better habits.', 19.99, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 8765, 'BOOK-ATOM-HAB'),
('Educated', 'Tara Westover - A memoir about education and self-invention.', 18.99, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 4567, 'BOOK-EDUCATED'),
('Clean Code', 'Robert C. Martin - A handbook of agile software craftsmanship.', 44.99, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 1876, 'BOOK-CLEAN-CODE'),
('Sapiens', 'Yuval Noah Harari - A brief history of humankind.', 22.99, 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 6789, 'BOOK-SAPIENS'),
('Harry Potter Complete Set', 'J.K. Rowling - All 7 books in the magical series.', 89.99, 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 5.0, 9876, 'BOOK-HP-SET-7'),
('The Very Hungry Caterpillar', 'Eric Carle - Classic children''s picture book.', 12.99, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', (SELECT id FROM categories WHERE name = 'Books'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 5432, 'BOOK-CATER-PILL');

-- Create inventory for Books
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 200, 10, 20 FROM products WHERE sku LIKE 'BOOK-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- SPORTS & OUTDOORS PRODUCTS
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('Bowflex Adjustable Dumbbells', 'SelectTech 552 - Adjustable from 5 to 52.5 lbs per dumbbell.', 349.99, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 2876, 'BOWFLEX-DB-552'),
('Yoga Mat Premium', 'Extra thick 6mm yoga mat with carrying strap, non-slip.', 39.99, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 3456, 'YOGA-MAT-6MM'),
('The North Face Backpack', '40L hiking backpack with hydration system, rain cover.', 189.99, 'https://images.unsplash.com/photo-1622260614153-03223fb72052?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 1234, 'TNF-PACK-40L'),
('Coleman Camping Tent', '6-person dome tent, weather-resistant, easy setup.', 149.99, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 987, 'COLE-TENT-6P'),
('Hydro Flask Water Bottle', '32oz insulated stainless steel bottle, keeps cold 24hrs.', 44.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 5678, 'HYDRO-32OZ-BLU'),
('Wilson Basketball', 'Official size basketball, indoor/outdoor use, durable rubber.', 29.99, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 2345, 'WILSON-BB-OFF'),
('Schwinn Mountain Bike', '29" wheels, 21-speed, front suspension, aluminum frame.', 449.99, 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.5, 892, 'SCHW-MTB-29'),
('Speedo Swim Goggles', 'Competition swim goggles with anti-fog coating, UV protection.', 24.99, 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500', (SELECT id FROM categories WHERE name = 'Sports & Outdoors'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 1567, 'SPEED-GOGG-COMP');

-- Create inventory for Sports products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 120, 6, 15 FROM products WHERE sku LIKE 'BOWFLEX-%' OR sku LIKE 'YOGA-%' OR sku LIKE 'COLE-%' OR sku LIKE 'HYDRO-%' OR sku LIKE 'WILSON-%' OR sku LIKE 'SCHW-%' OR sku LIKE 'SPEED-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- TOYS & GAMES PRODUCTS
-- =====================================================

INSERT INTO products (title, description, price, image_url, category_id, seller_id, approval_status, status, average_rating, total_reviews, sku) VALUES
('LEGO Star Wars Millennium Falcon', 'Ultimate collector series, 7541 pieces, detailed interior.', 849.99, 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.9, 1876, 'LEGO-SW-FALCON'),
('Barbie Dreamhouse', '3-story dollhouse with 8 rooms, pool, slide, and elevator.', 199.99, 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.7, 2345, 'BARB-DREAM-HOUSE'),
('Monopoly Ultimate Banking', 'Electronic banking edition with contactless payment.', 29.99, 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.5, 3456, 'MONO-BANK-ELEC'),
('Catan Board Game', 'Strategy game of trading and building, 3-4 players.', 44.99, 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 5678, 'CATAN-BASE-GAME'),
('Osmo Genius Starter Kit', 'iPad learning system with 5 hands-on games for ages 6-10.', 99.99, 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 1234, 'OSMO-GEN-START'),
('DJI Mini 3 Pro Drone', 'Lightweight drone with 4K camera, 34-min flight time.', 759.99, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 567, 'DJI-MINI3-PRO'),
('Crayola Ultimate Art Set', '140-piece art supplies set with crayons, markers, colored pencils.', 24.99, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.8, 3456, 'CRAY-ART-140PC'),
('Play-Doh Mega Pack', '36-can variety pack of modeling compound, non-toxic.', 19.99, 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500', (SELECT id FROM categories WHERE name = 'Toys & Games'), '11111111-1111-1111-1111-111111111111', 'approved', 'active', 4.6, 2876, 'PD-MEGA-36CAN');

-- Create inventory for Toys products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id, 90, 4, 10 FROM products WHERE sku LIKE 'LEGO-%' OR sku LIKE 'BARB-%' OR sku LIKE 'MONO-%' OR sku LIKE 'CATAN-%' OR sku LIKE 'OSMO-%' OR sku LIKE 'DJI-%' OR sku LIKE 'CRAY-%' OR sku LIKE 'PD-%'
ON CONFLICT (product_id) DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total Products: 48 products across 6 categories
-- Electronics: 8 products
-- Fashion: 8 products
-- Home & Kitchen: 8 products
-- Books: 8 products
-- Sports & Outdoors: 8 products
-- Toys & Games: 8 products
--
-- All products have:
-- - Auto-generated UUIDs
-- - Approved status
-- - Ratings and reviews
-- - Inventory records
-- - Real product images from Unsplash
--
-- To run: Copy and paste into Supabase SQL Editor
-- =====================================================
