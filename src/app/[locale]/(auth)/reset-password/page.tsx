"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordNewForm } from "@/components/auth/password-new-form";

export default function ResetPasswordPage() {
    return (
        <Card className="w-full max-w-md shadow-xl border-primary/20">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold text-primary">Update Password</CardTitle>
                <p className="text-sm text-center text-muted-foreground">Please enter your new password below.</p>
            </CardHeader>
            <CardContent>
                <PasswordNewForm />
            </CardContent>
        </Card>
    );
}
