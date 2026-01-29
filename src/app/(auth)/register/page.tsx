import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <Card className="w-full max-w-lg shadow-xl border-primary/20">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold text-primary">
                    {user ? "Select Additional Role" : "Create Account"}
                </CardTitle>
                <p className="text-sm text-center text-muted-foreground">
                    {user ? "Choose a new role to activate on your account." : "Join FreightBid and start managing your shipments."}
                </p>
            </CardHeader>
            <CardContent>
                <RegisterForm />
            </CardContent>
        </Card>
    );
}