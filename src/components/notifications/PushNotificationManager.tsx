'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PushNotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (!('Notification' in window)) {
            setIsSupported(false);
            return;
        }
        setPermission(Notification.permission);
    }, []);

    const requestPermission = async () => {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast.success('Push notifications enabled!');
                // Here you would typically register a service worker and send the subscription to the backend
                console.log('Push subscription logic would go here');
            } else if (result === 'denied') {
                toast.error('Notifications were denied. You can re-enable them in browser settings.');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {permission === 'granted' ? (
                        <BellRing className="h-5 w-5 text-primary" />
                    ) : permission === 'denied' ? (
                        <BellOff className="h-5 w-5 text-destructive" />
                    ) : (
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                        <h4 className="text-sm font-medium">Browser Notifications</h4>
                        <p className="text-xs text-muted-foreground">
                            {permission === 'granted'
                                ? 'You are receiving real-time alerts in your browser.'
                                : permission === 'denied'
                                    ? 'Notifications are blocked. Check browser settings to allow.'
                                    : 'Enable browser notifications for real-time updates.'}
                        </p>
                    </div>
                </div>
                <Button
                    variant={permission === 'granted' ? "outline" : "default"}
                    size="sm"
                    disabled={permission === 'granted' || permission === 'denied' || isLoading}
                    onClick={requestPermission}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Enable'}
                </Button>
            </div>
        </div>
    );
}
