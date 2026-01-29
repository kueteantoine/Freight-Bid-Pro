"use client";

import React from "react";
import { Menu, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import { Sidebar } from "./sidebar";
import { User } from "@supabase/supabase-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings as SettingsIcon } from "lucide-react";

export function Header({ user, activeRole, userRoles }: { user: User, activeRole: string | null, userRoles: string[] }) {
    const pathname = usePathname();
    const pageTitle = pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b bg-white/80 backdrop-blur-xl px-6 md:px-8">
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        <Sidebar user={user} activeRole={activeRole} userRoles={userRoles} />
                    </SheetContent>
                </Sheet>
                <h1 className="text-xl font-bold capitalize text-slate-900 md:text-2xl tracking-tight">
                    {pageTitle}
                </h1>
            </div>

            <div className="flex-1 max-w-xl hidden md:flex mx-8">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Global search (e.g. Douala, #CM-8821)..."
                        className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/10 rounded-xl transition-all h-11"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                    <RoleSwitcher currentRole={activeRole as any} availableRoles={userRoles as any} />
                </div>
                <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-11 w-11 rounded-xl ring-2 ring-primary/5 cursor-pointer hover:ring-primary/20 transition-all">
                            <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                            <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                        <DropdownMenuLabel className="p-3">
                            <p className="text-sm font-black text-slate-900">{user?.user_metadata?.full_name || "Account"}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{user?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-50" />
                        <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer focus:bg-slate-50">
                            <a href="/settings" className="flex items-center gap-3">
                                <SettingsIcon className="h-4 w-4 text-slate-400" />
                                <span className="font-bold text-slate-700">Settings</span>
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-50" />
                        <DropdownMenuItem
                            className="rounded-xl h-11 cursor-pointer focus:bg-rose-50 group"
                            onClick={async () => {
                                try {
                                    const response = await fetch("/api/auth/logout", { method: "POST" });
                                    if (response.ok) {
                                        window.location.href = "/login";
                                    }
                                } catch (err) {
                                    console.error("Logout failed:", err);
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <LogOut className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-rose-600">Sign Out</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
