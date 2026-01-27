"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ForgotPasswordPage() {
    return (
        <Card className="w-full max-w-md shadow-xl border-primary/20">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold text-primary">Reset Password</CardTitle>
                <p className="text-sm text-center text-muted-foreground">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            </CardHeader>
            <CardContent>
                <PasswordResetForm />
            </CardContent>
        </Card>
    );
}
