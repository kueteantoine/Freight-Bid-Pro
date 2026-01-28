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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
  const PROTECTED_ROUTE_PREFIXES = ["/shipper", "/carrier", "/driver", "/broker", "/admin"];

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role_type")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      const roles = data?.map((r) => r.role_type as UserRole) || [];
      setUserRoles(roles);

      if (roles.length > 0 && !activeRole) {
        const storedRole = getLocalStorage("activeRole") as UserRole;
        if (storedRole && roles.includes(storedRole)) {
          _setActiveRole(storedRole);
        } else {
          _setActiveRole(roles[0]);
        }
      }
    } catch (error) {
      console.error("[SessionContext] Error fetching user roles:", error);
    }
  };

  const setActiveRole = (role: UserRole) => {
    _setActiveRole(role);
    setLocalStorage("activeRole", role);
    router.push(`/${role}/dashboard`);
  };

  useEffect(() => {
    // Safety fallback: Force isLoading to false after 5 seconds
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      try {
        if (currentSession) {
          document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=${currentSession.expires_in}; SameSite=Lax; Secure`;
          await fetchUserRoles(currentSession.user.id);
        } else {
          document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
          setUserRoles([]);
          _setActiveRole(null);
          removeLocalStorage("activeRole");
        }
      } finally {
        setIsLoading(false);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      }

      const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (event === "SIGNED_OUT" && isProtectedRoute) {
        router.push("/login");
        toast.info("You have been signed out.");
      }
    });

    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchUserRoles(initialSession.user.id);
        }
      } catch (err) {
        console.error("[SessionContext] Init error:", err);
      } finally {
        setIsLoading(false);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      }
    };

    initSession();

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
      const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (session && isAuthRoute) {
        if (activeRole) {
          router.replace(`/${activeRole}/dashboard`);
        } else if (userRoles.length > 0) {
          router.replace(`/${userRoles[0]}/dashboard`);
        } else if (pathname.startsWith("/login")) {
          router.replace("/register");
        }
      } else if (!session && isProtectedRoute) {
        router.replace("/login");
      }
    }
  }, [isLoading, session, pathname, router, activeRole, userRoles]);

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