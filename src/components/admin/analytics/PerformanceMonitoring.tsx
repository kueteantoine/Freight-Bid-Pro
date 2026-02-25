'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    getPerformanceMetrics,
    getErrorAnalytics,
} from '@/app/actions/platform-analytics-actions';
import type { PerformanceMetrics as PerformanceMetricsType, ErrorAnalytics, DateRange } from '@/lib/analytics/types';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { Gauge, AlertTriangle, Clock, Zap } from 'lucide-react';

interface PerformanceMonitoringProps {
    dateRange: DateRange;
}

function getLoadTimeStatus(ms: number | null): { label: string; color: string } {
    if (ms === null) return { label: 'No data', color: 'secondary' };
    if (ms < 1000) return { label: 'Excellent', color: 'default' };
    if (ms < 2500) return { label: 'Good', color: 'default' };
    if (ms < 4000) return { label: 'Needs improvement', color: 'outline' };
    return { label: 'Poor', color: 'destructive' };
}

export function PerformanceMonitoring({ dateRange }: PerformanceMonitoringProps) {
    const [perfData, setPerfData] = useState<PerformanceMetricsType | null>(null);
    const [errorData, setErrorData] = useState<ErrorAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getPerformanceMetrics(dateRange),
            getErrorAnalytics(dateRange),
        ])
            .then(([perf, errors]) => {
                setPerfData(perf);
                setErrorData(errors);
            })
            .catch((err) => {
                console.error('Failed to load performance data:', err);
            })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                        </Card>
                    ))}
                </div>
                <Card><CardContent className="pt-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            </div>
        );
    }

    const pageLoadStatus = getLoadTimeStatus(perfData?.avg_page_load_ms ?? null);

    return (
        <div className="space-y-4">
            {/* Performance KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Page Load</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {perfData?.avg_page_load_ms != null ? `${perfData.avg_page_load_ms}ms` : '—'}
                        </div>
                        <Badge variant={pageLoadStatus.color as 'default' | 'secondary' | 'destructive' | 'outline'} className="mt-1">
                            {pageLoadStatus.label}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">P95 Page Load</CardTitle>
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {perfData?.p95_page_load_ms != null ? `${perfData.p95_page_load_ms}ms` : '—'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg API Response</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {perfData?.avg_api_response_ms != null ? `${perfData.avg_api_response_ms}ms` : '—'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {perfData?.error_rate != null ? `${perfData.error_rate}%` : '—'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {errorData?.errors_today ?? 0} errors today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Page Load Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Page Load Performance</CardTitle>
                    <CardDescription>Average page load times over time</CardDescription>
                </CardHeader>
                <CardContent>
                    {perfData?.page_load_trend && perfData.page_load_trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={perfData.page_load_trend}>
                                <defs>
                                    <linearGradient id="pageLoadGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="apiGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    className="text-xs"
                                />
                                <YAxis unit="ms" className="text-xs" />
                                <Tooltip
                                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                    formatter={(value: number) => [`${value}ms`]}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="avg_ms"
                                    stroke="#f59e0b"
                                    fill="url(#pageLoadGrad)"
                                    name="Avg Load Time"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No page load data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Errors</CardTitle>
                    <CardDescription>Most frequent errors in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    {errorData?.top_errors && errorData.top_errors.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-medium text-muted-foreground">Error</th>
                                        <th className="pb-2 font-medium text-muted-foreground text-right">Count</th>
                                        <th className="pb-2 font-medium text-muted-foreground text-right">Affected Users</th>
                                        <th className="pb-2 font-medium text-muted-foreground text-right">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errorData.top_errors.map((err, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="py-3">
                                                <div className="font-medium">{err.error_type}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                    {err.message}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-mono">{err.occurrences}</td>
                                            <td className="py-3 text-right">{err.affected_users}</td>
                                            <td className="py-3 text-right text-muted-foreground">
                                                {new Date(err.last_seen).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            No errors recorded — looking good! 🎉
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
