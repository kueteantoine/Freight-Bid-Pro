import { Metadata } from "next";
import { getPaymentAggregatorConfigs } from "@/app/actions/admin-payment-actions";
import AggregatorConfigCard from "./AggregatorConfigCard";

export const metadata: Metadata = {
    title: "Payment Aggregators | Admin",
    description: "Configure mobile payment providers"
};

export default async function AggregatorsPage() {
    const aggregators = await getPaymentAggregatorConfigs();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payment Aggregators</h1>
                <p className="text-muted-foreground mt-2">
                    Configure mobile payment providers, API credentials, and fee structures
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {aggregators.map((aggregator) => (
                    <AggregatorConfigCard
                        key={aggregator.id}
                        aggregator={aggregator}
                    />
                ))}
            </div>
        </div>
    );
}
