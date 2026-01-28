"use client";

import React from "react";
import { useSession, UserRole } from "@/contexts/supabase-session-context";
import { AuthLoading } from "@/components/auth/auth-loading";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { LogOut, Menu, Package, Truck, Users, Shield, Settings, LayoutDashboard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoleSwitcher } from "../../components/dashboard/role-switcher";

const roleNavLinks: Record<string, any[]> = {
  shipper: [
    { href: "/shipper/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/shipper/shipments", icon: Package, label: "My Shipments" },
    { href: "/shipper/bookings/new", icon: Package, label: "Post Load" },
  ],
  carrier: [
    { href: "/carrier/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/carrier/loads", icon: Search, label: "Find Loads" },
    { href: "/carrier/fleet", icon: Truck, label: "My Fleet" },
  ],
  driver: [
    { href: "/driver/dashboard", icon: LayoutDashboard, label: "My Jobs" },
    { href: "/driver/history", icon: Truck, label: "Trip History" },
  ],
  broker: [
    { href: "/broker/dashboard", icon: LayoutDashboard, label: "Mediation" },
    { href: "/broker/network", icon: Users, label: "Partner Network" },
  ],
};

function Sidebar() {
  const pathname = usePathname();
  const { activeRole } = useSession();
  const links = activeRole ? roleNavLinks[activeRole] || [] : [];

  return (
    <nav className="flex flex-col space-y-1 p-4">
      <div className="mb-6 px-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {activeRole} Workspace
        </h3>
      </div>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group",
            pathname === link.href
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <link.icon className={cn("h-5 w-5", pathname === link.href ? "" : "group-hover:scale-110 transition-transform")} />
          <span className="font-medium">{link.label}</span>
        </Link>
      ))}
      <div className="pt-4 mt-4 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
            pathname === "/settings"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  );
}

function Header() {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden rounded-full">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[280px] p-0">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold tracking-tighter">FreightBid</h1>
          </div>
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1 flex items-center justify-between md:justify-end gap-4">
        <RoleSwitcher />
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive hover:bg-destructive/10">
          <LogOut className="h-5 w-5" />
        </Button>
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
    <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/30 md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <Truck className="h-6 w-6 text-primary" />
              <span>FreightBid</span>
            </Link>
          </div>
          <div className="flex-1 py-4">
            <Sidebar />
          </div>
          <div className="p-4 border-t">
            <MadeWithDyad />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-muted/10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}