'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getConversionFunnel } from '@/app/actions/platform-analytics-actions';
import type { ConversionFunnel as ConversionFunnelType, DateRange } from '@/lib/analytics/types';
import { ArrowDown, TrendingDown } from 'lucide-react';

interface ConversionFunnelsProps {
    dateRange: DateRange;
}

export function ConversionFunnels({ dateRange }: ConversionFunnelsProps) {
    const [data, setData] = useState<ConversionFunnelType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getConversionFunnel(dateRange)
            .then(setData)
            .catch((err) => {
                console.error('Failed to load conversion funnel:', err);
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!data || !data.steps || data.steps.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                    No conversion data available yet. Funnel data will appear as users complete key actions.
                </CardContent>
            </Card>
        );
    }

    const steps = data.steps;
    const maxCount = Math.max(...steps.map((s) => s.count), 1);

    // Color scale from vibrant to subdued
    const stepColors = [
        'bg-sky-500',
        'bg-sky-400',
        'bg-emerald-500',
        'bg-emerald-400',
        'bg-amber-500',
        'bg-amber-400',
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey from registration to payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {steps.map((step, index) => {
                    const widthPercent = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 8) : 8;
                    const prevCount = index > 0 ? steps[index - 1].count : null;
                    const dropoff =
                        prevCount && prevCount > 0
                            ? (((prevCount - step.count) / prevCount) * 100).toFixed(1)
                            : null;

                    return (
                        <div key={step.event_name}>
                            {/* Drop-off indicator */}
                            {dropoff !== null && (
                                <div className="flex items-center gap-2 py-1 pl-4 text-xs text-muted-foreground">
                                    <ArrowDown className="h-3 w-3" />
                                    <TrendingDown className="h-3 w-3 text-red-400" />
                                    <span>{dropoff}% drop-off</span>
                                </div>
                            )}

                            {/* Funnel bar */}
                            <div className="flex items-center gap-4">
                                <div className="w-40 text-sm font-medium truncate shrink-0">{step.name}</div>
                                <div className="flex-1 h-10 bg-muted rounded-md overflow-hidden relative">
                                    <div
                                        className={`h-full ${stepColors[index % stepColors.length]} rounded-md transition-all duration-500 flex items-center justify-end pr-3`}
                                        style={{ width: `${widthPercent}%` }}
                                    >
                                        <span className="text-sm font-bold text-white drop-shadow-sm">
                                            {step.count.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Overall conversion rate */}
                {steps.length >= 2 && steps[0].count > 0 && (
                    <div className="mt-6 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            Overall Conversion Rate
                        </span>
                        <span className="text-lg font-bold">
                            {((steps[steps.length - 1].count / steps[0].count) * 100).toFixed(1)}%
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
