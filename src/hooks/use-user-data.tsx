"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export type UserRole = "shipper" | "transporter" | "driver" | "broker" | "admin";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
}

interface RoleData {
  id: string;
  role_type: UserRole;
  verification_status: string;
  is_active: boolean;
  role_specific_profile: any;
}

interface UserPreferences {
  language: string;
  currency: string;
  timezone: string | null;
}

interface UserData {
  profile: ProfileData | null;
  roles: RoleData[];
  preferences: UserPreferences | null;
  isLoading: boolean;
}

export function useUserData(): UserData {
  const [data, setData] = useState<UserData>({ profile: null, roles: [], preferences: null, isLoading: true });

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setData({ profile: null, roles: [], preferences: null, isLoading: false });
        }
        return;
      }

      try {
        // 1. Fetch Global Profile Data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, phone_number')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        // 2. Fetch Role Data
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('id, role_type, verification_status, is_active, role_specific_profile');

        if (rolesError) throw rolesError;

        // 3. Fetch User Preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('language, currency, timezone')
          .eq('user_id', user.id)
          .single();

        if (preferencesError && preferencesError.code !== 'PGRST116') throw preferencesError;

        if (isMounted) {
          setData({
            profile: profileData || null,
            roles: (rolesData as RoleData[]) || [],
            preferences: preferencesData || null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setData(prev => ({ ...prev, isLoading: false }));
          toast.error("Failed to load user data.");
        }
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setData({ profile: null, roles: [], preferences: null, isLoading: false });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return data;
}