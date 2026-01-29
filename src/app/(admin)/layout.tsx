import React from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthLoading } from "@/components/auth/auth-loading";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { LogOut, Menu, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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