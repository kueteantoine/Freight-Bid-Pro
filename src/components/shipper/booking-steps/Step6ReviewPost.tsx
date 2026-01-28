import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Shield, Save, Eye } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";

interface Step6ReviewPostProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step6ReviewPost({ form }: Step6ReviewPostProps) {
  const insuranceRequired = form.watch("insurance_required");
  const saveAsTemplate = form.watch("save_as_template");
  const values = form.getValues();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review & Finalize</h2>
        <p className="text-muted-foreground">Confirm all details and post your shipment to the marketplace.</p>
      </div>

      {/* Summary Card */}
      <Card className="border-primary/20 bg-primary/5 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Eye className="h-5 w-5" /> Shipment Summary
          </CardTitle>
          <CardDescription>Quick overview of your booking details.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>Pickup:</strong> {values.pickup_location}</p>
          <p><strong>Delivery:</strong> {values.delivery_location}</p>
          <p><strong>Freight Type:</strong> {values.freight_type}</p>
          <p><strong>Weight:</strong> {values.weight_kg} kg</p>
          <p><strong>Auction Type:</strong> <span className="capitalize">{values.auction_type.replace('_', ' ')}</span></p>
          <p><strong>Visibility:</strong> <span className="capitalize">{values.marketplace_visibility}</span></p>
        </CardContent>
      </Card>

      {/* Additional Requirements & Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FormField<BookingFormValues, "insurance_required">
            control={form.control}
            name="insurance_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> Freight Insurance Required
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">Protect your goods against damage or loss.</p>
                </div>
              </FormItem>
            )}
          />

          {insuranceRequired && (
            <FormField<BookingFormValues, "insurance_value">
              control={form.control}
              name="insurance_value"
              render={({ field }) => (
                <FormItem className="animate-in zoom-in-95 duration-300">
                  <FormLabel>Cargo Declared Value (XAF)</FormLabel>
                  <FormControl>
                    <Input type="number" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Save className="w-4 h-4" /> Save Preferences
            </div>
            <FormField<BookingFormValues, "save_as_template">
              control={form.control}
              name="save_as_template"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Save as reusable template</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {saveAsTemplate && (
              <FormField<BookingFormValues, "template_name">
                control={form.control}
                name="template_name"
                render={({ field }) => (
                  <FormItem className="animate-in slide-in-from-top-2 duration-300">
                    <FormControl>
                      <Input placeholder="e.g. Weekly Cocoa Delivery" size={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <FormField<BookingFormValues, "loading_requirements">
            control={form.control}
            name="loading_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loading Instructions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Specific loading requirements..." className="min-h-[80px]" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField<BookingFormValues, "unloading_requirements">
            control={form.control}
            name="unloading_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unloading Instructions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Specific unloading requirements..." className="min-h-[80px]" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}