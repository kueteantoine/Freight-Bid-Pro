'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { AdPerformanceChart } from './ad-performance-chart';
import { getAdPerformanceData } from '@/app/actions/ad-analytics-actions';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UserAdAnalyticsDialogProps {
    adId: string;
    adTitle: string;
}

export function UserAdAnalyticsDialog({ adId, adTitle }: UserAdAnalyticsDialogProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            loadAnalytics();
        }
    }, [open]);

    async function loadAnalytics() {
        setLoading(true);
        const result = await getAdPerformanceData(adId);
        if (result.success && 'data' in result) {
            setData(result.data || []);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Analytics: {adTitle}</DialogTitle>
                    <DialogDescription>
                        Performance metrics for the last 30 days
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (data && data.length > 0) ? (
                        <AdPerformanceChart data={data} title="Daily Reach" description="Impressions and Clicks" />
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No performance data available for this advertisement yet.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
