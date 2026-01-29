"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { UserRole } from "./use-user-data";
import { toast } from "sonner";

export function useActiveRole() {
    const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActiveRole = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setActiveRoleState(null);
                return;
            }

            const { data, error } = await supabase
                .from('user_preferences')
                .select('last_active_role')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') throw error;
                // If no preferences found, might want to check roles table for a default
                const { data: firstRole } = await supabase
                    .from('user_roles')
                    .select('role_type')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .limit(1)
                    .single();

                if (firstRole) {
                    setActiveRoleState(firstRole.role_type as UserRole);
                }
            } else if (data?.last_active_role) {
                setActiveRoleState(data.last_active_role as UserRole);
            }
        } catch (error) {
            console.error("Error fetching active role:", error);
            toast.error("Failed to load active role.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                fetchActiveRole();
            } else if (event === 'SIGNED_OUT') {
                setActiveRoleState(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchActiveRole]);

    const switchRole = async (role: UserRole) => {
        try {
            const response = await fetch("/api/set-active-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to switch role");
            }

            setActiveRoleState(role);
            toast.success(`Switched to ${role} role`);

            // Optionally redirect or refresh to apply context changes
            window.location.href = `/${role}/dashboard`;
        } catch (error: any) {
            console.error("Error switching role:", error);
            toast.error(error.message || "Failed to switch role");
            return false;
        }
        return true;
    };

    return {
        activeRole,
        isLoading,
        switchRole,
        refresh: fetchActiveRole
    };
}
