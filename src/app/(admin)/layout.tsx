"use client";

import React from "react";
import { useSession } from "@/contexts/supabase-session-context";
import { AuthLoading } from "@/components/auth/auth-loading";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { LogOut, Menu, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define navigation links for the Admin dashboard
const adminNavLinks = [
  { href: "/admin/dashboard", icon: Settings, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "User Management" },
  // Placeholder links
];

// Sidebar component
function AdminSidebar() {
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

// Header component
function AdminHeader() {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out: " + error.message);
    } else {
      toast.success("Successfully signed out.");
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


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <AuthLoading />
      </div>
    );
  }

  if (!session) {
    // Redirection handled by context provider
    return null;
  }

  // NOTE: In a real app, we would check if the user has the 'admin' role here.
  // For now, we assume any logged-in user can access the admin panel for development purposes.

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-gray-50 dark:bg-gray-900 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6 bg-white dark:bg-gray-800">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-red-600 text-xl">
              <Settings className="h-6 w-6" />
              <span>Admin Portal</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <AdminSidebar />
          </div>
          <div className="mt-auto p-4 border-t bg-white dark:bg-gray-800">
            <MadeWithDyad />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col">
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}