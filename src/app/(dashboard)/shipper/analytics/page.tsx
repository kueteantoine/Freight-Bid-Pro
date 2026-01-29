"use client";

import React from "react";
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
    PieChart as PieChartIcon
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
import { cn } from "@/lib/utils";

export default function ShipperAnalyticsPage() {
    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Spending Analytics</h2>
                    <p className="text-slate-500 mt-1">
                        Analyze your freight costs, transporter performance, and route efficiency.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200">
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
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <Select defaultValue="6m">
                        <SelectTrigger className="w-48 border-none bg-transparent font-bold text-slate-700">
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
                <div className="flex gap-8 px-6 border-l border-slate-100 hidden md:flex">
                    <MiniStat label="Total Spending" value="XAF 22.4M" trend="+12.5%" trendUp />
                    <MiniStat label="Routes Active" value="12" trend="-2" />
                    <MiniStat label="Avg. Cost/KM" value="XAF 320" trend="+XAF 15" trendUp={false} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Card */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Spending Over Time</h3>
                            <p className="text-xs text-slate-400 font-medium">Monthly expenditure analysis across all regions</p>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-lg">
                            <Button size="sm" variant="ghost" className="h-8 rounded-md bg-white shadow-sm text-xs font-bold text-primary px-3">Bar</Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-md text-xs font-bold text-slate-400 px-3">Line</Button>
                        </div>
                    </div>

                    <div className="h-80 flex items-end gap-3 pt-10">
                        <Bar height="40%" label="May" />
                        <Bar height="60%" label="Jun" />
                        <Bar height="55%" label="Jul" />
                        <Bar height="75%" label="Aug" active />
                        <Bar height="65%" label="Sep" />
                        <Bar height="85%" label="Oct" />
                    </div>
                </Card>

                {/* Cost Breakdown */}
                <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 space-y-8">
                    <h3 className="text-lg font-bold text-slate-900">Cost Breakdown</h3>
                    <div className="space-y-6">
                        <BreakdownItem label="Linehaul Charges" value="72%" color="bg-primary" />
                        <BreakdownItem label="Fuel Surcharges" value="18%" color="bg-blue-400" />
                        <BreakdownItem label="Handling Fees" value="7%" color="bg-indigo-400" />
                        <BreakdownItem label="Insurance & Taxes" value="3%" color="bg-slate-200" />
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-emerald-500" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Your fuel costs have decreased by <span className="font-bold text-emerald-600">4.2%</span> due to transporter tier optimization.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Route Efficiency Table */}
                <div className="lg:col-span-3">
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-100">
                            <CardTitle className="text-lg font-bold">Route Efficiency & Pricing</CardTitle>
                        </CardHeader>
                        <div className="p-0">
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
                                    <RouteRow
                                        origin="Douala"
                                        dest="Yaoundé"
                                        volume="1,450"
                                        cost="XAF 8.2M"
                                        benchmark="-12%"
                                        benchmarkUp={false}
                                        trend="+4.2%"
                                    />
                                    <RouteRow
                                        origin="Kribi"
                                        dest="Bafoussam"
                                        volume="840"
                                        cost="XAF 6.4M"
                                        benchmark="+5%"
                                        benchmarkUp={true}
                                        trend="-1.5%"
                                    />
                                    <RouteRow
                                        origin="Douala"
                                        dest="Garoua"
                                        volume="520"
                                        cost="XAF 12.1M"
                                        benchmark="-2%"
                                        benchmarkUp={false}
                                        trend="+8.9%"
                                    />
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, trend, trendUp }: any) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">{value}</span>
                {trend && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

function Bar({ height, label, active }: any) {
    return (
        <div className="flex-1 flex flex-col items-center gap-4 group">
            <div className="w-full flex items-end justify-center h-full relative">
                <div
                    className={cn(
                        "w-full max-w-[40px] rounded-t-xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/20",
                        active ? "bg-primary" : "bg-slate-100 hover:bg-slate-200"
                    )}
                    style={{ height }}
                ></div>
                <div className="absolute -top-8 text-[11px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    XAF {Math.floor(Math.random() * 5) + 1}M
                </div>
            </div>
            <span className={cn("text-xs font-bold", active ? "text-primary" : "text-slate-400")}>{label}</span>
        </div>
    );
}

function BreakdownItem({ label, value, color }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-tighter">{label}</span>
                <span className="text-slate-900">{value}</span>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: value }}></div>
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
                        <span className="text-sm font-bold text-slate-900">{origin} → {dest}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Main Digital Corridor</span>
                    </div>
                </div>
            </td>
            <td className="px-8 text-sm font-bold text-slate-700">{volume}</td>
            <td className="px-8 text-sm font-black text-slate-900">{cost}</td>
            <td className="px-8">
                <Badge variant="outline" className={cn("rounded-lg border-none px-3 py-1 text-[10px] font-bold", benchmarkUp ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                    {benchmarkUp ? <ArrowUpRight className="h-3 w-3 mr-1 inline" /> : <ArrowDownRight className="h-3 w-3 mr-1 inline" />}
                    {benchmark} vs Avg
                </Badge>
            </td>
            <td className="px-8 text-right">
                <div className="flex items-center justify-end gap-1 text-xs font-black text-slate-900">
                    {trend.startsWith("+") ? <TrendingUp className="h-3 w-3 text-rose-500" /> : <TrendingDown className="h-3 w-3 text-emerald-500" />}
                    {trend}
                </div>
            </td>
        </tr>
    );
}
