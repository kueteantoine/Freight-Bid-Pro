import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-xl border-primary/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold text-primary">Welcome to FreightBid</CardTitle>
        <p className="text-sm text-center text-muted-foreground">Sign in to access your multi-role dashboard.</p>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}