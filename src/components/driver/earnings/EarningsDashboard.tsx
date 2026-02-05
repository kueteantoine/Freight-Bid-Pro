"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Clock,
    ChevronRight,
    Award
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EarningsDashboardProps {
    summary: {
        today: number;
        week_to_date: number;
        month_to_date: number;
        pending: number;
        total_lifetime: number;
    };
    projections: {
        estimated_monthly: number;
        estimated_weekly: number;
        daily_average: number;
    };
    onViewHistory: () => void;
    onViewIncentives: () => void;
}

export const EarningsDashboard: React.FC<EarningsDashboardProps> = ({
    summary,
    projections,
    onViewHistory,
    onViewIncentives
}) => {
    return (
        <div className="space-y-6 pb-20">
            {/* Main Balance / Today's Earnings */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-sm font-medium opacity-90">Today's Earnings</p>
                    <h2 className="text-4xl font-bold mt-1">{formatCurrency(summary.today)}</h2>
                    <div className="flex justify-between items-center mt-6">
                        <div>
                            <p className="text-xs opacity-75">Pending Payout</p>
                            <p className="text-lg font-semibold">{formatCurrency(summary.pending)}</p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full bg-white/20 hover:bg-white/30 border-none text-white text-xs"
                            onClick={onViewHistory}
                        >
                            View History
                        </Button>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top--10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom--10 -left-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl"></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-2xl border-none shadow-sm bg-accent/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">This Week</span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(summary.week_to_date)}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-accent/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">This Month</span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(summary.month_to_date)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Projections Section */}
            <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Earnings Projections
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl">
                        <span className="text-xs text-muted-foreground">Est. Monthly</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(projections.estimated_monthly)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl">
                        <span className="text-xs text-muted-foreground">Est. Weekly</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(projections.estimated_weekly)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Incentives / Bonuses Shortcut */}
            <div
                className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-2xl flex items-center justify-between border border-orange-100 dark:border-orange-900/50 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
                onClick={onViewIncentives}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Bonus Progress</p>
                        <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Check your target goals</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400" />
            </div>

            {/* Lifetime Summary */}
            <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground">Lifetime Earnings</p>
                <p className="text-2xl font-black text-primary/40">{formatCurrency(summary.total_lifetime)}</p>
            </div>
        </div>
    );
};
