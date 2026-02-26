'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdRevenueDashboard } from '@/lib/services/admin/advertisements';
import { DollarSign, Eye, MousePointerClick, TrendingUp } from 'lucide-react';

export function AdRevenueOverview() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const result = await getAdRevenueDashboard({
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0],
            });

            if (result.success) {
                setData(result.data);
            }
            setLoading(false);
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const stats = [
        {
            title: 'Performance Revenue',
            value: `${data.total_performance_revenue?.toLocaleString()} XAF`,
            icon: DollarSign,
            description: 'CPM/CPC Revenue',
        },
        {
            title: 'Subscription Revenue',
            value: `${data.total_subscription_revenue?.toLocaleString()} XAF`,
            icon: DollarSign,
            description: 'Active Subscriptions',
        },
        {
            title: 'Total Combined',
            value: `${data.total_combined_revenue?.toLocaleString()} XAF`,
            icon: DollarSign,
            description: 'All Ad Revenue',
        },
        {
            title: 'Average CTR',
            value: `${data.average_ctr || 0}%`,
            icon: TrendingUp,
            description: 'Click-through rate',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
