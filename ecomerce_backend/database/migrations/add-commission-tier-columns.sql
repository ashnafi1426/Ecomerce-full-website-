-- Add missing columns to commission_settings table
-- This migration adds seller_tier_rates and tier_thresholds columns

-- Add seller_tier_rates column (JSONB)
ALTER TABLE commission_settings 
ADD COLUMN IF NOT EXISTS seller_tier_rates JSONB DEFAULT '{
  "bronze": 15.00,
  "silver": 12.00,
  "gold": 10.00,
  "platinum": 8.00
}'::jsonb;

-- Add tier_thresholds column (JSONB)
ALTER TABLE commission_settings 
ADD COLUMN IF NOT EXISTS tier_thresholds JSONB DEFAULT '{
  "bronze": {"min": 0, "max": 10000},
  "silver": {"min": 10000, "max": 50000},
  "gold": {"min": 50000, "max": 100000},
  "platinum": {"min": 100000, "max": null}
}'::jsonb;

-- Update existing records to have the default values
UPDATE commission_settings 
SET 
  seller_tier_rates = '{
    "bronze": 15.00,
    "silver": 12.00,
    "gold": 10.00,
    "platinum": 8.00
  }'::jsonb,
  tier_thresholds = '{
    "bronze": {"min": 0, "max": 10000},
    "silver": {"min": 10000, "max": 50000},
    "gold": {"min": 50000, "max": 100000},
    "platinum": {"min": 100000, "max": null}
  }'::jsonb
WHERE seller_tier_rates IS NULL OR tier_thresholds IS NULL;

-- Add comments to document the columns
COMMENT ON COLUMN commission_settings.seller_tier_rates IS 'Commission rates by seller tier (bronze, silver, gold, platinum)';
COMMENT ON COLUMN commission_settings.tier_thresholds IS 'Sales thresholds for each seller tier';