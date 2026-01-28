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
        <p className="text-muted-foreground">Details about the cargo help us find the right carrier.</p>
      </div>
      <div className="space-y-6">
        <FormField
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
          <FormField
            control={form.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
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
            <FormField
              control={form.control}
              name="dimensions_json.length"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="L" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dimensions_json.width"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="W" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
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