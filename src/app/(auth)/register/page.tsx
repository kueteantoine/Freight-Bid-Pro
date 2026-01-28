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

    if (session) {
        if (userRoles.length > 0) {
            return (
                <Card className="w-full max-w-lg shadow-xl border-primary/20">
                    <AuthLoading />
                </Card>
            );
        }
        // If session exists but no roles, we stay on this page to let them pick a role
    }

    return (
        <Card className="w-full max-w-lg shadow-xl border-primary/20">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold text-primary">Create Account</CardTitle>
                <p className="text-sm text-center text-muted-foreground">Join FreightBid and start managing your shipments.</p>
            </CardHeader>
            <CardContent>
                <RegisterForm />
            </CardContent>
        </Card>
    );
}
