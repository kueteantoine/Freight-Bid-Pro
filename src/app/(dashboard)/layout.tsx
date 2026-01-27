"use client";

import React from "react";
import { useSession } from "@/contexts/supabase-session-context";
import { AuthLoading } from "@/components/auth/auth-loading";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { LogOut, Menu, Package, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define navigation links for the dashboard (Shipper role default for now)
const navLinks = [
  { href: "/shipper/dashboard", icon: Package, label: "Dashboard" },
  { href: "/shipper/shipments", icon: Truck, label: "Shipments" },
  { href: "/shipper/bidding", icon: Users, label: "Bidding" },
];

// Sidebar component
function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-2 p-4">
      <h3 className="text-lg font-semibold text-sidebar-foreground mb-4">Shipper Menu</h3>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname.startsWith(link.href)
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
              : "text-sidebar-foreground"
          )}
        >
          <link.icon className="h-5 w-5" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

// Header component
function Header() {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out: " + error.message);
    } else {
      toast.success("Successfully signed out.");
      // Redirection handled by SessionContextProvider
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 shadow-sm md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden rounded-lg border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[280px] bg-sidebar p-0">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-primary">FreightBid</h1>
          </div>
          <Sidebar />
        </SheetContent>
      </Sheet>
      <h1 className="text-xl font-semibold text-primary hidden md:block">Freight Bidding Marketplace</h1>
      
      <div className="flex items-center gap-4">
        {/* Placeholder for Role Switcher */}
        <Button variant="outline" size="sm" className="hidden sm:flex">
          Current Role: Shipper
        </Button>
        
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive hover:bg-destructive/10">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthLoading />
      </div>
    );
  }

  if (!session) {
    // Redirection handled by context provider
    return null;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-sidebar md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/shipper/dashboard" className="flex items-center gap-2 font-semibold text-primary text-xl">
              <Truck className="h-6 w-6 text-primary" />
              <span>FreightBid</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <Sidebar />
          </div>
          <div className="mt-auto p-4 border-t">
            <MadeWithDyad />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}