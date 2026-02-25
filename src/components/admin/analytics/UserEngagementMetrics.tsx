'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserEngagementMetrics } from '@/app/actions/platform-analytics-actions';
import type { EngagementMetrics, DateRange } from '@/lib/analytics/types';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
} from 'recharts';
import { Users, Activity, MousePointerClick, Globe } from 'lucide-react';

interface UserEngagementMetricsProps {
    dateRange: DateRange;
}

export function UserEngagementMetrics({ dateRange }: UserEngagementMetricsProps) {
    const [data, setData] = useState<EngagementMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getUserEngagementMetrics(dateRange)
            .then(setData)
            .catch((err) => {
                console.error('Failed to load engagement metrics:', err);
                setData(null);
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

    if (!data) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                    No engagement data available yet. Events will appear here as users interact with the platform.
                </CardContent>
            </Card>
        );
    }

    const categoryData = Object.entries(data.events_by_category || {}).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
    }));

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.daily_active_users.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.weekly_active_users.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.monthly_active_users.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Events/Session</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.avg_events_per_session ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* DAU Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Users Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.dau_trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data.dau_trend}>
                                <defs>
                                    <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
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
                                <YAxis className="text-xs" />
                                <Tooltip
                                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="active_users"
                                    stroke="#0ea5e9"
                                    fill="url(#dauGradient)"
                                    name="Active Users"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No trend data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Events by Category */}
            <Card>
                <CardHeader>
                    <CardTitle>Events by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Events" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                            No category data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
