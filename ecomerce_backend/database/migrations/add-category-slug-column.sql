-- Add slug column to categories table
-- This allows URL-friendly category identifiers

-- Add slug column
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add unique constraint on slug
ALTER TABLE categories 
ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Update existing categories with slugs based on their names
UPDATE categories SET slug = 'electronics' WHERE name = 'Electronics';
UPDATE categories SET slug = 'fashion' WHERE name = 'Fashion';
UPDATE categories SET slug = 'clothing' WHERE name = 'Clothing';
UPDATE categories SET slug = 'home-kitchen' WHERE name = 'Home & Kitchen';
UPDATE categories SET slug = 'home-garden' WHERE name = 'Home & Garden';
UPDATE categories SET slug = 'books' WHERE name = 'Books';
UPDATE categories SET slug = 'sports-outdoors' WHERE name = 'Sports & Outdoors';
UPDATE categories SET slug = 'toys-games' WHERE name = 'Toys & Games';
UPDATE categories SET slug = 'gold' WHERE name = 'Gold';

-- For any remaining categories without slugs, generate them from name
UPDATE categories 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'))
WHERE slug IS NULL;
