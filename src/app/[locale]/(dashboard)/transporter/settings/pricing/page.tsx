import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { PricingRulesTable } from "@/components/transporter/settings/pricing-rules-table";
import { getPricingRules } from "@/app/actions/carrier-settings-actions";

export default async function PricingRulesPage() {
    const rules = await getPricingRules();

    return (
        <CarrierSettingsLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">Pricing Configuration</h2>
                    <p className="text-sm text-muted-foreground">
                        Set up base rates for different freight types. These rules are used to calculate automated bids.
                    </p>
                </div>
                <PricingRulesTable initialRules={rules || []} />
            </div>
        </CarrierSettingsLayout>
    );
}
