import { CarrierSettingsLayout } from "@/components/transporter/settings/settings-layout";
import { NotificationPrefsForm } from "@/components/transporter/settings/notification-prefs-form";
import { getNotificationSettings } from "@/app/actions/carrier-settings-actions";

export default async function NotificationSettingsPage() {
    const settings = await getNotificationSettings();

    return (
        <CarrierSettingsLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">Notifications</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your communication preferences and alert settings.
                    </p>
                </div>
                <NotificationPrefsForm initialSettings={settings} />
            </div>
        </CarrierSettingsLayout>
    );
}
