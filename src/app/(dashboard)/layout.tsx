"use client";

import React from "react";
import { useSession } from "@/contexts/supabase-session-context";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  LogOut,
  Menu,
  Package,
  Truck,
  Users,
  Settings,
  LayoutDashboard,
  Search,
  Bell,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
  Globe,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const roleNavLinks: Record<string, any[]> = {
  shipper: [
    {
      group: "MAIN", items: [
        { href: "/shipper/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/shipper/shipments", icon: Package, label: "My Shipments" },
        { href: "/shipper/analytics", icon: TrendingUp, label: "Spending Analytics" },
        { href: "/shipper/tracking", icon: Globe, label: "Live Tracking" },
      ]
    },
    {
      group: "FINANCIALS", items: [
        { href: "/shipper/billing", icon: Wallet, label: "Payments" },
      ]
    },
    {
      group: "SUPPORT", items: [
        { href: "/settings", icon: Settings, label: "Settings" },
        { href: "/help", icon: HelpCircle, label: "Help Center" },
      ]
    }
  ],
  carrier: [
    {
      group: "MAIN", items: [
        { href: "/carrier/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/carrier/fleet", icon: Truck, label: "Fleet Management" },
        { href: "/carrier/drivers", icon: Users, label: "Driver Management" },
      ]
    },
    {
      group: "FINANCIALS", items: [
        { href: "/carrier/payments", icon: Wallet, label: "Financials" },
      ]
    },
    {
      group: "SUPPORT", items: [
        { href: "/settings", icon: Settings, label: "Settings" },
        { href: "/help", icon: HelpCircle, label: "Help Center" },
      ]
    }
  ],
  driver: [
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
  ],
  broker: [
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
  ],
  admin: [
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
  ],
};

function Sidebar() {
  const pathname = usePathname();
  const { activeRole, session } = useSession();
  const navGroups = activeRole ? roleNavLinks[activeRole] || [] : [];
  const user = session?.user;

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
              {user?.user_metadata?.full_name || "John Doe"}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {activeRole} Admin
            </p>
          </div>
          <Settings className="h-4 w-4 text-slate-500 hover:text-white cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { activeRole } = useSession();
  const pathname = usePathname();

  // Dynamic title based on pathname
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
            <Sidebar />
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
          <RoleSwitcher />
        </div>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border-2 border-white rounded-fullShadow-sm"></span>
        </Button>
        <Avatar className="h-11 w-11 rounded-xl ring-2 ring-primary/5 cursor-pointer hover:ring-primary/20 transition-all">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthLoading />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-10">
            {children}
          </div>
        </main>

        {/* Simple Footer if needed */}
        <footer className="p-6 border-t bg-white flex justify-between items-center text-xs text-slate-400">
          <p>© 2026 FreightBid Marketplace. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}