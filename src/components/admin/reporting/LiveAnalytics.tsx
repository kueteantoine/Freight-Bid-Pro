'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    getLiveBiddingAnalytics,
    getPlatformUtilizationMetrics,
    getLiveRevenueTracking
} from '@/actions/admin-reporting-actions';
import { Activity, Users, Package, Gavel, DollarSign, RefreshCw } from 'lucide-react';
import { useCurrency } from "@/contexts/CurrencyContext";

export default function LiveAnalytics() {
    const { convert, format } = useCurrency();
    const [biddingData, setBiddingData] = useState<any>(null);
    const [utilizationData, setUtilizationData] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        loadAllData();

        if (autoRefresh) {
            const interval = setInterval(() => {
                loadAllData();
            }, 30000); // Refresh every 30 seconds

            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const loadAllData = async () => {
        const [bidding, utilization, revenue] = await Promise.all([
            getLiveBiddingAnalytics(),
            getPlatformUtilizationMetrics(),
            getLiveRevenueTracking()
        ]);

        if (bidding.success) setBiddingData(bidding.data);
        if (utilization.success) setUtilizationData(utilization.data);
        if (revenue.success) setRevenueData(revenue.data);

        setLastUpdate(new Date());
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Live Platform Analytics</CardTitle>
                            <CardDescription>
                                Real-time metrics and activity monitoring
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="auto-refresh"
                                    checked={autoRefresh}
                                    onCheckedChange={setAutoRefresh}
                                />
                                <Label htmlFor="auto-refresh" className="text-sm">
                                    Auto-refresh (30s)
                                </Label>
                            </div>
                            <Button onClick={loadAllData} size="sm" variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh Now
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </p>
                </CardContent>
            </Card>

            {/* Platform Utilization Metrics */}
            {utilizationData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{utilizationData.active_users_now || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Users with active roles
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{utilizationData.active_shipments || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                In bidding or transit
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                            <Gavel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{utilizationData.active_bids || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Currently active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transactions Today</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{utilizationData.transactions_today || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Completed payments
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Live Revenue Tracking */}
            {revenueData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Live Revenue Tracking</CardTitle>
                        <CardDescription>Real-time platform commission revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Today</p>
                                <p className="text-2xl font-bold">{format(convert(revenueData.revenue_today || 0))}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                                <p className="text-2xl font-bold">{format(convert(revenueData.revenue_this_week || 0))}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                <p className="text-2xl font-bold">{format(convert(revenueData.revenue_this_month || 0))}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Live Bidding Analytics */}
            {biddingData && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bidding Activity</CardTitle>
                            <CardDescription>Real-time auction metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Active Auctions</span>
                                <Badge variant="default">{biddingData.active_auctions || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Bids (Last Hour)</span>
                                <Badge variant="secondary">{biddingData.bids_last_hour || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Avg. Time to First Bid</span>
                                <Badge variant="outline">
                                    {biddingData.avg_time_to_first_bid ? `${biddingData.avg_time_to_first_bid} min` : 'N/A'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Awards</CardTitle>
                            <CardDescription>Latest bid awards in the last hour</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {biddingData.recent_awards && biddingData.recent_awards.length > 0 ? (
                                <div className="space-y-2">
                                    {biddingData.recent_awards.slice(0, 5).map((award: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{award.shipment_number}</span>
                                            <span className="font-medium">{format(convert(award.bid_amount))}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent awards</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
