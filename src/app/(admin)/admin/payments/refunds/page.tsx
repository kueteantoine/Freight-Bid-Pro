import { Metadata } from "next";
import { getPendingRefundRequests } from "@/app/actions/admin-payment-actions";
import RefundRequestCard from "./RefundRequestCard";

export const metadata: Metadata = {
    title: "Refund Processing | Admin",
    description: "Review and process refund requests"
};

export default async function RefundsPage() {
    const pendingRefunds = await getPendingRefundRequests();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Refund Processing</h1>
                <p className="text-muted-foreground mt-2">
                    Review and process refund requests from users
                </p>
            </div>

            {pendingRefunds.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">No pending refund requests</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingRefunds.map((refund) => (
                        <RefundRequestCard key={refund.id} refund={refund} />
                    ))}
                </div>
            )}
        </div>
    );
}
