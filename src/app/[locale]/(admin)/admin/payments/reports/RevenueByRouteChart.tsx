"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueByRouteChartProps {
    data: Array<{
        route: string;
        totalRevenue: number;
        commission: number;
        transactionCount: number;
    }>;
}

export default function RevenueByRouteChart({ data }: RevenueByRouteChartProps) {
    const topRoutes = data.slice(0, 10);
    const maxRevenue = Math.max(...topRoutes.map(r => r.totalRevenue), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue by Route (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topRoutes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No route data available</p>
                    ) : (
                        topRoutes.map((route, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium truncate">{route.route}</span>
                                    <span className="text-muted-foreground">
                                        {route.totalRevenue.toLocaleString()} XAF
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all"
                                        style={{ width: `${(route.totalRevenue / maxRevenue) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {route.transactionCount} transactions
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
