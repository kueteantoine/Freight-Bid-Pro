import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { BidAutomationForm } from "@/components/transporter/settings/bid-automation-form";
import { getBidAutomationSettings } from "@/app/actions/carrier-settings-actions";

export default async function BidAutomationPage() {
    const settings = await getBidAutomationSettings();

    return (
        <CarrierSettingsLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">Automated Bidding</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure how your AI agent should bid on matching loads when you are offline.
                    </p>
                </div>
                <BidAutomationForm initialSettings={settings} />
            </div>
        </CarrierSettingsLayout>
    );
}
