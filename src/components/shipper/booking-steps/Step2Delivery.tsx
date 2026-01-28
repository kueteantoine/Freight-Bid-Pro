import React from "react";
import { UseFormReturn } from "react-hook-form";
import { MapPin, CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";

interface Step2DeliveryProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step2Delivery({ form }: Step2DeliveryProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Where is it going?</h2>
        <p className="text-muted-foreground">Enter the destination and expected delivery date.</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <FormField<BookingFormValues, "delivery_location">
          control={form.control}
          name="delivery_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                  <Input placeholder="Enter destination (e.g. Bastos, Yaoundé)" className="pl-10 h-12 text-lg" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField<BookingFormValues, "scheduled_delivery_date">
          control={form.control}
          name="scheduled_delivery_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Delivery Date (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                  <Input type="datetime-local" className="pl-10 h-12 text-lg" {...field} />
                </div>
              </FormControl>
              <FormDescription>Leave blank if flexible.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}