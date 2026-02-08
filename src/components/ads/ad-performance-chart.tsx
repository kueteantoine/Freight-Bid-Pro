'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface AdPerformanceChartProps {
    data: any[];
    title?: string;
    description?: string;
}

export function AdPerformanceChart({ data, title = "Ad Performance", description = "Performance metrics for the last 30 days" }: AdPerformanceChartProps) {
    const chartConfig = {
        impressions: {
            label: "Impressions",
            color: "hsl(var(--chart-1))",
        },
        clicks: {
            label: "Clicks",
            color: "hsl(var(--chart-2))",
        },
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                });
                            }}
                        />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="impressions"
                            stroke="var(--color-impressions)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="clicks"
                            stroke="var(--color-clicks)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
