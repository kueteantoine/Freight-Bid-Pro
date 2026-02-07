/**
 * End-to-End Workflow Tests using Playwright
 * Tests complete user workflows for ad management, content management, and admin operations
 */

import { test, expect } from '@playwright/test';

test.describe('Advertisement Management Workflow', () => {
    test('complete ad approval workflow', async ({ page }) => {
        // Login as admin
        await page.goto('/admin/login');
        await page.fill('[name="email"]', 'admin@example.com');
        await page.fill('[name="password"]', 'password');
        await page.click('button[type="submit"]');

        // Navigate to advertisements
        await page.goto('/admin/advertisements');
        await expect(page).toHaveURL('/admin/advertisements');

        // Check pending approval tab
        await page.click('text=Pending Approval');
        await expect(page.locator('text=Approval Queue')).toBeVisible();

        // Approve an advertisement
        const firstAd = page.locator('[data-testid="ad-card"]').first();
        await firstAd.locator('button:has-text("Approve")').click();

        // Add approval notes
        await page.fill('textarea[placeholder*="approval"]', 'Looks good!');
        await page.click('button:has-text("Approve")');

        // Verify success message
        await expect(page.locator('text=Advertisement Approved')).toBeVisible();

        // Check active ads tab
        await page.click('text=Active Ads');
        await expect(page.locator('[data-testid="ad-list"]')).toBeVisible();
    });

    test('ad performance tracking', async ({ page }) => {
        await page.goto('/admin/advertisements');

        // Click on an ad to view details
        await page.click('[data-testid="ad-row"]').first();

        // Verify performance metrics are displayed
        await expect(page.locator('text=Impressions')).toBeVisible();
        await expect(page.locator('text=Clicks')).toBeVisible();
        await expect(page.locator('text=CTR')).toBeVisible();

        // Verify performance chart is rendered
        await expect(page.locator('canvas')).toBeVisible();
    });
});

test.describe('Content Management Workflow', () => {
    test('create and publish content page', async ({ page }) => {
        await page.goto('/admin/content');

        // Create new page
        await page.click('text=New Page');
        await expect(page).toHaveURL('/admin/content/new');

        // Fill in content details
        await page.fill('[name="title"]', 'Test Privacy Policy');
        await page.fill('[name="page_slug"]', 'test-privacy');
        await page.selectOption('[name="page_type"]', 'legal');
        await page.fill('textarea[name="content"]', '<h1>Privacy Policy</h1><p>Test content</p>');

        // Create page
        await page.click('button:has-text("Create Page")');

        // Verify redirect to edit page
        await expect(page).toHaveURL(/\/admin\/content\/.*\/edit/);

        // Publish the page
        await page.click('button:has-text("Publish")');
        await expect(page.locator('text=Page Published')).toBeVisible();
    });

    test('content version control', async ({ page }) => {
        await page.goto('/admin/content');

        // Select a content page
        await page.click('[data-testid="content-row"]').first();

        // Navigate to version history
        await page.click('button[title="History"]');

        // Verify version history is displayed
        await expect(page.locator('text=Version History')).toBeVisible();
        await expect(page.locator('[data-testid="version-item"]')).toHaveCount.greaterThan(0);

        // Rollback to previous version
        await page.click('[data-testid="rollback-button"]').first();
        await page.click('button:has-text("Confirm Rollback")');

        // Verify success
        await expect(page.locator('text=Content Rolled Back')).toBeVisible();
    });
});

test.describe('Template Management Workflow', () => {
    test('test email template rendering', async ({ page }) => {
        await page.goto('/admin/templates');

        // Select email templates tab
        await page.click('text=Email Templates');

        // Click on a template
        await page.click('[data-testid="template-row"]').first();

        // Navigate to preview
        await page.click('button[title="Preview"]');

        // Fill in test data
        await page.fill('[name="user_name"]', 'John Doe');
        await page.fill('[name="user_email"]', 'john@example.com');
        await page.fill('[name="payment_amount"]', '50,000 XAF');

        // Generate preview
        await page.click('button:has-text("Preview")');

        // Verify preview is displayed
        await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
        await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('multi-language template support', async ({ page }) => {
        await page.goto('/admin/templates');

        // Select a template
        await page.click('[data-testid="template-row"]').first();

        // Change language to French
        await page.selectOption('[name="language"]', 'fr');

        // Generate preview
        await page.click('button:has-text("Preview")');

        // Verify French content
        await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
    });
});

test.describe('Admin Role Management Workflow', () => {
    test('assign and revoke admin roles', async ({ page }) => {
        await page.goto('/admin/roles');

        // View admin users
        await expect(page.locator('text=Admin Users')).toBeVisible();

        // Assign a role
        await page.click('[data-testid="assign-role-button"]').first();
        await page.selectOption('[name="role"]', 'content_admin');
        await page.click('button:has-text("Assign Role")');

        // Verify success
        await expect(page.locator('text=Role Assigned')).toBeVisible();

        // Revoke a role
        await page.click('[data-testid="revoke-role-button"]').first();
        await page.click('button:has-text("Confirm")');

        // Verify success
        await expect(page.locator('text=Role Revoked')).toBeVisible();
    });

    test('view audit log', async ({ page }) => {
        await page.goto('/admin/roles');

        // Navigate to audit log tab
        await page.click('text=Audit Log');

        // Verify audit log is displayed
        await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible();

        // Filter by action type
        await page.selectOption('[name="action_type"]', 'approve_advertisement');
        await page.click('button:has-text("Search")');

        // Verify filtered results
        await expect(page.locator('[data-testid="audit-row"]')).toHaveCount.greaterThan(0);
    });
});

test.describe('Ad Serving Integration', () => {
    test('ad display on dashboard', async ({ page }) => {
        await page.goto('/dashboard');

        // Verify ad banner is displayed
        await expect(page.locator('[data-testid="ad-banner"]')).toBeVisible();

        // Verify sponsored badge
        await expect(page.locator('text=Sponsored')).toBeVisible();
    });

    test('ad click tracking', async ({ page }) => {
        await page.goto('/dashboard');

        // Click on ad
        const adBanner = page.locator('[data-testid="ad-banner"]');
        await adBanner.click();

        // Verify new tab opens (ad target URL)
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            adBanner.click(),
        ]);

        await expect(newPage).toHaveURL(/example\.com/);
    });
});

test.describe('Revenue Tracking Verification', () => {
    test('revenue dashboard displays correctly', async ({ page }) => {
        await page.goto('/admin/advertisements');

        // Verify revenue metrics
        await expect(page.locator('text=Total Revenue')).toBeVisible();
        await expect(page.locator('text=Total Impressions')).toBeVisible();
        await expect(page.locator('text=Total Clicks')).toBeVisible();
        await expect(page.locator('text=Average CTR')).toBeVisible();

        // Verify revenue values are numbers
        const revenueValue = await page.locator('[data-testid="total-revenue"]').textContent();
        expect(revenueValue).toMatch(/\d+/);
    });
});
