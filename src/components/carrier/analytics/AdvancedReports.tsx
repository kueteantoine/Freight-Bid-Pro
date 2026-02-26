"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
    getCompetitorBenchmarks,
    getPredictiveAnalytics,
    Benchmarks
} from "@/app/actions/analytics-actions";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import {
    TrendingUp,
    Users,
    Zap,
    Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomReportBuilder from './CustomReportBuilder';

export default function AdvancedReports() {
    const { convert, format } = useCurrency();
    const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
    const [predictions, setPredictions] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [benchData, predData] = await Promise.all([
                    getCompetitorBenchmarks(),
                    getPredictiveAnalytics()
                ]);
                setBenchmarks(benchData);
                setPredictions(predData);
            } catch (error) {
                console.error("Failed to load advanced analytics", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading advanced insights...</div>;

    const bidComparisonData = benchmarks ? [
        { name: 'Average Bid', Me: benchmarks.my_avg_bid, Market: benchmarks.market_avg_bid },
    ] : [];

    const ratingComparisonData = benchmarks ? [
        { name: 'Avg Rating', Me: benchmarks.my_rating, Market: benchmarks.market_rating },
    ] : [];

    return (
        <div className="space-y-6">
            <Tabs defaultValue="benchmarking" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="benchmarking">Competitor Benchmarking</TabsTrigger>
                    <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
                    <TabsTrigger value="custom">Custom Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="benchmarking">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Price Competitiveness */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Price Competitiveness
                                </CardTitle>
                                <CardDescription>Your average bid vs Market average</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bidComparisonData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <Tooltip
                                            formatter={(val: number) => format(convert(val))}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="Me" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                        <Bar dataKey="Market" fill="#64748b" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Quality Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    Quality Comparison
                                </CardTitle>
                                <CardDescription>Customer satisfaction ratings</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ratingComparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 5]} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Me" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                                        <Bar dataKey="Market" fill="#64748b" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="predictive">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="col-span-1 border-blue-200 bg-blue-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-700">
                                    <Zap className="h-5 w-5" />
                                    Revenue Forecast
                                </CardTitle>
                                <CardDescription>Projected next month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-700">
                                    {predictions ? format(convert(predictions.predicted_monthly_revenue)) : '-'}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                                        +5% Predicted Growth
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Market Demand Forecast</CardTitle>
                                <CardDescription>Based on historical seasonal trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-[150px] text-muted-foreground border-2 border-dashed rounded-lg">
                                    Demand heatmap visualization coming soon
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="custom">
                    <CustomReportBuilder />
                </TabsContent>
            </Tabs>
        </div>
    );
}
