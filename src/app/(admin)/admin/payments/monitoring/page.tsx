import { Metadata } from "next";
import { getPaymentFlowStats, getRecentTransactions } from "@/app/actions/admin-payment-actions";
import PaymentStatsCards from "./PaymentStatsCards";
import RecentTransactionsTable from "./RecentTransactionsTable";

export const metadata: Metadata = {
    title: "Payment Monitoring | Admin",
    description: "Real-time payment flow statistics"
};

export default async function MonitoringPage() {
    const stats = await getPaymentFlowStats();
    const recentTransactions = await getRecentTransactions({ limit: 20 });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payment Monitoring</h1>
                <p className="text-muted-foreground mt-2">
                    Real-time payment flow statistics and transaction tracking
                </p>
            </div>

            <PaymentStatsCards stats={stats} />

            <RecentTransactionsTable transactions={recentTransactions} />
        </div>
    );
}
