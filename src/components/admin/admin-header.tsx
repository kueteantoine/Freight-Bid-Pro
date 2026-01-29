"use client";

import React from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminHeader() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (response.ok) {
                toast.success("Successfully signed out.");
                window.location.href = "/login";
            } else {
                toast.error("Failed to sign out");
            }
        } catch (err: any) {
            toast.error("An error occurred during sign out");
            console.error(err);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white dark:bg-gray-800 px-4 shadow-md md:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col w-[280px] bg-gray-50 dark:bg-gray-900 p-0">
                    <div className="p-4 border-b">
                        <h1 className="text-xl font-bold text-red-600">Admin Panel</h1>
                    </div>
                    <AdminSidebar />
                </SheetContent>
            </Sheet>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 hidden md:block">Admin Panel</h1>

            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-red-600 hover:bg-red-100">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign Out</span>
            </Button>
        </header>
    );
}
