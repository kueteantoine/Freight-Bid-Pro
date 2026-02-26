import { Metadata } from "next";
import { getPlatformRevenueSummary, getRevenueByRoute, getFeeCollectionBreakdown } from "@/app/actions/admin-payment-actions";
import RevenueSummaryCards from "./RevenueSummaryCards";
import RevenueByRouteChart from "./RevenueByRouteChart";
import FeeBreakdownChart from "./FeeBreakdownChart";

export const metadata: Metadata = {
    title: "Financial Reports | Admin",
    description: "Platform revenue and fee analytics"
};

export default async function ReportsPage() {
    const revenueSummary = await getPlatformRevenueSummary();
    const revenueByRoute = await getRevenueByRoute();
    const feeBreakdown = await getFeeCollectionBreakdown();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Reports</h1>
                <p className="text-muted-foreground mt-2">
                    Platform commission revenue, fee collection analysis, and profit margins
                </p>
            </div>

            <RevenueSummaryCards summary={revenueSummary} />

            <div className="grid gap-6 md:grid-cols-2">
                <RevenueByRouteChart data={revenueByRoute} />
                <FeeBreakdownChart data={feeBreakdown} />
            </div>
        </div>
    );
}
