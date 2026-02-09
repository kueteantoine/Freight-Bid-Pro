-- Migration: Fix Bidding Relationships
-- Date: 2026-02-09
-- Purpose: Update foreign key references to public.profiles for PostgREST join resolution

BEGIN;

-- 1. Fix public.bids relationship
ALTER TABLE public.bids
DROP CONSTRAINT IF EXISTS bids_transporter_user_id_fkey;

ALTER TABLE public.bids
ADD CONSTRAINT bids_transporter_user_id_fkey 
FOREIGN KEY (transporter_user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 2. Fix public.user_ad_subscriptions relationship
ALTER TABLE public.user_ad_subscriptions
DROP CONSTRAINT IF EXISTS user_ad_subscriptions_user_id_fkey;

ALTER TABLE public.user_ad_subscriptions
ADD CONSTRAINT user_ad_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

COMMIT;
