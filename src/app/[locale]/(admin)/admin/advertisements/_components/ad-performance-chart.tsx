'use client';

import { useEffect, useState } from 'react';
import { getAdPerformanceMetrics } from '@/lib/services/admin/advertisements';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface AdPerformanceChartProps {
    adId: string;
}

export function AdPerformanceChart({ adId }: AdPerformanceChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const result = await getAdPerformanceMetrics(adId, {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0],
            });

            if (result.success && result.data) {
                // Transform data for chart
                const chartData = result.data.daily_metrics?.map((metric: any) => ({
                    date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    impressions: metric.impressions || 0,
                    clicks: metric.clicks || 0,
                    ctr: metric.impressions > 0 ? ((metric.clicks / metric.impressions) * 100).toFixed(2) : 0,
                })) || [];

                setData(chartData);
            }
            setLoading(false);
        }

        fetchData();
    }, [adId]);

    if (loading) {
        return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>;
    }

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No performance data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="impressions"
                    stroke="#8884d8"
                    name="Impressions"
                />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#82ca9d"
                    name="Clicks"
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ctr"
                    stroke="#ffc658"
                    name="CTR (%)"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
