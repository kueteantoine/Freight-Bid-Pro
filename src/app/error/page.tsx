"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason");

    const isRedirectLoop = reason === "redirect_loop";

    const clearAndLogin = async () => {
        // Use proper logout API instead of manual cookie clearing
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 mb-8 border border-rose-100">
                    <AlertTriangle className="h-10 w-10 text-rose-500" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                    {isRedirectLoop ? "Connection Loop Detected" : "Something went wrong"}
                </h1>

                <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                    {isRedirectLoop
                        ? "We noticed you were being redirected too many times. This usually happens when your session has expired or there's a configuration mismatch."
                        : "We encountered an unexpected error while processing your request. Please try again or contact support if the issue persists."}
                </p>

                <div className="space-y-4">
                    <Button
                        onClick={clearAndLogin}
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-3"
                    >
                        <RefreshCcw className="h-5 w-5" />
                        Clear Session and Login
                    </Button>

                    <Link href="/" className="block">
                        <Button
                            variant="ghost"
                            className="w-full h-14 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Return Home
                        </Button>
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Technical Details: {reason || "Unknown Error"}
                    </p>
                </div>
            </div>
        </div>
    );
}
