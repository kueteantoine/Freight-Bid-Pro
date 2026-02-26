import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { PricingRulesTable } from "@/components/transporter/settings/pricing-rules-table";
import { getPricingRules } from "@/app/actions/carrier-settings-actions";
import { getTranslations } from "next-intl/server";

export default async function PricingRulesPage({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'transporterSubPages' });
    const rules = await getPricingRules();

    return (
        <CarrierSettingsLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">{t("pricingSettings")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("pricingConfigurationDesc")}
                    </p>
                </div>
                <PricingRulesTable initialRules={rules || []} />
            </div>
        </CarrierSettingsLayout>
    );
}
