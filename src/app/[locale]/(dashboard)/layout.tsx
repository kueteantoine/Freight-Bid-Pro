import React from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthLoading } from "@/components/auth/auth-loading";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch active role and roles for the switcher/sidebar
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role_type")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("last_active_role")
    .eq("user_id", user.id)
    .maybeSingle();

  const userRoles = roles?.map(r => r.role_type) || [];
  const activeRole = preferences?.last_active_role || (userRoles.length > 0 ? userRoles[0] : null);

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      <aside className="hidden md:flex flex-col w-72 lg:w-80 h-screen sticky top-0">
        <Sidebar user={user} activeRole={activeRole as any} userRoles={userRoles as any} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-y-auto">
        <Header user={user} activeRole={activeRole as any} userRoles={userRoles as any} />
        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-10">
            {children}
          </div>
        </main>

        <footer className="p-6 border-t bg-white flex justify-between items-center text-xs text-slate-400">
          <p>© 2026 FreightBid Marketplace. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}