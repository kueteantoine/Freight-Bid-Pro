"use client";

import { useState, useEffect } from "react";

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
            setIsSupported(true);
            setPermission(Notification.permission);

            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((sub) => {
                    setSubscription(sub);
                });
            });
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) return "default";

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    };

    const subscribeUser = async (vapidPublicKey: string) => {
        if (!isSupported) return null;

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            setSubscription(sub);
            return sub;
        } catch (error) {
            console.error("Failed to subscribe to push notifications:", error);
            return null;
        }
    };

    const unsubscribeUser = async () => {
        if (!subscription) return true;

        try {
            await subscription.unsubscribe();
            setSubscription(null);
            return true;
        } catch (error) {
            console.error("Failed to unsubscribe from push notifications:", error);
            return false;
        }
    };

    return {
        permission,
        isSupported,
        subscription,
        requestPermission,
        subscribeUser,
        unsubscribeUser,
    };
}

// Helper function
function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
