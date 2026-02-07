"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Percent } from "lucide-react";

interface RevenueSummaryCardsProps {
    summary: {
        total_transactions: number;
        total_platform_commission: number;
        total_aggregator_fees: number;
        total_mobile_money_fees: number;
        total_platform_revenue: number;
        average_transaction_value: number;
    };
}

export default function RevenueSummaryCards({ summary }: RevenueSummaryCardsProps) {
    const cards = [
        {
            title: "Total Platform Revenue",
            value: `${summary.total_platform_revenue.toLocaleString()} XAF`,
            icon: DollarSign,
            color: "text-green-600"
        },
        {
            title: "Platform Commission",
            value: `${summary.total_platform_commission.toLocaleString()} XAF`,
            icon: TrendingUp,
            color: "text-blue-600"
        },
        {
            title: "Aggregator Fees",
            value: `${summary.total_aggregator_fees.toLocaleString()} XAF`,
            icon: Percent,
            color: "text-purple-600"
        },
        {
            title: "Mobile Money Fees",
            value: `${summary.total_mobile_money_fees.toLocaleString()} XAF`,
            icon: Percent,
            color: "text-orange-600"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                );
            })}

            <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Transaction Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Transactions</p>
                            <p className="text-2xl font-bold">{summary.total_transactions.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Average Transaction Value</p>
                            <p className="text-2xl font-bold">{summary.average_transaction_value.toLocaleString()} XAF</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
