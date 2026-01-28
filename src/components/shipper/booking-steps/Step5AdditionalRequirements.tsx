"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Shield, PackageSearch, Truck } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";

interface Step5AdditionalRequirementsProps {
    form: UseFormReturn<BookingFormValues>;
}

export function Step5AdditionalRequirements({ form }: Step5AdditionalRequirementsProps) {
    const insuranceRequired = form.watch("insurance_required");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Additional Requirements</h2>
                <p className="text-muted-foreground">Insurance, special handling, and specific instructions.</p>
            </div>

            <div className="space-y-6">
                {/* Insurance Section */}
                <div className="p-5 rounded-2xl border-2 bg-blue-50/30 border-blue-100/50 space-y-4">
                    <FormField<BookingFormValues, "insurance_required">
                        control={form.control}
                        name="insurance_required"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-5 w-5 border-blue-400 text-blue-600 focus:ring-blue-500"
                                    />
                                </FormControl>
                                <div className="space-y-1">
                                    <FormLabel className="text-base font-bold flex items-center gap-2 text-blue-800">
                                        <Shield className="w-5 h-5 text-blue-500" /> Freight Insurance
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {insuranceRequired && (
                        <FormField<BookingFormValues, "insurance_value">
                            control={form.control}
                            name="insurance_value"
                            render={({ field }) => (
                                <FormItem className="animate-in zoom-in-95 duration-300 ml-8">
                                    <FormLabel className="text-blue-700 font-semibold">Cargo Declared Value (XAF)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold">XAF</span>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 5,000,000"
                                                className="pl-12 h-11 border-blue-200 bg-white"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-blue-500/70">Required for calculating the insurance premium.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Handling & Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField<BookingFormValues, "special_handling_requirements">
                        control={form.control}
                        name="special_handling_requirements"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <PackageSearch className="w-4 h-4 text-primary" /> Special Handling
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Fragile cargo, hazardous materials details, etc."
                                        className="min-h-[100px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <FormField<BookingFormValues, "loading_requirements">
                            control={form.control}
                            name="loading_requirements"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-green-600" /> Loading Instructions
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Ramp required, side loading..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField<BookingFormValues, "unloading_requirements">
                            control={form.control}
                            name="unloading_requirements"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-red-600 scale-x-[-1]" /> Unloading Instructions
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Lift gate needed at delivery..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
