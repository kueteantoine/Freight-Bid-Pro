"use client";

import React from "react";
import { LayoutDashboard, DollarSign, Package, TrendingUp, Globe, Wallet, Settings, HelpCircle, Truck, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";

const roleNavLinks: Record<string, any[]> = {
    shipper: [
        {
            group: "MAIN", items: [
                { href: "/shipper/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                { href: "/shipper/bidding", icon: DollarSign, label: "Live Bidding" },
                { href: "/shipper/shipments", icon: Package, label: "My Shipments" },
                { href: "/shipper/analytics", icon: TrendingUp, label: "Spending Analytics" },
                { href: "/shipper/tracking", icon: Globe, label: "Live Tracking" },
            ]
        },
        {
            group: "FINANCIALS", items: [
                { href: "/shipper/payments", icon: Wallet, label: "Payments" },
            ]
        },
        {
            group: "SUPPORT", items: [
                { href: "/settings", icon: Settings, label: "Settings" },
                { href: "/help", icon: HelpCircle, label: "Help Center" },
            ]
        }
    ],
    transporter: [
        {
            group: "MAIN", items: [
                { href: "/transporter/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                { href: "/transporter/fleet", icon: Truck, label: "Fleet Management" },
                { href: "/transporter/drivers", icon: Users, label: "Driver Management" },
            ]
        },
        {
            group: "FINANCIALS", items: [
                { href: "/transporter/payments", icon: Wallet, label: "Financials" },
            ]
        },
        {
            group: "SUPPORT", items: [
                { href: "/settings", icon: Settings, label: "Settings" },
                { href: "/help", icon: HelpCircle, label: "Help Center" },
            ]
        }
    ],
    // ... other roles (abbreviated for brevity, I should keep all)
};

// Re-adding the rest of the roles
roleNavLinks.driver = [
    {
        group: "MAIN", items: [
            { href: "/driver/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/driver/history", icon: Truck, label: "Trip History" },
        ]
    },
    {
        group: "SUPPORT", items: [
            { href: "/settings", icon: Settings, label: "Settings" },
        ]
    }
];

roleNavLinks.broker = [
    {
        group: "MAIN", items: [
            { href: "/broker/dashboard", icon: LayoutDashboard, label: "Overview" },
            { href: "/broker/network", icon: Users, label: "Partner Network" },
        ]
    },
    {
        group: "FINANCIALS", items: [
            { href: "/broker/margins", icon: Wallet, label: "Margins" },
        ]
    }
];

roleNavLinks.admin = [
    {
        group: "MAIN", items: [
            { href: "/admin/dashboard", icon: LayoutDashboard, label: "Platform Overview" },
            { href: "/admin/users", icon: Users, label: "User Management" },
            { href: "/admin/disputes", icon: AlertCircle, label: "Dispute Center" },
        ]
    },
    {
        group: "FINANCIALS", items: [
            { href: "/admin/settlements", icon: Wallet, label: "Settlements" },
        ]
    },
    {
        group: "SUPPORT", items: [
            { href: "/admin/settings", icon: Settings, label: "Settings" },
        ]
    }
];

import { Users, AlertCircle } from "lucide-react";

export function Sidebar({ user, activeRole, userRoles }: { user: User, activeRole: string | null, userRoles: string[] }) {
    const pathname = usePathname();
    const navGroups = activeRole ? roleNavLinks[activeRole] || [] : [];

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-300">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight text-white">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                    <span>FreightBid</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-8 overflow-y-auto pt-4">
                {navGroups.map((group, idx) => (
                    <div key={idx} className="space-y-2">
                        {group.group !== "MAIN" && (
                            <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                {group.group}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item: any) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5", isActive ? "" : "text-slate-400 group-hover:text-white group-hover:scale-110 transition-transform")} />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-900">
                <div className="bg-slate-900/50 rounded-2xl p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-slate-800">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary text-white">
                            {user?.email?.[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {user?.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs text-slate-500 truncate capitalize">
                            {activeRole} Workspace
                        </p>
                    </div>
                    <div
                        className="p-2 rounded-xl bg-slate-950/50 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer group"
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
                        <LogOut className="h-4 w-4 text-slate-500 group-hover:text-rose-500 group-hover:scale-110 transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
}
