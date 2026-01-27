"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

const resetSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export function PasswordResetForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const form = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: ResetFormValues) {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                toast.error(error.message);
            } else {
                setIsSent(true);
                toast.success("Password reset email sent!");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }

    if (isSent) {
        return (
            <div className="text-center space-y-4">
                <p className="text-sm">
                    We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
                    Try another email
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Back to Login
                    </Link>
                </div>
            </form>
        </Form>
    );
}
