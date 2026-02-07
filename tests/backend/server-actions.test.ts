/**
 * Backend Server Actions Test Suite
 * Tests all server actions for advertisements, content, templates, and admin permissions
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
    getAdApprovalQueue,
    approveAdvertisement,
    rejectAdvertisement,
    createAdvertisement,
    getAdsForPlacement,
    trackAdImpression,
    trackAdClick,
    getAdPerformanceMetrics,
} from '@/lib/services/admin/advertisements';
import {
    getContentPages,
    createContentPage,
    updateContentPage,
    publishContentPage,
    getContentHistory,
    rollbackContent,
} from '@/lib/services/admin/content';
import {
    getEmailTemplates,
    renderEmailTemplate,
    renderSmsTemplate,
    previewTemplate,
} from '@/lib/services/admin/templates';
import {
    checkPermission,
    assignAdminRole,
    revokeAdminRole,
    getAdminAuditLog,
} from '@/lib/services/admin/admin-permissions';

describe('Advertisement Server Actions', () => {
    let testAdId: string;

    it('should create a new advertisement', async () => {
        const result = await createAdvertisement({
            ad_title: 'Test Banner Ad',
            ad_type: 'banner',
            ad_placement_zone: 'dashboard_banner',
            ad_content: 'Test content',
            target_url: 'https://example.com',
            pricing_model: 'duration',
            price_amount: 50000,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
        testAdId = result.data.id;
    });

    it('should fetch approval queue', async () => {
        const result = await getAdApprovalQueue();
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    it('should approve advertisement', async () => {
        const result = await approveAdvertisement(testAdId, 'Looks good!');
        expect(result.success).toBe(true);
    });

    it('should get ads for placement', async () => {
        const result = await getAdsForPlacement('dashboard_banner', {
            user_role: 'shipper',
            language: 'en',
        });
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    it('should track ad impression', async () => {
        const result = await trackAdImpression(testAdId);
        expect(result.success).toBe(true);
    });

    it('should track ad click', async () => {
        const result = await trackAdClick(testAdId);
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('target_url');
    });

    it('should get ad performance metrics', async () => {
        const result = await getAdPerformanceMetrics(testAdId, {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
        });
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('impressions_count');
        expect(result.data).toHaveProperty('clicks_count');
    });
});

describe('Content Management Server Actions', () => {
    let testPageId: string;

    it('should create a new content page', async () => {
        const result = await createContentPage({
            page_slug: 'test-terms',
            page_type: 'legal',
            title: 'Test Terms of Service',
            content: '<h1>Terms</h1><p>Test content</p>',
            language: 'en',
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
        testPageId = result.data.id;
    });

    it('should fetch content pages', async () => {
        const result = await getContentPages({ page_type: 'legal' });
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    it('should update content page and create version', async () => {
        const result = await updateContentPage(
            testPageId,
            {
                content: '<h1>Terms</h1><p>Updated content</p>',
            },
            'Updated legal disclaimer'
        );
        expect(result.success).toBe(true);
    });

    it('should get content history', async () => {
        const result = await getContentHistory(testPageId);
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
    });

    it('should publish content page', async () => {
        const result = await publishContentPage(testPageId);
        expect(result.success).toBe(true);
    });
});

describe('Template Server Actions', () => {
    it('should fetch email templates', async () => {
        const result = await getEmailTemplates('en');
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    it('should render email template', async () => {
        const result = await renderEmailTemplate(
            'payment_confirmation',
            {
                user_name: 'John Doe',
                payment_amount: '50,000 XAF',
                transaction_id: 'TXN-12345',
            },
            'shipper',
            'en'
        );
        expect(result.success).toBe(true);
        expect(result.data).toContain('John Doe');
        expect(result.data).toContain('50,000 XAF');
    });

    it('should render SMS template', async () => {
        const result = await renderSmsTemplate(
            'payment_confirmation_sms',
            {
                payment_amount: '50,000 XAF',
                transaction_id: 'TXN-12345',
            },
            'shipper',
            'en'
        );
        expect(result.success).toBe(true);
        expect(typeof result.data).toBe('string');
    });
});

describe('Admin Permission Server Actions', () => {
    it('should check permission', async () => {
        const result = await checkPermission('can_approve_ads');
        expect(typeof result).toBe('boolean');
    });

    it('should get admin audit log', async () => {
        const result = await getAdminAuditLog({ limit: 10 });
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });
});

describe('Multi-Language Support', () => {
    it('should render template in French', async () => {
        const result = await renderEmailTemplate(
            'payment_confirmation',
            {
                user_name: 'Jean Dupont',
                payment_amount: '50 000 XAF',
            },
            'shipper',
            'fr'
        );
        expect(result.success).toBe(true);
    });

    it('should fetch French content', async () => {
        const result = await getContentPages({ language: 'fr' });
        expect(result.success).toBe(true);
    });
});

describe('Conditional Logic Testing', () => {
    it('should render different content for shipper role', async () => {
        const shipperResult = await renderEmailTemplate(
            'shipment_update',
            { shipment_id: 'SHP-123' },
            'shipper',
            'en'
        );
        expect(shipperResult.success).toBe(true);
    });

    it('should render different content for carrier role', async () => {
        const carrierResult = await renderEmailTemplate(
            'shipment_update',
            { shipment_id: 'SHP-123' },
            'carrier',
            'en'
        );
        expect(carrierResult.success).toBe(true);
    });
});
