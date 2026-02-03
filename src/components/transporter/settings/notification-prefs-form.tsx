"use client";

import { useState } from "react";
import { CarrierNotificationSettings } from "@/lib/types/database";
import { updateNotificationSettings } from "@/app/actions/carrier-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare, Bell } from "lucide-react";

interface NotificationPrefsFormProps {
    initialSettings: CarrierNotificationSettings;
}

const NOTIFICATION_TYPES = [
    { id: "new_load_match", label: "New Load Matches", description: "When a new load matches your saved searches or preferences." },
    { id: "bid_outbid", label: "Outbid Alerts", description: "When another carrier outbids you on an active shipment." },
    { id: "bid_awarded", label: "Bid Won / Awarded", description: "When a shipper accepts your bid." },
    { id: "shipment_updates", label: "Shipment Status Updates", description: "Changes to shipment status (e.g. delivered, cancelled)." },
    { id: "payment_received", label: "Payment Received", description: "When funds are released to your wallet." },
    { id: "driver_alerts", label: "Driver Alerts", description: "Emergency alerts or issues reported by your drivers." },
];

export function NotificationPrefsForm({ initialSettings }: NotificationPrefsFormProps) {
    const [loading, setLoading] = useState(false);

    // Default structure if preferences is empty
    const defaultPrefs = {
        email: true,
        sms: false,
        push: true,
        types: NOTIFICATION_TYPES.reduce((acc, t) => ({ ...acc, [t.id]: true }), {})
    };

    const [prefs, setPrefs] = useState<any>(initialSettings?.preferences || defaultPrefs);

    const handleChannelToggle = (channel: string) => {
        setPrefs((prev: any) => ({
            ...prev,
            [channel]: !prev[channel]
        }));
    };

    const handleTypeToggle = (typeId: string) => {
        setPrefs((prev: any) => ({
            ...prev,
            types: {
                ...prev.types,
                [typeId]: !prev.types?.[typeId]
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateNotificationSettings(prefs);
            toast.success("Notification preferences updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update preferences");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Control how and when we contact you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Communication Channels</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <span>Email</span>
                                </div>
                                <Switch
                                    checked={prefs.email}
                                    onCheckedChange={() => handleChannelToggle("email")}
                                />
                            </div>
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                    <span>SMS</span>
                                </div>
                                <Switch
                                    checked={prefs.sms}
                                    onCheckedChange={() => handleChannelToggle("sms")}
                                />
                            </div>
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    <span>Push Notifications</span>
                                </div>
                                <Switch
                                    checked={prefs.push}
                                    onCheckedChange={() => handleChannelToggle("push")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Alert Types</Label>
                        <div className="space-y-4">
                            {NOTIFICATION_TYPES.map((type) => (
                                <div key={type.id} className="flex items-start justify-between space-x-4">
                                    <div>
                                        <Label htmlFor={type.id} className="font-medium text-sm">
                                            {type.label}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {type.description}
                                        </p>
                                    </div>
                                    <Switch
                                        id={type.id}
                                        checked={prefs.types?.[type.id] ?? true}
                                        onCheckedChange={() => handleTypeToggle(type.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Preferences
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
