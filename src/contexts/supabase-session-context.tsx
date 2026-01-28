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

  const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
  const PROTECTED_ROUTE_PREFIXES = ["/shipper", "/carrier", "/driver", "/broker", "/admin"];

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
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
    });

    const initSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await fetchUserRoles(initialSession.user.id);
      }
      
      setIsLoading(false);
    };

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Navigation Logic
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (session) {
      // User has a session but no roles detected yet
      if (userRoles.length === 0 && !isAuthRoute && pathname !== "/register") {
          // If we haven't found roles, we might need to fetch them again or wait
          // But to be safe, if we are on a protected route and have no roles, go to register
          if (isProtectedRoute) {
             router.replace("/register");
          }
      }

      if (isAuthRoute || pathname === "/") {
        if (activeRole) {
          router.replace(`/${activeRole}/dashboard`);
        } else if (userRoles.length > 0) {
          router.replace(`/${userRoles[0]}/dashboard`);
        } else if (pathname !== "/register") {
          router.replace("/register");
        }
      }
    } else if (isProtectedRoute) {
      router.replace("/login");
    }
  }, [isLoading, session, pathname, activeRole, userRoles]);

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