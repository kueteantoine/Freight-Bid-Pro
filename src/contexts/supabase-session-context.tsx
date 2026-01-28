"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { getLocalStorage, setLocalStorage, removeLocalStorage } from "@/lib/utils";

export type UserRole = "shipper" | "carrier" | "driver" | "broker" | "admin";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  userRoles: UserRole[];
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [activeRole, _setActiveRole] = useState<UserRole | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const isFetchingRoles = useRef(false);

  // Helper to sync session with cookies for middleware
  const syncCookies = (currentSession: Session | null) => {
    if (typeof document === 'undefined') return;

    if (currentSession) {
      // Basic approach: Set a short-lived cookie that matches what middleware expects
      // Note: Ideally we'd use @supabase/ssr helpers here, but manual sync is a reliable bridge
      const maxAge = currentSession.expires_in || 3600;
      document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${currentSession.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      document.cookie = 'sb-access-token=; path=/; max-age=0';
      document.cookie = 'sb-refresh-token=; path=/; max-age=0';
    }
  };

  const fetchUserRoles = async (userId: string) => {
    if (isFetchingRoles.current) return;
    isFetchingRoles.current = true;
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role_type")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      const roles = data?.map((r) => r.role_type as UserRole) || [];
      setUserRoles(roles);

      if (roles.length > 0) {
        const storedRole = getLocalStorage("activeRole") as UserRole;
        if (storedRole && roles.includes(storedRole)) {
          _setActiveRole(storedRole);
        } else {
          _setActiveRole(roles[0]);
          setLocalStorage("activeRole", roles[0]);
        }
      }
    } catch (error) {
      console.error("[SessionContext] Error fetching user roles:", error);
      // Ensure state is reset if fetching fails, preventing navigation issues
      setUserRoles([]);
      _setActiveRole(null);
    } finally {
      isFetchingRoles.current = false;
    }
  };

  const setActiveRole = (role: UserRole) => {
    _setActiveRole(role);
    setLocalStorage("activeRole", role);
    router.push(`/${role}/dashboard`);
  };

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (event: string, currentSession: Session | null) => {
      if (!isMounted) return;

      console.log(`[SessionContext] Auth Event: ${event}`);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      syncCookies(currentSession);

      if (currentSession?.user) {
        await fetchUserRoles(currentSession.user.id);
      } else {
        setUserRoles([]);
        _setActiveRole(null);
        removeLocalStorage("activeRole");
      }

      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    };

    // Initial session check
    const initSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      await handleAuthChange("INITIAL_SESSION", initialSession);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      handleAuthChange(event, currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Navigation Logic
  useEffect(() => {
    if (isLoading) return;

    const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"];
    const PROTECTED_PREFIXES = ["/shipper", "/carrier", "/driver", "/broker", "/admin"];

    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
    const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isRegisterRoute = pathname.startsWith("/register");

    if (session) {
      // 1. Logged in but has no roles: Must go to register
      if (userRoles.length === 0) {
        if (!isRegisterRoute && pathname !== "/") {
          router.replace("/register");
        }
        return;
      }

      // 2. On / or an Auth Route: Redirect to active workspace or first role
      if (isAuthRoute || pathname === "/") {
        const targetRole = activeRole || userRoles[0];
        if (targetRole) {
          router.replace(`/${targetRole}/dashboard`);
        } else if (!isRegisterRoute) {
          router.replace("/register");
        }
      }
    } else if (isProtectedRoute) {
      // 3. Not logged in but on protected route: Redirect to login
      router.replace("/login");
    }
  }, [isLoading, session, pathname, activeRole, userRoles, router]);

  return (
    <SessionContext.Provider
      value={{ session, user, isLoading, userRoles, activeRole, setActiveRole }}
    >
      {children}
      <Toaster richColors position="top-right" />
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};