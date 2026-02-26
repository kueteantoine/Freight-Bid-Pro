"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    Clock,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Wallet
} from 'lucide-react';

interface FinancialStats {
    gross_earnings: number;
    net_earnings: number;
    pending_payments: number;
    total_commissions: number;
    total_aggregator_fees: number;
    total_mobile_fees: number;
    balance: number;
}

interface FinancialDashboardProps {
    stats: FinancialStats;
    revenueData?: any[]; // For chart
}

export default function FinancialDashboard({ stats, revenueData = [] }: FinancialDashboardProps) {
    const { convert, format } = useCurrency();

    return (
        <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Net Earnings</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{format(convert(stats.net_earnings))}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{format(convert(stats.pending_payments))}</div>
                        <p className="text-xs text-muted-foreground">
                            Processing typically takes 24h
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commissions Paid</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{format(convert(stats.total_commissions))}</div>
                        <p className="text-xs text-muted-foreground">
                            5% platform fee
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mobile Money Fees</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{format(convert(stats.total_mobile_fees + stats.total_aggregator_fees))}</div>
                        <p className="text-xs text-muted-foreground">
                            MoMo & Aggregator fees
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Trend Chart */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            {revenueData && revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                            tickFormatter={(value) => `${value / 1000}k`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(value: number) => [format(convert(value)), 'Revenue']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    No revenue data available for chart
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Fee Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                                <div className="flex-1 text-sm font-medium">Net Earnings</div>
                                <div className="text-sm text-emerald-600 font-bold">
                                    {((stats.net_earnings / (stats.gross_earnings || 1)) * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                                <div className="flex-1 text-sm font-medium">Platform Commission</div>
                                <div className="text-sm font-mono">5.0%</div>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-orange-500 mr-2" />
                                <div className="flex-1 text-sm font-medium">Aggregator Fees</div>
                                <div className="text-sm font-mono">1.5%</div>
                            </div>
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                                <div className="flex-1 text-sm font-medium">Mobile Money Fees</div>
                                <div className="text-sm font-mono">1.0%</div>
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <div className="text-xs text-muted-foreground mb-2">Total Efficiency</div>
                                <div className="text-2xl font-bold">
                                    {(stats.gross_earnings > 0 ? (stats.net_earnings / stats.gross_earnings * 100).toFixed(1) : 0)}%
                                </div>
                                <p className="text-xs text-muted-foreground">Of gross bid amount reaches your wallet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
