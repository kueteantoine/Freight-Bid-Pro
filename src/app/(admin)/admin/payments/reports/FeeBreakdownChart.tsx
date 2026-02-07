"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeeBreakdownChartProps {
    data: {
        totals: {
            totalCommission: number;
            totalAggregatorFees: number;
            totalMobileMoneyFees: number;
        };
    };
}

export default function FeeBreakdownChart({ data }: FeeBreakdownChartProps) {
    const total = data.totals.totalCommission + data.totals.totalAggregatorFees + data.totals.totalMobileMoneyFees;

    const segments = [
        {
            label: "Platform Commission",
            value: data.totals.totalCommission,
            percentage: total > 0 ? (data.totals.totalCommission / total) * 100 : 0,
            color: "bg-blue-500"
        },
        {
            label: "Aggregator Fees",
            value: data.totals.totalAggregatorFees,
            percentage: total > 0 ? (data.totals.totalAggregatorFees / total) * 100 : 0,
            color: "bg-purple-500"
        },
        {
            label: "Mobile Money Fees",
            value: data.totals.totalMobileMoneyFees,
            percentage: total > 0 ? (data.totals.totalMobileMoneyFees / total) * 100 : 0,
            color: "bg-orange-500"
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fee Collection Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex h-8 rounded-full overflow-hidden">
                        {segments.map((segment, idx) => (
                            <div
                                key={idx}
                                className={segment.color}
                                style={{ width: `${segment.percentage}%` }}
                                title={`${segment.label}: ${segment.percentage.toFixed(1)}%`}
                            />
                        ))}
                    </div>

                    <div className="space-y-3">
                        {segments.map((segment, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                                    <span className="text-sm font-medium">{segment.label}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">
                                        {segment.value.toLocaleString()} XAF
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {segment.percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t">
                        <div className="flex justify-between">
                            <span className="font-semibold">Total Fees Collected</span>
                            <span className="font-bold">{total.toLocaleString()} XAF</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
