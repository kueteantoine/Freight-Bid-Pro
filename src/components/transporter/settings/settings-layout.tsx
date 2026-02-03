"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Truck,
    DollarSign,
    Settings as SettingsIcon,
    Bell,
    Cpu
} from "lucide-react";

interface SettingsLayoutProps {
    children: React.ReactNode;
}

const tabs = [
    {
        name: "Service Configuration",
        href: "/transporter/settings/services",
        icon: Truck,
        description: "Manage your freight types and service regions"
    },
    {
        name: "Pricing Rules",
        href: "/transporter/settings/pricing",
        icon: DollarSign,
        description: "Set your rates and pricing strategies"
    },
    {
        name: "Bid Automation",
        href: "/transporter/settings/automation",
        icon: Cpu,
        description: "Configure auto-bidding rules"
    },
    {
        name: "Notifications",
        href: "/transporter/settings/notifications",
        icon: Bell,
        description: "Manage your notification preferences"
    },
];

export function CarrierSettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings & Preferences</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your carrier profile, service offerings, and automation rules.
                </p>
            </div>

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="-mx-4 lg:w-1/5 overflow-x-auto lg:overflow-visible">
                    <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 p-2 md:p-0">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center whitespace-nowrap lg:whitespace-normal rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-100",
                                        isActive
                                            ? "bg-slate-100 text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <tab.icon className={cn("h-5 w-5 mb-1 md:mb-0 md:mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <div className="text-center md:text-left">
                                        <span>{tab.name}</span>
                                        {/* <p className="hidden md:block text-xs font-normal text-muted-foreground/70 mt-0.5">{tab.description}</p> */}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="flex-1 lg:max-w-4xl">
                    <div className="bg-white rounded-lg border shadow-sm p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
