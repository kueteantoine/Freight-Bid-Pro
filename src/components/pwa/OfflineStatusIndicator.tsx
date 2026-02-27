"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useTranslations } from "next-intl";

export default function OfflineStatusIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showNotification, setShowNotification] = useState(false);
    const t = useTranslations("PWA");

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!showNotification && isOnline) return null;

    return (
        <div className={`fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300`}>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md ${isOnline
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                }`}>
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="text-sm font-semibold">
                    {isOnline ? t("backOnline") : t("workingOffline")}
                </span>
            </div>
        </div>
    );
}
