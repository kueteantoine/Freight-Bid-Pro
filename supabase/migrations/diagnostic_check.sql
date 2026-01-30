-- Diagnostic script to check database structure
-- Run this in Supabase SQL Editor to see current state

-- 1. Check if bids table exists and list all columns
SELECT 
    'BIDS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'bids'
ORDER BY ordinal_position;

-- 2. Check if bid_history table exists and list all columns
SELECT 
    'BID_HISTORY TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'bid_history'
ORDER BY ordinal_position;

-- 3. Check if enums exist
SELECT 
    'ENUMS' as check_type,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('bid_status', 'bid_action_type')
ORDER BY t.typname, e.enumsortorder;

-- 4. Check indexes on bids table
SELECT 
    'BIDS INDEXES' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'bids';

-- 5. Check RLS policies on bids table
SELECT 
    'BIDS RLS POLICIES' as check_type,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'bids';

-- 6. Check triggers on bids table
SELECT 
    'BIDS TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
AND event_object_table = 'bids';

-- 7. Check shipments table for new columns
SELECT 
    'SHIPMENTS AUTO-ACCEPT COLUMNS' as check_type,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'shipments'
AND column_name IN (
    'auction_type',
    'bidding_duration_minutes',
    'bid_expires_at',
    'auto_accept_enabled',
    'auto_accept_price_threshold',
    'auto_accept_min_rating',
    'auto_accept_max_delivery_days'
)
ORDER BY ordinal_position;

-- 8. Check for any carrier_user_id columns (should be renamed to transporter_user_id)
SELECT 
    'CARRIER_USER_ID CHECK' as check_type,
    table_name,
    column_name,
    'NEEDS RENAME' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name LIKE '%carrier%';
