'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdRevenueDashboard, getTopPerformingAds } from '@/lib/services/admin/advertisements';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Bar, BarChart } from 'recharts';
import { DollarSign, TrendingUp, Eye, MousePointerClick } from 'lucide-react';

export function AdvancedAnalyticsDashboard() {
    const [revenueData, setRevenueData] = useState<any>(null);
    const [topAds, setTopAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [revenueResult, topAdsResult] = await Promise.all([
                getAdRevenueDashboard({
                    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0],
                }),
                getTopPerformingAds('revenue', 5, {
                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0],
                }),
            ]);

            if (revenueResult.success) {
                setRevenueData(revenueResult.data);
            }
            if (topAdsResult.success) {
                setTopAds(topAdsResult.data || []);
            }
            setLoading(false);
        }

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading analytics...</div>;
    }

    // Transform daily revenue data for chart
    const revenueChartData = revenueData?.daily_revenue?.map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day.total_revenue || 0,
        impressions: day.total_impressions || 0,
        clicks: day.total_clicks || 0,
    })) || [];

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (90d)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {revenueData?.total_revenue?.toLocaleString() || 0} XAF
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Daily Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(revenueData?.total_revenue / 90 || 0).toLocaleString()} XAF
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {revenueData?.total_impressions?.toLocaleString() || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{revenueData?.average_ctr || 0}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Daily revenue over the last 90 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#8884d8"
                                name="Revenue (XAF)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Performance Metrics Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Impressions and clicks over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="impressions"
                                stroke="#82ca9d"
                                name="Impressions"
                            />
                            <Line type="monotone" dataKey="clicks" stroke="#ffc658" name="Clicks" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top Performing Ads */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Ads</CardTitle>
                    <CardDescription>By revenue (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topAds}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="ad_title" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total_revenue" fill="#8884d8" name="Revenue (XAF)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
