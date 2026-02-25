import { PlatformAnalyticsDashboard } from '@/components/admin/analytics/PlatformAnalyticsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Platform Analytics',
    description: 'Monitor user engagement, conversion funnels, and platform performance.',
};

export default function PlatformAnalyticsPage() {
    return <PlatformAnalyticsDashboard />;
}
