"use client";

import React, { useState, useEffect } from "react";
import {
    getDriverEarningsSummary,
    getDriverPaymentHistory,
    getIncentiveProgress,
    getEarningsProjections,
    EarningsSummary
} from "@/app/actions/driver-earnings-actions";
import { EarningsDashboard } from "@/components/driver/earnings/EarningsDashboard";
import { PaymentHistory } from "@/components/driver/earnings/PaymentHistory";
import { TripEarningsBreakdown } from "@/components/driver/earnings/TripEarningsBreakdown";
import { IncentiveProgress } from "@/components/driver/earnings/IncentiveProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function DriverEarningsPage() {
    const [view, setView] = useState<"dashboard" | "history" | "breakdown" | "incentives">("dashboard");
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<EarningsSummary | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [incentives, setIncentives] = useState<any[]>([]);
    const [projections, setProjections] = useState<any>(null);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sum, hist, inc, proj] = await Promise.all([
                getDriverEarningsSummary(),
                getDriverPaymentHistory(),
                getIncentiveProgress(),
                getEarningsProjections()
            ]);

            setSummary(sum);
            setHistory(hist.data || []);
            setIncentives(inc || []);
            setProjections(proj);
        } catch (error) {
            console.error("Failed to load earnings data:", error);
            toast.error("Failed to load your earnings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-40 w-full rounded-3xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-6 h-full max-w-md mx-auto">
            {view === "dashboard" && summary && projections && (
                <EarningsDashboard
                    summary={summary}
                    projections={projections}
                    onViewHistory={() => setView("history")}
                    onViewIncentives={() => setView("incentives")}
                />
            )}

            {view === "history" && (
                <PaymentHistory
                    payments={history}
                    onBack={() => setView("dashboard")}
                    onSelectPayment={(p) => {
                        setSelectedPayment(p);
                        setView("breakdown");
                    }}
                />
            )}

            {view === "breakdown" && selectedPayment && (
                <TripEarningsBreakdown
                    payment={selectedPayment}
                    onBack={() => setView("history")}
                />
            )}

            {view === "incentives" && (
                <IncentiveProgress
                    incentives={incentives}
                    onBack={() => setView("dashboard")}
                />
            )}
        </div>
    );
}
