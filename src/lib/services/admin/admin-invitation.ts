'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client with the service role key.
 * THIS SHOULD ONLY BE USED ON THE SERVER AND FOR ACTIONS THAT REQUIRE ADMIN PRIVILEGES.
 */
export const createAdminClient = async () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) { return undefined },
                set(name: string, value: string, options: any) {},
                remove(name: string, options: any) {},
            },
        }
    );
};

export async function inviteNewAdmin(email: string, roleName: string) {
    const adminClient = await createAdminClient();

    try {
        // 1. Invite the user via email
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
            data: {
                initial_role: 'admin',
                specialized_role: roleName
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:32144'}/auth/reset-password`
        });

        if (error) throw error;

        return { success: true, data: data.user };
    } catch (error: any) {
        console.error('Error inviting admin:', error);
        return { success: false, error: error.message };
    }
}
