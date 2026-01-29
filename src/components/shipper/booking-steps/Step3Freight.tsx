import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";

interface Step3FreightProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step3Freight({ form }: Step3FreightProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">What are we shipping?</h2>
        <p className="text-muted-foreground">Details about the cargo help us find the right transporter.</p>
      </div>
      <div className="space-y-6">
        <FormField<BookingFormValues, "freight_type">
          control={form.control}
          name="freight_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Freight Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cocoa Beans, Cement, Electronics" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-6">
          <FormField<BookingFormValues, "weight_kg">
            control={form.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Weight</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="number" className="h-12 pr-16" {...field} />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-muted p-1 rounded-md text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 bg-background rounded shadow-sm text-primary">KG</span>
                      <span className="px-1.5 py-0.5 text-muted-foreground/50">LBS</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<BookingFormValues, "quantity">
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity / Units</FormLabel>
                <FormControl>
                  <Input type="number" className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <FormLabel>Dimensions (m)</FormLabel>
          <div className="grid grid-cols-3 gap-4">
            <FormField<BookingFormValues, "dimensions_json.length">
              control={form.control}
              name="dimensions_json.length"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="L" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField<BookingFormValues, "dimensions_json.width">
              control={form.control}
              name="dimensions_json.width"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="W" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField<BookingFormValues, "dimensions_json.height">
              control={form.control}
              name="dimensions_json.height"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="H" {...field} /></FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}