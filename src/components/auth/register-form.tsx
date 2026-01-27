"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import Link from "next/link";

const registerSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character" }),
    phone: z.string().min(8, { message: "Invalid phone number" }),
    role: z.enum(["shipper", "carrier", "driver", "broker"], {
        required_error: "Please select an initial role",
    }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            phone: "",
            role: "shipper",
        },
    });

    const nextStep = async () => {
        const fieldsToValidate = step === 1 ? ["email", "password", "phone"] : ["role"];
        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    async function onSubmit(values: RegisterFormValues) {
        setIsLoading(true);
        try {
            // 1. Sign up user
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        phone_number: values.phone,
                    },
                },
            });

            if (signUpError) {
                toast.error(signUpError.message);
                return;
            }

            if (signUpData.user) {
                // 2. Assign initial role
                const { error: roleError } = await supabase.from("user_roles").insert({
                    user_id: signUpData.user.id,
                    role_type: values.role,
                    is_active: true,
                    verification_status: "pending",
                });

                if (roleError) {
                    console.error("Error assigning role:", roleError);
                    toast.error("Account created but role assignment failed. Please contact support.");
                } else {
                    toast.success("Account created successfully! Please check your email for verification.");
                }
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className={`flex items-center space-x-2 ${step === i ? "text-primary font-bold" : "text-muted-foreground"
                            }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === i ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                                }`}
                        >
                            {i}
                        </div>
                        <span className="text-sm">{i === 1 ? "Account Info" : "Role Selection"}</span>
                    </div>
                ))}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {step === 1 && (
                        <>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="name@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Min 8 characters, with upper, lower, number, and special character.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+237 6XX XXX XXX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" className="w-full mt-4" onClick={nextStep}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Select your primary role</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="grid grid-cols-2 gap-4"
                                            >
                                                {[
                                                    { value: "shipper", label: "Shipper", desc: "I have freight to move" },
                                                    { value: "carrier", label: "Carrier", desc: "I own a transport business" },
                                                    { value: "driver", label: "Driver", desc: "I operate freight vehicles" },
                                                    { value: "broker", label: "Broker", desc: "I coordinate freight moves" },
                                                ].map((role) => (
                                                    <FormItem key={role.value}>
                                                        <FormControl>
                                                            <RadioGroupItem value={role.value} className="sr-only" />
                                                        </FormControl>
                                                        <FormLabel
                                                            className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${field.value === role.value ? "border-primary" : ""
                                                                }`}
                                                        >
                                                            <span className="font-semibold">{role.label}</span>
                                                            <span className="text-[10px] text-muted-foreground text-center">
                                                                {role.desc}
                                                            </span>
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-4 mt-6">
                                <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Register
                                </Button>
                            </div>
                        </>
                    )}

                    <div className="text-center text-sm text-muted-foreground pt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Sign In
                        </Link>
                    </div>
                </form>
            </Form>
        </div>
    );
}
