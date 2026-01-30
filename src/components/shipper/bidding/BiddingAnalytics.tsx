"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Clock,
    DollarSign,
    BarChart3,
    Download,
} from "lucide-react";
import { getBidAnalytics } from "@/app/actions/bid-actions";
import { BidAnalytics } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BiddingAnalyticsProps {
    shipmentId: string;
}

export function BiddingAnalytics({ shipmentId }: BiddingAnalyticsProps) {
    const [analytics, setAnalytics] = useState<BidAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAnalytics() {
            try {
                const data = await getBidAnalytics(shipmentId);
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to load analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        loadAnalytics();
    }, [shipmentId]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    if (!analytics || analytics.total_bids === 0) {
        return (
            <Card className="rounded-3xl border-slate-100 shadow-lg">
                <CardContent className="p-10 text-center">
                    <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-900 mb-2">No Bids Yet</p>
                    <p className="text-sm text-slate-500">
                        Analytics will appear once bids are received
                    </p>
                </CardContent>
            </Card>
        );
    }

    const bidSpreadPercentage = analytics.average_bid > 0
        ? ((analytics.bid_spread / analytics.average_bid) * 100).toFixed(1)
        : "0";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-slate-900">Bidding Analytics</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Insights and metrics for this shipment
                    </p>
                </div>
                <Button variant="outline" className="rounded-xl gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Bids"
                    value={analytics.total_bids.toString()}
                    icon={Users}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <MetricCard
                    title="Average Bid"
                    value={`XAF ${analytics.average_bid.toLocaleString()}`}
                    icon={DollarSign}
                    iconColor="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <MetricCard
                    title="Lowest Bid"
                    value={`XAF ${analytics.lowest_bid.toLocaleString()}`}
                    icon={TrendingDown}
                    iconColor="text-green-600"
                    bgColor="bg-green-50"
                    badge="Best Price"
                />
                <MetricCard
                    title="Time to First Bid"
                    value={
                        analytics.time_to_first_bid_minutes !== null
                            ? formatMinutes(analytics.time_to_first_bid_minutes)
                            : "N/A"
                    }
                    icon={Clock}
                    iconColor="text-purple-600"
                    bgColor="bg-purple-50"
                />
            </div>

            {/* Bid Spread Analysis */}
            <Card className="rounded-3xl border-slate-100 shadow-lg overflow-hidden">
                <CardHeader className="p-6 border-b bg-gradient-to-br from-slate-50 to-white">
                    <CardTitle className="text-lg font-black">Bid Spread Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {/* Visual Spread Bar */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-900">
                                    XAF {analytics.lowest_bid.toLocaleString()}
                                </span>
                                <span className="font-bold text-slate-900">
                                    XAF {analytics.highest_bid.toLocaleString()}
                                </span>
                            </div>
                            <div className="relative h-12 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full overflow-hidden">
                                {/* Average Marker */}
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-slate-900"
                                    style={{
                                        left: `${((analytics.average_bid - analytics.lowest_bid) /
                                                (analytics.highest_bid - analytics.lowest_bid)) *
                                            100
                                            }%`,
                                    }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <Badge className="bg-slate-900 text-white font-bold text-xs">
                                            Avg: {analytics.average_bid.toLocaleString()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Lowest</span>
                                <span>Highest</span>
                            </div>
                        </div>

                        {/* Spread Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Bid Spread
                                </p>
                                <p className="text-2xl font-black text-slate-900">
                                    XAF {analytics.bid_spread.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {bidSpreadPercentage}% variation
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Potential Savings
                                </p>
                                <p className="text-2xl font-black text-emerald-600">
                                    XAF {(analytics.average_bid - analytics.lowest_bid).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    vs. average bid
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Market Rate Comparison (Mock Data) */}
            <Card className="rounded-3xl border-slate-100 shadow-lg overflow-hidden">
                <CardHeader className="p-6 border-b bg-gradient-to-br from-slate-50 to-white">
                    <CardTitle className="text-lg font-black">Market Rate Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                            <div>
                                <p className="text-sm font-bold text-blue-900">Current Average</p>
                                <p className="text-2xl font-black text-blue-600 mt-1">
                                    XAF {analytics.average_bid.toLocaleString()}
                                </p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-blue-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="text-sm font-bold text-slate-700">Historical Average</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">
                                    XAF {(analytics.average_bid * 1.15).toLocaleString()}
                                </p>
                            </div>
                            <BarChart3 className="h-10 w-10 text-slate-600" />
                        </div>
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-emerald-600" />
                                <p className="text-sm font-bold text-emerald-900">
                                    15% below historical average
                                </p>
                            </div>
                            <p className="text-xs text-emerald-700 mt-2">
                                You're getting competitive rates for this route!
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 mb-2">
                                Recommendation
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Based on the current bids, we recommend accepting the lowest bid of{" "}
                                <span className="font-bold text-primary">
                                    XAF {analytics.lowest_bid.toLocaleString()}
                                </span>
                                . This is{" "}
                                <span className="font-bold">
                                    {(
                                        ((analytics.average_bid - analytics.lowest_bid) /
                                            analytics.average_bid) *
                                        100
                                    ).toFixed(1)}
                                    %
                                </span>{" "}
                                below the average bid and represents excellent value for this shipment.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({
    title,
    value,
    icon: Icon,
    iconColor,
    bgColor,
    badge,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    badge?: string;
}) {
    return (
        <Card className="rounded-3xl border-slate-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${bgColor} rounded-xl`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    {badge && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-bold text-xs">
                            {badge}
                        </Badge>
                    )}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {title}
                </p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </CardContent>
        </Card>
    );
}

function formatMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-3xl" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
        </div>
    );
}
