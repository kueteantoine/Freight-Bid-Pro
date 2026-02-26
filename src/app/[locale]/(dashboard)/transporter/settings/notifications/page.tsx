import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { NotificationPrefsForm } from "@/components/transporter/settings/notification-prefs-form";
import { getNotificationSettings } from "@/app/actions/carrier-settings-actions";
import { getTranslations } from "next-intl/server";

export default async function NotificationSettingsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'transporterSubPages' });
    const settings = await getNotificationSettings();

    return (
        <CarrierSettingsLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">{t("notificationsSettings")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("notificationsDesc")}
                    </p>
                </div>
                <NotificationPrefsForm initialSettings={settings} />
            </div>
        </CarrierSettingsLayout>
    );
}
