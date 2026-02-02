"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, FileText, Globe, ShieldCheck, Loader2 } from "lucide-react";

const profileSchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    business_registration_number: z.string().min(5, "Registration number is required"),
    tax_id: z.string().min(5, "Tax ID is required"),
    years_in_operation: z.coerce.number().min(0),
    number_of_employees: z.coerce.number().min(1),
    business_address: z.string().min(5, "Address is required"),
    operating_regions: z.string().min(2, "Operating regions are required"),
    service_types: z.string().min(2, "Service types are required"),
    insurance_info: z.object({
        provider: z.string().min(2, "Insurance provider is required"),
        policy_number: z.string().min(5, "Policy number is required"),
        coverage_amount: z.coerce.number().min(1000),
        expiry_date: z.string().min(10, "Expiry date is required"),
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CarrierProfileForm({ initialData, onSave }: { initialData?: any, onSave?: (data: any) => Promise<void> }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: initialData || {
            company_name: "",
            business_registration_number: "",
            tax_id: "",
            years_in_operation: 1,
            number_of_employees: 1,
            business_address: "",
            operating_regions: "",
            service_types: "",
            insurance_info: {
                provider: "",
                policy_number: "",
                coverage_amount: 1000000,
                expiry_date: "",
            },
        },
    });

    async function onSubmit(data: ProfileFormValues) {
        setIsSubmitting(true);
        try {
            if (onSave) {
                await onSave(data);
            }
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Business Information */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Business Information</CardTitle>
                            </div>
                            <CardDescription>Legal and operational company details</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Legal Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Rapid Freight SA" className="rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="business_registration_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Registration #</FormLabel>
                                            <FormControl>
                                                <Input placeholder="RC/..." className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tax_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tax ID (NIU)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="M..." className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="business_address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full HQ address" className="rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Operating Details */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Globe className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Operating Details</CardTitle>
                            </div>
                            <CardDescription>Regions and types of service offered</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="operating_regions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operating Regions</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Littoral, Centre, Adamaoua" className="rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="service_types"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specialized Services</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Cold Chain, Oversized, General Cargo" className="rounded-xl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="years_in_operation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Years in Operation</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="number_of_employees"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Staff Size</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Information */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden md:col-span-2">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Insurance Coverage</CardTitle>
                            </div>
                            <CardDescription>Cargo and operational insurance details</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <FormField
                                    control={form.control}
                                    name="insurance_info.provider"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Insurance Provider</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. AXA, Saham" className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="insurance_info.policy_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Policy Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="POL-..." className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="insurance_info.coverage_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Coverage Amount (XAF)</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="insurance_info.expiry_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" className="rounded-xl px-8 h-12 font-bold">
                        Discard Changes
                    </Button>
                    <Button disabled={isSubmitting} type="submit" className="rounded-xl px-12 h-12 font-bold shadow-lg shadow-primary/20">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Profile"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
