'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface RevenueData {
    period: string; // ISO date string
    revenue: number;
}

interface RevenueChartProps {
    data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    // Format data for chart
    const formattedData = (data || []).map(item => ({
        name: new Date(item.period).toLocaleDateString('fr-CM', { month: 'short', year: 'numeric' }),
        total: item.revenue
    })).reverse(); // API returns descending, we want ascending for chart l-to-r usually

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={formattedData}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`} // Simplify for Y axis
                        />
                        <Tooltip
                            formatter={(value: number) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(value)}
                        />
                        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
