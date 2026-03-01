-- Add store_id column to products table
-- This is the ONLY thing this migration does

ALTER TABLE products ADD COLUMN store_id UUID;
