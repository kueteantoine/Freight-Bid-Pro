"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
  const PROTECTED_ROUTE_PREFIXES = ["/shipper", "/carrier", "/driver", "/broker", "/admin"];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);

      const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
      const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (currentSession && isAuthRoute) {
          // Redirect authenticated users away from auth pages
          router.push("/shipper/dashboard"); // Default redirect to Shipper Dashboard for now
          toast.success("Welcome back! Redirecting to dashboard.");
        }
      } else if (event === 'SIGNED_OUT') {
        if (isProtectedRoute) {
          // Redirect unauthenticated users away from protected pages
          router.push("/login");
          toast.info("You have been signed out.");
        }
      }
    });

    // Initial check (in case onAuthStateChange doesn't fire immediately or we are server rendering)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Handle redirection on initial load if session is already known
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
      const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

      if (session && isAuthRoute) {
        router.replace("/shipper/dashboard");
      } else if (!session && isProtectedRoute) {
        router.replace("/login");
      }
    }
  }, [isLoading, session, pathname, router]);


  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
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