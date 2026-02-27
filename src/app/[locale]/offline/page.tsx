import { WifiOff, Home } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function OfflinePage() {
    const t = useTranslations("Offline");

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50 p-6 text-center">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                <WifiOff size={80} className="relative text-blue-500" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-4">
                {t("title")}
            </h1>

            <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed">
                {t("description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                >
                    <Home size={20} />
                    {t("goHome")}
                </Link>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 border border-slate-700"
                >
                    {t("retry")}
                </button>
            </div>

            <div className="mt-16 text-slate-500 text-sm">
                <p>Freight Bid Pro • Offline Mode</p>
            </div>
        </div>
    );
}
