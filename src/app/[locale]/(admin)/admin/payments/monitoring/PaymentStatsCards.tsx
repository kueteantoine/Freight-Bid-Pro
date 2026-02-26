"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PaymentStatsCardsProps {
    stats: {
        total_transactions: number;
        completed_transactions: number;
        failed_transactions: number;
        pending_transactions: number;
        total_transaction_value: number;
        success_rate_percentage: number;
    };
}

export default function PaymentStatsCards({ stats }: PaymentStatsCardsProps) {
    const cards = [
        {
            title: "Total Transactions",
            value: stats.total_transactions.toLocaleString(),
            icon: TrendingUp,
            color: "text-blue-600"
        },
        {
            title: "Completed",
            value: stats.completed_transactions.toLocaleString(),
            icon: CheckCircle2,
            color: "text-green-600"
        },
        {
            title: "Failed",
            value: stats.failed_transactions.toLocaleString(),
            icon: XCircle,
            color: "text-red-600"
        },
        {
            title: "Pending",
            value: stats.pending_transactions.toLocaleString(),
            icon: Clock,
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
                        Success Rate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold">
                            {stats.success_rate_percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total Value: {stats.total_transaction_value.toLocaleString()} XAF
                        </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${stats.success_rate_percentage}%` }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
