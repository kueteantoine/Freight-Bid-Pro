"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/supabase-session-context";
import { AuthLoading } from "@/components/auth/auth-loading";

export default function LoginPage() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <AuthLoading />
      </Card>
    );
  }

  // If session exists, the context provider handles redirection, 
  // but we render nothing here to prevent flicker.
  if (session) {
    return null;
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-primary/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold text-primary">Welcome to FreightBid</CardTitle>
        <p className="text-sm text-center text-muted-foreground">Sign in or create an account to access your multi-role dashboard.</p>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--input))',
                  inputBorder: 'hsl(var(--border))',
                  inputBorderHover: 'hsl(var(--ring))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputText: 'hsl(var(--foreground))',
                  defaultButtonBackground: 'hsl(var(--secondary))',
                  defaultButtonBackgroundHover: 'hsl(var(--secondary-foreground))',
                  defaultButtonText: 'hsl(var(--secondary-foreground))',
                },
                radii: {
                  borderRadiusButton: 'var(--radius)',
                  inputBorderRadius: 'var(--radius)',
                },
              },
            },
          }}
          providers={[]}
          view="sign_in"
          showLinks={true}
          redirectTo={process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/shipper/dashboard"}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email Address',
                password_label: 'Password',
                button_label: 'Sign In',
                loading_button_label: 'Signing In...',
                link_text: 'Already have an account? Sign In',
              },
              sign_up: {
                email_label: 'Email Address',
                password_label: 'Create a Password',
                button_label: 'Sign Up',
                loading_button_label: 'Signing Up...',
                link_text: 'Don\'t have an account? Sign Up',
              },
              forgotten_password: {
                link_text: 'Forgot your password?',
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}