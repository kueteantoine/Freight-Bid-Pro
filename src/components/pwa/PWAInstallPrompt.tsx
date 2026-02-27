"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const t = useTranslations("PWA");

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Check if user has already dismissed it in this session
            const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
            if (!isDismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500 sm:left-auto sm:right-6 sm:w-96">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl shadow-blue-900/40 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2">
                    <button
                        onClick={handleDismiss}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex items-start gap-4">
                    <div className="bg-blue-600/20 p-3 rounded-xl text-blue-500">
                        <Download size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{t("installTitle")}</h3>
                        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                            {t("installDescription")}
                        </p>
                        <button
                            onClick={handleInstall}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            {t("installButton")}
                        </button>
                    </div>
                </div>

                {/* Subtle glass effect accent */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />
            </div>
        </div>
    );
}
