# Database Migration Guide
## Advertisement & Content Management System

This guide shows you exactly which migration files to apply and in what order.

---

## 📋 Migration Files to Apply (5 files)

Apply these migrations **in order** (the timestamps ensure correct ordering):

### 1. Admin Roles & Permissions
**File:** `supabase/migrations/20260207190000_admin_roles_permissions.sql`

**What it creates:**
- `admin_roles` table (5 roles: super_admin, financial_admin, content_admin, ad_manager, support_admin)
- `admin_permissions` table (30+ permissions)
- `admin_role_permissions` table (role-permission mappings)
- `user_admin_roles` table (user-role assignments)
- `admin_audit_log` table (action tracking)
- RPC functions for permission checking and role management

**Why first:** Other migrations depend on the admin permission system.

---

### 2. Advertisement Enhancements
**File:** `supabase/migrations/20260207190001_advertisements_enhancement.sql`

**What it creates:**
- Enhances `advertisements` table with new columns:
  - `ad_placement_zone` (dashboard_banner, sidebar_banner, sponsored_listing)
  - `target_user_role` (shipper, carrier, driver, broker)
  - `target_language` (en, fr)
  - `target_regions` (array)
  - `approval_status` (pending_approval, approved, rejected)
  - `approval_notes`, `approved_by`, `approved_at`
  - `rejection_reason`, `rejected_by`, `rejected_at`
- Creates indexes for performance
- RPC functions for ad management and approval

**Depends on:** Migration #1 (admin roles)

---

### 3. Content Management System
**File:** `supabase/migrations/20260207190002_content_management.sql`

**What it creates:**
- `content_pages` table (CMS pages with SEO fields)
- `content_versions` table (version history)
- Automatic versioning trigger
- RPC functions for content CRUD, publishing, and rollback
- Indexes for slug and language lookups

**Depends on:** Migration #1 (admin roles)

---

### 4. Template Management
**File:** `supabase/migrations/20260207190003_template_management.sql`

**What it creates:**
- `email_templates` table (with 3 default templates)
- `sms_templates` table (with 3 default templates)
- `template_variables` table (20+ variables like {{user_name}}, {{payment_amount}})
- RPC functions for template rendering with variable substitution
- Conditional logic support (role-based content)

**Depends on:** Migration #1 (admin roles)

---

### 5. Ad Revenue Tracking
**File:** `supabase/migrations/20260207190004_ad_revenue_tracking.sql`

**What it creates:**
- `ad_impressions` table (tracks each ad view)
- `ad_clicks` table (tracks each ad click)
- `ad_conversions` table (tracks conversions)
- `ad_revenue_records` table (daily revenue aggregation)
- `advertiser_billing` table (billing records)
- RPC functions for tracking and analytics
- Indexes for performance queries

**Depends on:** Migration #2 (advertisements table)

---

## 🚀 How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd "c:\Users\Kuete Antoine\dyad-apps\Freight Bid Pro"

# Reset database and apply all migrations
npx supabase db reset

# Or apply migrations individually
npx supabase migration up
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file **in order**
4. Run each migration one by one

### Option 3: Using psql

```bash
# Connect to your database
psql -h db.your-project.supabase.co -U postgres -d postgres

# Apply migrations in order
\i supabase/migrations/20260207190000_admin_roles_permissions.sql
\i supabase/migrations/20260207190001_advertisements_enhancement.sql
\i supabase/migrations/20260207190002_content_management.sql
\i supabase/migrations/20260207190003_template_management.sql
\i supabase/migrations/20260207190004_ad_revenue_tracking.sql
```

---

## ✅ Verify Migrations Applied

After applying all migrations, run this verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'admin_roles',
    'admin_permissions',
    'admin_role_permissions',
    'user_admin_roles',
    'admin_audit_log',
    'content_pages',
    'content_versions',
    'email_templates',
    'sms_templates',
    'template_variables',
    'ad_impressions',
    'ad_clicks',
    'ad_conversions',
    'ad_revenue_records',
    'advertiser_billing'
)
ORDER BY table_name;

-- Expected: 15 tables
```

You should see **15 tables** in the result.

---

## 🔍 Check Migration Status

```bash
# List all applied migrations
npx supabase migration list

# Expected output:
# 20260207190000_admin_roles_permissions.sql          ✓ Applied
# 20260207190001_advertisements_enhancement.sql       ✓ Applied
# 20260207190002_content_management.sql               ✓ Applied
# 20260207190003_template_management.sql              ✓ Applied
# 20260207190004_ad_revenue_tracking.sql              ✓ Applied
```

---

## 🧪 Test Migrations

After applying, run the test script:

```bash
psql -U postgres -d freight_bid_pro -f tests/database/migration-tests.sql
```

All tests should show **PASS** status.

---

## ⚠️ Important Notes

1. **Order Matters:** Apply migrations in the exact order listed (timestamps ensure this)
2. **Backup First:** Always backup your database before applying migrations
3. **One-Time Only:** Each migration should only be applied once
4. **Dependencies:** Later migrations depend on earlier ones
5. **Rollback:** If something fails, use `npx supabase db reset` to start fresh

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** Migration was already applied. Check with `npx supabase migration list`

### Error: "column does not exist"
**Solution:** Earlier migration not applied. Apply migrations in order.

### Error: "permission denied"
**Solution:** Check database user has sufficient privileges.

---

## 📊 What Gets Created

After all 5 migrations:

- **13 new/enhanced tables**
- **28 RPC functions**
- **20+ indexes**
- **5 admin roles**
- **30+ permissions**
- **6 default templates** (3 email + 3 SMS)
- **20+ template variables**

---

## 🎯 Next Steps After Migration

1. ✅ Verify all migrations applied successfully
2. ✅ Run test script to confirm database structure
3. ✅ Assign first super admin role to your user
4. ✅ Test admin UI at `/admin/advertisements`
5. ✅ Configure first advertisement
6. ✅ Test template rendering

---

**Migration Files Location:**
`c:\Users\Kuete Antoine\dyad-apps\Freight Bid Pro\supabase\migrations\`

**Test Script Location:**
`c:\Users\Kuete Antoine\dyad-apps\Freight Bid Pro\tests\database\migration-tests.sql`
