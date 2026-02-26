"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    Filter,
    DollarSign,
    Truck,
    MapPin,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    BarChart3,
    PieChart as PieChartIcon,
    AlertCircle,
    Star,
    Clock,
    Zap,
    Users,
    Search,
    Mail,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar as ReBar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";
import {
    getShipperAnalytics,
    getSpendingOverTime,
    getCostBreakdown,
    getRouteEfficiency,
    getTransporterPerformance,
    DashboardMetrics,
    SpendingData,
    CostBreakdown,
    RoutePerformance,
    TransporterPerformance
} from "@/app/actions/analytics-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ShipperAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
    const [routeEfficiency, setRouteEfficiency] = useState<RoutePerformance[]>([]);
    const [transporters, setTransporters] = useState<TransporterPerformance[]>([]);
    const [timeRange, setTimeRange] = useState("6m");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [m, s, c, r, t] = await Promise.all([
                    getShipperAnalytics(timeRange),
                    getSpendingOverTime(6),
                    getCostBreakdown(),
                    getRouteEfficiency(),
                    getTransporterPerformance()
                ]);
                setMetrics(m);
                setSpendingData(s);
                setCostBreakdown(c);
                setRouteEfficiency(r);
                setTransporters(t);
            } catch (error) {
                console.error("Failed to load analytics:", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [timeRange]);

    const handleExport = () => {
        toast.success("Preparing CSV export...");
    };

    if (loading && !metrics) {
        return <AnalyticsSkeleton />;
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Shipper Analytics</h2>
                    <p className="text-slate-500 mt-1">
                        Comprehensive insights into your freight operations, costs, and performance.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2 text-slate-400" />
                        Download CSV
                    </Button>
                    <Button className="rounded-xl h-11 px-6 bg-primary font-bold shadow-lg shadow-primary/20 transition-all">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                    </Button>
                </div>
            </div>

            {/* Date Range & Summary */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-48 border-none bg-transparent font-bold text-slate-700 focus:ring-0">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="1m">Last 30 Days</SelectItem>
                            <SelectItem value="3m">Last 3 Months</SelectItem>
                            <SelectItem value="6m">Last 6 Months</SelectItem>
                            <SelectItem value="1y">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-8 px-6 md:border-l border-slate-100 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <MiniStat
                        label="Total Spending"
                        value={`XAF ${(metrics?.totalSpending || 0).toLocaleString()}`}
                        trend={metrics?.spendingTrend}
                        trendUp
                    />
                    <MiniStat
                        label="Total Shipments"
                        value={metrics?.totalShipments.toString() || "0"}
                        trend={metrics?.shipmentTrend}
                        trendUp
                    />
                    <MiniStat
                        label="Avg Cost / Ship"
                        value={`XAF ${(metrics?.avgCostPerShipment || 0).toLocaleString()}`}
                    />
                    <MiniStat
                        label="Routes Active"
                        value={metrics?.activeRoutes.toString() || "0"}
                        trend={metrics?.routesTrend ? `+${metrics.routesTrend}` : undefined}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Card */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Spending Over Time</h3>
                            <p className="text-xs text-slate-400 font-medium">Monthly expenditure analysis across all active shipments</p>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-lg">
                            <Button size="sm" variant="ghost" className="h-8 rounded-md bg-white shadow-sm text-xs font-bold text-primary px-3">Bar</Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-md text-xs font-bold text-slate-400 px-3">Line</Button>
                        </div>
                    </div>

                    <div className="h-80 w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={spendingData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border-none">
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                                                        {payload[0].payload.month}
                                                    </p>
                                                    <p className="text-sm font-black">
                                                        XAF {Number(payload[0].value).toLocaleString()}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReBar
                                    dataKey="amount"
                                    fill="#0F172A"
                                    radius={[8, 8, 0, 0]}
                                    barSize={40}
                                >
                                    {spendingData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === spendingData.length - 1 ? '#2563eb' : '#e2e8f0'}
                                            className="hover:fill-primary transition-colors cursor-pointer"
                                        />
                                    ))}
                                </ReBar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Cost Breakdown */}
                <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
                    <h3 className="text-lg font-bold text-slate-900">Cost Breakdown</h3>

                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={costBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {costBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getHexColor(entry.color)} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                        {costBreakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-3 w-3 rounded-full", item.color)}></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{item.value}%</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                        <div className="p-4 bg-emerald-50/50 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingDown className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Your fuel costs have decreased by <span className="font-bold text-emerald-700">4.2%</span> due to transporter tier optimization.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Route Efficiency Table */}
                <div className="lg:col-span-3">
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Route Efficiency & Pricing</CardTitle>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-tight font-black">Performance audit across main digital corridors</p>
                            </div>
                            <Button variant="ghost" className="text-xs font-bold text-primary">View All Routes</Button>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Fulfillment Route</th>
                                        <th className="px-8 py-4">Volume (Tons)</th>
                                        <th className="px-8 py-4">Total Cost</th>
                                        <th className="px-8 py-4">Cost vs Benchmark</th>
                                        <th className="px-8 py-4 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {routeEfficiency.length > 0 ? routeEfficiency.map((route, idx) => (
                                        <RouteRow
                                            key={idx}
                                            origin={route.origin}
                                            dest={route.dest}
                                            volume={route.volume.toLocaleString()}
                                            cost={`XAF ${(route.cost).toLocaleString()}`}
                                            benchmark={`${route.benchmark > 0 ? '+' : ''}${route.benchmark}%`}
                                            benchmarkUp={route.benchmark > 0}
                                            trend={route.trend}
                                        />
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
                                                No historical route data available yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Transporter Performance Comparison */}
                <div className="lg:col-span-2">
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Transporter Performance</h3>
                                <p className="text-xs text-slate-400 font-medium">Comparing efficiency and reliability of your partner network</p>
                            </div>
                            <BarChart3 className="h-5 w-5 text-slate-300" />
                        </div>

                        <div className="space-y-4">
                            {transporters.map((t, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 text-sm border border-slate-100">
                                            {t.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 underline decoration-slate-200 group-hover:decoration-primary/30 transition-all">{t.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center text-[10px] font-bold text-slate-500">
                                                    <Star className="h-3 w-3 text-amber-400 mr-1 fill-amber-400" /> {t.rating}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {t.shipments} Shipments
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">On-Time</p>
                                            <p className="text-xs font-black text-emerald-600">{t.onTimeRate}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Avg Bid</p>
                                            <p className="text-xs font-black text-slate-900">XAF {(t.avgBid / 1000).toFixed(0)}k</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Cost Optimization Report */}
                <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg p-8 space-y-6">
                    <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Cost Optimization Report</h3>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                            Our AI analyzed your historical data and identified potential savings for the next quarter.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <OptimizationTip
                            icon={Truck}
                            title="Consolidated Shipments"
                            description="Bulk booking for Douala-Yaoundé could save ~15% on linehaul."
                            impact="Save XAF 1.2M"
                        />
                        <OptimizationTip
                            icon={Users}
                            title="Carrier Selection"
                            description="Global Logistics offers 8% better rates for Garaoua routes."
                            impact="Save XAF 450k"
                        />
                        <OptimizationTip
                            icon={Clock}
                            title="Bidding Window"
                            description="Starting auctions on Tuesdays yields 4.5 more bids on average."
                            impact="Lower Bids"
                        />
                    </div>

                    <Button className="w-full rounded-2xl h-12 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800 transition-all">
                        Generate Full Report
                    </Button>
                </Card>

                {/* Detailed Shipment History report */}
                <div className="lg:col-span-3">
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold">Shipment History Report</CardTitle>
                                <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-tight">Search and filter your complete shipment archive</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by ID, route, carrier..."
                                        className="pl-10 h-10 w-64 rounded-xl border-slate-200 focus-visible:ring-primary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" className="rounded-xl h-10 border-slate-200">
                                    <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                    Advanced
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">ID / Date</th>
                                        <th className="px-8 py-4">Carrier</th>
                                        <th className="px-8 py-4">Route</th>
                                        <th className="px-8 py-4">Freight Type</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <HistoryRow
                                        id="SHP-2849"
                                        date="24 Oct 2023"
                                        carrier="Global Logistics"
                                        route="Douala → Yaoundé"
                                        type="Dry Van"
                                        status="delivered"
                                        amount="XAF 125,000"
                                    />
                                    <HistoryRow
                                        id="SHP-2845"
                                        date="22 Oct 2023"
                                        carrier="Central Freight"
                                        route="Kribi → Douala"
                                        type="Reefer"
                                        status="delivered"
                                        amount="XAF 180,000"
                                    />
                                    <HistoryRow
                                        id="SHP-2842"
                                        date="20 Oct 2023"
                                        carrier="Express Movers"
                                        route="Bafoussam → Douala"
                                        type="Flatbed"
                                        status="cancelled"
                                        amount="XAF 0"
                                    />
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Automated Reports Configuration */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="h-24 w-24 bg-white/10 rounded-3xl flex items-center justify-center shrink-0">
                            <Mail className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-black text-white">Weekly Insights Delivered.</h3>
                            <p className="text-slate-400 mt-2 max-w-xl">
                                Stay on top of your logistics costs with automated summaries sent directly to your inbox every Monday morning.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="bg-white/5 p-2 rounded-2xl flex items-center gap-2 border border-white/10">
                                <Button variant="ghost" className="h-10 rounded-xl text-white font-bold text-xs hover:bg-white/10 px-4">Weekly</Button>
                                <Button className="h-10 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 px-4">Monthly</Button>
                            </div>
                            <Button className="h-12 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure Reports
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, trend, trendUp }: any) {
    return (
        <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 ">{value}</span>
                {trend && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

function OptimizationTip({ icon: Icon, title, description, impact }: any) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 border border-white shadow-sm">
            <div className="h-8 w-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-slate-600" />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-black text-slate-900">{title}</p>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{impact}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{description}</p>
            </div>
        </div>
    );
}

function RouteRow({ origin, dest, volume, cost, benchmark, benchmarkUp, trend }: any) {
    return (
        <tr className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{origin} → {dest}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Main Fulfillment Corridor</span>
                    </div>
                </div>
            </td>
            <td className="px-8 text-xs font-bold text-slate-700">{volume}</td>
            <td className="px-8 text-xs font-black text-slate-900">{cost}</td>
            <td className="px-8">
                <Badge variant="outline" className={cn("rounded-lg border-none px-3 py-1 text-[10px] font-black uppercase tracking-tight", benchmarkUp ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                    {benchmarkUp ? <ArrowUpRight className="h-3 w-3 mr-1 inline" /> : <ArrowDownRight className="h-3 w-3 mr-1 inline" />}
                    {benchmark} vs Avg
                </Badge>
            </td>
            <td className="px-8 text-right">
                <div className="flex items-center justify-end gap-1 text-xs font-black text-slate-900 uppercase tracking-tighter">
                    {trend?.startsWith("+") ? <TrendingUp className="h-3 w-3 text-rose-500" /> : <TrendingDown className="h-3 w-3 text-emerald-500" />}
                    {trend}
                </div>
            </td>
        </tr>
    );
}

function HistoryRow({ id, date, carrier, route, type, status, amount }: any) {
    return (
        <tr className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-8 py-5">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">{id}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{date}</span>
                </div>
            </td>
            <td className="px-8">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {carrier[0]}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{carrier}</span>
                </div>
            </td>
            <td className="px-8 text-xs font-bold text-slate-600">{route}</td>
            <td className="px-8 text-xs font-medium text-slate-400">{type}</td>
            <td className="px-8">
                <Badge className={cn(
                    "rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                    status === 'delivered' ? "bg-emerald-50 text-emerald-600" :
                        status === 'cancelled' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                )}>
                    {status}
                </Badge>
            </td>
            <td className="px-8 text-right text-xs font-black text-slate-900">{amount}</td>
        </tr>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-32 rounded-xl" />
                    <Skeleton className="h-11 w-40 rounded-xl" />
                </div>
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="lg:col-span-2 h-[450px] rounded-3xl" />
                <Skeleton className="h-[450px] rounded-3xl" />
                <Skeleton className="lg:col-span-3 h-64 rounded-3xl" />
            </div>
        </div>
    );
}

function getHexColor(bgClass: string) {
    if (bgClass.includes('primary')) return '#0F172A';
    if (bgClass.includes('blue-400')) return '#60a5fa';
    if (bgClass.includes('indigo-400')) return '#818cf8';
    if (bgClass.includes('slate-200')) return '#e2e8f0';
    return '#000';
}
