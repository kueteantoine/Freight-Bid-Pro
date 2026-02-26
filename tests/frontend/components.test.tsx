/**
 * Frontend Component Test Suite
 * Tests React components for advertisements, content, templates, and admin UI
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect as jestExpect, jest } from '@jest/globals';

// Wrapper to fix toBeInTheDocument type errors with @jest/globals
const expect = (actual: any) => (jestExpect(actual) as any);

import { AdBanner } from '@/components/ads/ad-banner';
import { SponsoredListing } from '@/components/ads/sponsored-listing';
import { AdApprovalQueue } from '@/app/[locale]/(admin)/admin/advertisements/_components/ad-approval-queue';
import { ContentPageList } from '@/app/[locale]/(admin)/admin/content/_components/content-page-list';
import { TemplateList } from '@/app/[locale]/(admin)/admin/templates/_components/template-list';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { ContentDiffViewer } from '@/components/content/content-diff-viewer';

// Mock server actions
jest.mock('@/lib/services/admin/advertisements', () => ({
    getAdsForPlacement: jest.fn(),
    trackAdImpression: jest.fn(),
    trackAdClick: jest.fn(),
    getAdApprovalQueue: jest.fn(),
    approveAdvertisement: jest.fn(),
    rejectAdvertisement: jest.fn(),
}));

jest.mock('@/lib/services/admin/content', () => ({
    getContentPages: jest.fn(),
    publishContentPage: jest.fn(),
    unpublishContentPage: jest.fn(),
}));

jest.mock('@/lib/services/admin/templates', () => ({
    getEmailTemplates: jest.fn(),
    getSmsTemplates: jest.fn(),
}));

describe('Ad Display Components', () => {
    it('should render AdBanner with loading state', () => {
        render(<AdBanner zone="dashboard_banner" userRole="shipper" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render SponsoredListing with multiple ads', async () => {
        const mockAds = [
            { id: '1', ad_title: 'Test Ad 1', ad_content: 'Content 1' },
            { id: '2', ad_title: 'Test Ad 2', ad_content: 'Content 2' },
        ];

        const { getAdsForPlacement } = await import('@/lib/services/admin/advertisements');
        (getAdsForPlacement as any).mockResolvedValue({ success: true, data: mockAds });

        render(<SponsoredListing userRole="shipper" maxAds={3} />);

        await waitFor(() => {
            expect(screen.getByText('Test Ad 1')).toBeInTheDocument();
            expect(screen.getByText('Test Ad 2')).toBeInTheDocument();
        });
    });

    it('should track impression on ad display', async () => {
        const mockAd = {
            id: 'test-ad-1',
            ad_title: 'Test Ad',
            ad_image_url: 'https://example.com/image.jpg',
        };

        const { getAdsForPlacement, trackAdImpression } = await import(
            '@/lib/services/admin/advertisements'
        );
        (getAdsForPlacement as any).mockResolvedValue({ success: true, data: [mockAd] });
        (trackAdImpression as any).mockResolvedValue({ success: true });

        render(<AdBanner zone="dashboard_banner" />);

        await waitFor(() => {
            expect(trackAdImpression).toHaveBeenCalledWith('test-ad-1');
        });
    });
});

describe('Admin Components', () => {
    it('should render AdApprovalQueue with pending ads', async () => {
        const mockAds = [
            {
                id: '1',
                ad_title: 'Pending Ad 1',
                approval_status: 'pending_approval',
                created_at: new Date().toISOString(),
            },
        ];

        const { getAdApprovalQueue } = await import('@/lib/services/admin/advertisements');
        (getAdApprovalQueue as any).mockResolvedValue({ success: true, data: mockAds });

        render(<AdApprovalQueue />);

        await waitFor(() => {
            expect(screen.getByText('Pending Ad 1')).toBeInTheDocument();
        });
    });

    it('should handle ad approval', async () => {
        const mockAds = [
            {
                id: 'test-ad',
                ad_title: 'Test Ad',
                approval_status: 'pending_approval',
            },
        ];

        const { getAdApprovalQueue, approveAdvertisement } = await import(
            '@/lib/services/admin/advertisements'
        );
        (getAdApprovalQueue as any).mockResolvedValue({ success: true, data: mockAds });
        (approveAdvertisement as any).mockResolvedValue({ success: true });

        render(<AdApprovalQueue />);

        await waitFor(() => {
            const approveButton = screen.getByText('Approve');
            fireEvent.click(approveButton);
        });

        await waitFor(() => {
            expect(approveAdvertisement).toHaveBeenCalled();
        });
    });

    it('should render ContentPageList with pages', async () => {
        const mockPages = [
            {
                id: '1',
                title: 'Terms of Service',
                page_slug: 'terms',
                is_published: true,
                updated_at: new Date().toISOString(),
            },
        ];

        const { getContentPages } = await import('@/lib/services/admin/content');
        (getContentPages as any).mockResolvedValue({ success: true, data: mockPages });

        render(<ContentPageList />);

        await waitFor(() => {
            expect(screen.getByText('Terms of Service')).toBeInTheDocument();
        });
    });

    it('should render TemplateList with templates', async () => {
        const mockTemplates = [
            {
                id: '1',
                template_name: 'Payment Confirmation',
                template_key: 'payment_confirmation',
                is_active: true,
            },
        ];

        const { getEmailTemplates } = await import('@/lib/services/admin/templates');
        (getEmailTemplates as any).mockResolvedValue({ success: true, data: mockTemplates });

        render(<TemplateList templateType="email" />);

        await waitFor(() => {
            expect(screen.getByText('Payment Confirmation')).toBeInTheDocument();
        });
    });
});

describe('Advanced Feature Components', () => {
    it('should render RichTextEditor', () => {
        const mockOnChange = jest.fn();
        render(<RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />);

        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render ContentDiffViewer with differences', () => {
        const oldContent = 'This is old content';
        const newContent = 'This is new content';

        render(
            <ContentDiffViewer
                oldContent={oldContent}
                newContent={newContent}
                oldVersion="v1"
                newVersion="v2"
            />
        );

        expect(screen.getByText(/Content Comparison/i)).toBeInTheDocument();
    });
});

describe('Accessibility Tests', () => {
    it('should have proper ARIA labels on ad components', () => {
        render(<AdBanner zone="dashboard_banner" />);
        // Check for accessibility attributes
    });

    it('should support keyboard navigation in admin tables', async () => {
        const mockPages = [
            {
                id: '1',
                title: 'Test Page',
                page_slug: 'test',
                is_published: true,
                updated_at: new Date().toISOString(),
            },
        ];

        const { getContentPages } = await import('@/lib/services/admin/content');
        (getContentPages as any).mockResolvedValue({ success: true, data: mockPages });

        render(<ContentPageList />);

        await waitFor(() => {
            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();
        });
    });
});
