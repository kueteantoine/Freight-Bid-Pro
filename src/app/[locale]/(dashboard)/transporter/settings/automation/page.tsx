import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { BidAutomationForm } from "@/components/transporter/settings/bid-automation-form";
import { getBidAutomationSettings } from "@/app/actions/carrier-settings-actions";
import { getTranslations } from "next-intl/server";

export default async function BidAutomationPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'transporterSubPages' });
    const settings = await getBidAutomationSettings();

    return (
        <CarrierSettingsLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">{t("automationSettings")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("automatedBiddingDesc")}
                    </p>
                </div>
                <BidAutomationForm initialSettings={settings} />
            </div>
        </CarrierSettingsLayout>
    );
}
