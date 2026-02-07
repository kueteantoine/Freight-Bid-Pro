-- Test Script for Advertisement & Content Management System
-- Run this after applying all migrations to verify database setup

-- ============================================
-- 1. TEST ADMIN ROLES & PERMISSIONS
-- ============================================

-- Test: Verify all admin roles exist
SELECT 'Admin Roles Test' as test_name,
       COUNT(*) as role_count,
       CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END as status
FROM admin_roles;

-- Test: Verify all permissions exist
SELECT 'Admin Permissions Test' as test_name,
       COUNT(*) as permission_count,
       CASE WHEN COUNT(*) >= 30 THEN 'PASS' ELSE 'FAIL' END as status
FROM admin_permissions;

-- Test: Check permission assignment
SELECT 'Permission Assignment Test' as test_name,
       COUNT(DISTINCT role_id) as roles_with_permissions,
       CASE WHEN COUNT(DISTINCT role_id) = 5 THEN 'PASS' ELSE 'FAIL' END as status
FROM admin_role_permissions;

-- ============================================
-- 2. TEST ADVERTISEMENT ENHANCEMENTS
-- ============================================

-- Test: Verify advertisement table structure
SELECT 'Advertisement Table Test' as test_name,
       COUNT(*) as column_count,
       CASE WHEN COUNT(*) >= 20 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'advertisements';

-- Test: Verify ad placement zones enum
SELECT 'Ad Placement Zones Test' as test_name,
       COUNT(*) as zone_count,
       CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_enum
WHERE enumtypid = 'ad_placement_zone'::regtype;

-- Test: Create sample advertisement
INSERT INTO advertisements (
    ad_title,
    ad_type,
    ad_placement_zone,
    ad_content,
    pricing_model,
    price_amount,
    start_date,
    end_date,
    approval_status
) VALUES (
    'Test Advertisement',
    'banner',
    'dashboard_banner',
    'This is a test ad',
    'duration',
    50000,
    NOW(),
    NOW() + INTERVAL '30 days',
    'pending_approval'
) RETURNING id, ad_title, approval_status;

-- ============================================
-- 3. TEST CONTENT MANAGEMENT
-- ============================================

-- Test: Verify content_pages table
SELECT 'Content Pages Table Test' as test_name,
       COUNT(*) as column_count,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'content_pages';

-- Test: Create sample content page
INSERT INTO content_pages (
    page_slug,
    page_type,
    title,
    content,
    language
) VALUES (
    'test-page',
    'help',
    'Test Page',
    '<h1>Test Content</h1><p>This is a test page.</p>',
    'en'
) RETURNING id, title, is_published;

-- Test: Verify version control trigger
SELECT 'Version Control Trigger Test' as test_name,
       COUNT(*) as trigger_count,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_trigger
WHERE tgname = 'trigger_auto_version_content';

-- ============================================
-- 4. TEST TEMPLATE MANAGEMENT
-- ============================================

-- Test: Verify email templates table
SELECT 'Email Templates Table Test' as test_name,
       COUNT(*) as template_count,
       CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM email_templates;

-- Test: Verify SMS templates table
SELECT 'SMS Templates Table Test' as test_name,
       COUNT(*) as template_count,
       CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM sms_templates;

-- Test: Verify template variables
SELECT 'Template Variables Test' as test_name,
       COUNT(*) as variable_count,
       CASE WHEN COUNT(*) >= 20 THEN 'PASS' ELSE 'FAIL' END as status
FROM template_variables;

-- ============================================
-- 5. TEST RPC FUNCTIONS
-- ============================================

-- Test: check_admin_permission function
SELECT 'check_admin_permission RPC Test' as test_name,
       CASE WHEN check_admin_permission IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_proc
WHERE proname = 'check_admin_permission';

-- Test: get_ads_for_placement function
SELECT 'get_ads_for_placement RPC Test' as test_name,
       CASE WHEN get_ads_for_placement IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_proc
WHERE proname = 'get_ads_for_placement';

-- Test: render_email_template function
SELECT 'render_email_template RPC Test' as test_name,
       CASE WHEN render_email_template IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_proc
WHERE proname = 'render_email_template';

-- ============================================
-- 6. TEST AD REVENUE TRACKING
-- ============================================

-- Test: Verify ad_revenue_records table
SELECT 'Ad Revenue Records Test' as test_name,
       COUNT(*) as column_count,
       CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'ad_revenue_records';

-- Test: Verify advertiser_billing table
SELECT 'Advertiser Billing Test' as test_name,
       COUNT(*) as column_count,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'advertiser_billing';

-- ============================================
-- 7. TEST INDEXES
-- ============================================

-- Test: Verify critical indexes exist
SELECT 'Index Test' as test_name,
       COUNT(*) as index_count,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('advertisements', 'content_pages', 'email_templates', 'sms_templates');

-- ============================================
-- 8. SUMMARY
-- ============================================

SELECT '========================================' as separator;
SELECT 'DATABASE MIGRATION TEST SUMMARY' as title;
SELECT '========================================' as separator;

-- Count total tests
WITH test_results AS (
    SELECT 'Admin Roles' as category, CASE WHEN COUNT(*) = 5 THEN 1 ELSE 0 END as passed FROM admin_roles
    UNION ALL
    SELECT 'Admin Permissions', CASE WHEN COUNT(*) >= 30 THEN 1 ELSE 0 END FROM admin_permissions
    UNION ALL
    SELECT 'Email Templates', CASE WHEN COUNT(*) >= 3 THEN 1 ELSE 0 END FROM email_templates
    UNION ALL
    SELECT 'SMS Templates', CASE WHEN COUNT(*) >= 3 THEN 1 ELSE 0 END FROM sms_templates
    UNION ALL
    SELECT 'Template Variables', CASE WHEN COUNT(*) >= 20 THEN 1 ELSE 0 END FROM template_variables
)
SELECT 
    SUM(passed) as tests_passed,
    COUNT(*) as total_tests,
    ROUND(SUM(passed)::numeric / COUNT(*)::numeric * 100, 2) || '%' as pass_rate
FROM test_results;

-- Cleanup test data
DELETE FROM advertisements WHERE ad_title = 'Test Advertisement';
DELETE FROM content_pages WHERE page_slug = 'test-page';
