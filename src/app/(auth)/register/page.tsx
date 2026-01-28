"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/contexts/supabase-session-context";
import { AuthLoading } from "@/components/auth/auth-loading";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
    const { isLoading, session, userRoles } = useSession();

    if (isLoading) {
        return (
            <Card className="w-full max-w-lg shadow-xl border-primary/20">
                <AuthLoading />
            </Card>
        );
    }

    // If the user is logged in AND has roles, the SessionContextProvider should handle the redirect
    // to their dashboard. We return null here to prevent rendering the form while waiting for navigation.
    if (session && userRoles.length > 0) {
        return null;
    }

    return (
        <Card className="w-full max-w-lg shadow-xl border-primary/20">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold text-primary">
                    {session ? "Select Additional Role" : "Create Account"}
                </CardTitle>
                <p className="text-sm text-center text-muted-foreground">
                    {session ? "Choose a new role to activate on your account." : "Join FreightBid and start managing your shipments."}
                </p>
            </CardHeader>
            <CardContent>
                <RegisterForm />
            </CardContent>
        </Card>
    );
}