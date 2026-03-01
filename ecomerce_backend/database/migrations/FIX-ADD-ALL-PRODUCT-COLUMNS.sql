-- =====================================================
-- FIX: ADD ALL MISSING PRODUCT COLUMNS
-- Run this BEFORE step-08
-- This will add all 6 approval columns to products table
-- =====================================================

-- First, check what columns already exist
DO $$
DECLARE
    has_store_id BOOLEAN;
    has_approval_status BOOLEAN;
    has_approved_by BOOLEAN;
    has_approved_at BOOLEAN;
    has_rejection_reason BOOLEAN;
    has_submitted_at BOOLEAN;
BEGIN
    -- Check each column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'store_id'
    ) INTO has_store_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'approval_status'
    ) INTO has_approval_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'approved_by'
    ) INTO has_approved_by;
    
    SEL