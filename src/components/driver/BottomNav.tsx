"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Truck, DollarSign, Receipt, User, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            href: "/driver",
            label: "Home",
            icon: Home,
        },
        {
            href: "/driver/jobs",
            label: "Jobs",
            icon: Truck,
        },
        {
            href: "/driver/earnings",
            label: "Earnings",
            icon: DollarSign,
        },
        {
            href: "/driver/expenses",
            label: "Expenses",
            icon: Receipt,
        },
        {
            href: "/driver/messages",
            label: "Chat",
            icon: MessageSquare,
        },
        {
            href: "/driver/profile",
            label: "Profile",
            icon: User,
        },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background px-4 py-2 pb-safe-area-bottom z-50">
            <nav className="flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-primary",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
