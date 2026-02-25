'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserEngagementMetrics } from './UserEngagementMetrics';
import { ConversionFunnels } from './ConversionFunnels';
import { PerformanceMonitoring } from './PerformanceMonitoring';
import type { DateRange } from '@/lib/analytics/types';
import { BarChart3, Funnel, Gauge } from 'lucide-react';

const DATE_RANGES: { value: DateRange; label: string }[] = [
    { value: '7_days', label: 'Last 7 Days' },
    { value: '30_days', label: 'Last 30 Days' },
    { value: '90_days', label: 'Last 90 Days' },
    { value: 'ytd', label: 'Year to Date' },
];

export function PlatformAnalyticsDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>('30_days');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Platform Analytics</h2>
                    <p className="text-muted-foreground">
                        Monitor user engagement, conversion funnels, and performance metrics.
                    </p>
                </div>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        {DATE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                                {range.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tabbed Views */}
            <Tabs defaultValue="engagement" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="engagement" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Engagement
                    </TabsTrigger>
                    <TabsTrigger value="conversion" className="gap-2">
                        <Funnel className="h-4 w-4" />
                        Conversion
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2">
                        <Gauge className="h-4 w-4" />
                        Performance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="engagement">
                    <UserEngagementMetrics dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="conversion">
                    <ConversionFunnels dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="performance">
                    <PerformanceMonitoring dateRange={dateRange} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
