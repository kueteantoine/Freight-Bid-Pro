"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileCheck, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const adminNavLinks = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/verifications", icon: FileCheck, label: "Verifications" },
    { href: "/admin/users", icon: Users, label: "Users" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col space-y-2 p-4">
            <h3 className="text-lg font-semibold text-sidebar-foreground mb-4">Admin Menu</h3>
            {adminNavLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-red-100 hover:text-red-700",
                        pathname.startsWith(link.href)
                            ? "bg-red-600 text-white shadow-md"
                            : "text-gray-700 dark:text-gray-300"
                    )}
                >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
