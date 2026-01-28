"use client";

import { useState, useEffect } from "react";
import { useSession, UserRole } from "@/contexts/supabase-session-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface UserData {
  profile: ProfileData | null;
  roles: RoleData[];
  isLoading: boolean;
}

export function useUserData(): UserData {
  const { user, isLoading: isSessionLoading } = useSession();
  const [data, setData] = useState<UserData>({ profile: null, roles: [], isLoading: true });

  useEffect(() => {
    if (isSessionLoading || !user) {
      setData({ profile: null, roles: [], isLoading: isSessionLoading });
      return;
    }

    const fetchUserData = async () => {
      setData(prev => ({ ...prev, isLoading: true }));
      
      try {
        // 1. Fetch Global Profile Data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, phone_number')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError; // PGRST116 means no rows found

        // 2. Fetch Role Data
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('id, role_type, verification_status, is_active, role_specific_profile');

        if (rolesError) throw rolesError;

        setData({
          profile: profileData || null,
          roles: rolesData as RoleData[],
          isLoading: false,
        });

      } catch (error) {
        console.error("Error fetching user data:", error);
        setData(prev => ({ ...prev, isLoading: false }));
        toast.error("Failed to load user data.");
      }
    };

    fetchUserData();
  }, [user, isSessionLoading]);

  return data;
}