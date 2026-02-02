"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    TrendingUp,
    Target,
    Award,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export function BiddingAnalyticsPanel() {
    // Mock data for analytics
    const stats = {
        winRate: 68,
        avgSavings: "12%",
        totalAwarded: "CFA 4.2M",
        activeBids: 12,
        responseTime: "14 mins"
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Win Rate"
                    value={`${stats.winRate}%`}
                    icon={<Award className="h-5 w-5 text-emerald-500" />}
                    trend="+5% from last month"
                    trendUp={true}
                />
                <StatCard
                    title="Avg. Bid Spread"
                    value={stats.avgSavings}
                    icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
                    trend="-2% vs market"
                    trendUp={false}
                />
                <StatCard
                    title="Awarded Volume"
                    value={stats.totalAwarded}
                    icon={<Target className="h-5 w-5 text-primary" />}
                    trend="+12k this week"
                    trendUp={true}
                />
                <StatCard
                    title="Response Time"
                    value={stats.responseTime}
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                    trend="Top 10% of carriers"
                    trendUp={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart Placeholder */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Bid Competitiveness</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Market Benchmark Analysis</p>
                            </div>
                            <Badge variant="outline" className="rounded-lg border-slate-100 font-bold">Last 30 Days</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[300px] w-full bg-slate-50 rounded-3xl flex items-end justify-between p-8 gap-4">
                            {[60, 45, 80, 55, 90, 70, 85].map((h, i) => (
                                <div key={i} className="flex-1 space-y-3">
                                    <div
                                        className={cn(
                                            "w-full rounded-t-xl transition-all duration-1000",
                                            i === 4 ? "bg-primary" : "bg-slate-200"
                                        )}
                                        style={{ height: `${h}%` }}
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase">W{i + 1}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Routes Panel */}
                <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Top Routes</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High Success Corridors</p>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <RouteItem origin="Douala" dest="Yaoundé" wins={24} rate={85} />
                        <RouteItem origin="Kribi" dest="Douala" wins={18} rate={72} />
                        <RouteItem origin="Douala" dest="N'Djamena" wins={12} rate={64} />
                        <RouteItem origin="Yaoundé" dest="Garoua" wins={9} rate={58} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp }: any) {
    return (
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        {icon}
                    </div>
                    {trendUp ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                </div>
                <p className={cn(
                    "text-[10px] font-bold mt-2",
                    trendUp ? "text-emerald-600" : "text-rose-600"
                )}>
                    {trend}
                </p>
            </CardContent>
        </Card>
    );
}

function RouteItem({ origin, dest, wins, rate }: any) {
    return (
        <div className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 -mx-4 px-4 py-2 rounded-2xl transition-all">
            <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{origin} → {dest}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {wins} shipments awarded
                </p>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-primary">{rate}%</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase">Win Rate</p>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
