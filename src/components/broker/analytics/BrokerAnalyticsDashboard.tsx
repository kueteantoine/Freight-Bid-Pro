"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    Users,
    DollarSign,
    Package,
    Download,
    Calendar,
} from "lucide-react";
import {
    getRevenueAnalytics,
    getNetworkAnalytics,
    getPerformanceMetrics,
    exportAnalyticsReport,
    type RevenueAnalytics,
    type NetworkAnalytics,
    type PerformanceMetrics,
} from "@/lib/services/broker-analytics-actions";
import { toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function BrokerAnalyticsDashboard() {
    const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
    const [networkData, setNetworkData] = useState<NetworkAnalytics | null>(null);
    const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y">("90d");

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        const [revenue, network, performance] = await Promise.all([
            getRevenueAnalytics(),
            getNetworkAnalytics(),
            getPerformanceMetrics(),
        ]);

        if (revenue.data) setRevenueData(revenue.data);
        if (network.data) setNetworkData(network.data);
        if (performance.data) setPerformanceData(performance.data);
        setLoading(false);
    };

    const handleExport = async (reportType: "revenue" | "network" | "performance") => {
        const { data, error } = await exportAnalyticsReport(reportType);
        if (error) {
            toast.error("Failed to export report: " + error);
            return;
        }

        if (data) {
            const blob = new Blob([data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `broker-${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            toast.success("Report exported successfully!");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-primary">Analytics Dashboard</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDateRange("30d")}>
                        30 Days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange("90d")}>
                        90 Days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange("1y")}>
                        1 Year
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {revenueData?.total_revenue.toLocaleString()} XAF
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {revenueData?.revenue_growth_rate.toFixed(1)}% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {revenueData?.total_commission.toLocaleString()} XAF
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg rate: {revenueData?.average_commission_rate.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{networkData?.active_partners}</div>
                        <p className="text-xs text-muted-foreground">
                            {networkData?.inactive_partners} inactive
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {performanceData?.completion_rate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg delivery: {performanceData?.average_delivery_time_days.toFixed(1)} days
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="revenue" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                {/* Revenue Tab */}
                <TabsContent value="revenue" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Revenue Trends</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport("revenue")}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData?.monthly_revenue || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8884d8"
                                        name="Revenue"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="commission"
                                        stroke="#82ca9d"
                                        name="Commission"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Shipments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={revenueData?.monthly_revenue || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="shipments" fill="#8884d8" name="Shipments" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Network Tab */}
                <TabsContent value="network" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Network Growth</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport("network")}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={networkData?.network_growth || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="shipper_count"
                                        stackId="1"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        name="Shippers"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="carrier_count"
                                        stackId="1"
                                        stroke="#82ca9d"
                                        fill="#82ca9d"
                                        name="Carriers"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Shippers by Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {networkData?.top_shippers.slice(0, 5).map((shipper, index) => (
                                        <div
                                            key={shipper.id}
                                            className="flex items-center justify-between p-3 bg-accent/10 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{shipper.company_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {shipper.total_shipments} shipments
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">
                                                    {shipper.total_revenue.toLocaleString()} XAF
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Carriers by Volume</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {networkData?.top_carriers.slice(0, 5).map((carrier, index) => (
                                        <div
                                            key={carrier.id}
                                            className="flex items-center justify-between p-3 bg-accent/10 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{carrier.company_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Rating: {carrier.reliability_rating.toFixed(1)}/5.0
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">
                                                    {carrier.total_shipments} shipments
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
                                    <span className="text-sm font-medium">Total Shipments</span>
                                    <span className="text-2xl font-bold">
                                        {performanceData?.total_shipments_brokered}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
                                    <span className="text-sm font-medium">Avg Shipment Value</span>
                                    <span className="text-2xl font-bold">
                                        {performanceData?.average_shipment_value.toLocaleString()} XAF
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
                                    <span className="text-sm font-medium">Completion Rate</span>
                                    <span className="text-2xl font-bold">
                                        {performanceData?.completion_rate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
                                    <span className="text-sm font-medium">Avg Delivery Time</span>
                                    <span className="text-2xl font-bold">
                                        {performanceData?.average_delivery_time_days.toFixed(1)} days
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Partner Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                {
                                                    name: "Active Partners",
                                                    value: networkData?.active_partners || 0,
                                                },
                                                {
                                                    name: "Inactive Partners",
                                                    value: networkData?.inactive_partners || 0,
                                                },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {[0, 1].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
