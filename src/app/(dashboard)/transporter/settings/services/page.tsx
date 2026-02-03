import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { ServiceConfigForm } from "@/components/transporter/settings/service-config-form";
import { getServiceOfferings } from "@/app/actions/carrier-settings-actions";

export default async function ServiceConfigPage() {
    const serviceOfferings = await getServiceOfferings();

    return (
        <CarrierSettingsLayout>
            <ServiceConfigForm initialData={serviceOfferings} />
        </CarrierSettingsLayout>
    );
}
