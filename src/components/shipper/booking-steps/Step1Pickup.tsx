import React from "react";
import { UseFormReturn } from "react-hook-form";
import { MapPin, CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";

interface Step1PickupProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step1Pickup({ form }: Step1PickupProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Where are we picking up?</h2>
        <p className="text-muted-foreground">Provide the full address and scheduled time for pickup.</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="pickup_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input placeholder="Enter pickup location (e.g. Akwa, Douala)" className="pl-10 h-12 text-lg" {...field} />
                </div>
              </FormControl>
              <FormMessage />
              <FormDescription>Use Google Maps autocomplete for better accuracy.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scheduled_pickup_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Pickup Date & Time</FormLabel>
              <FormControl>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input type="datetime-local" className="pl-10 h-12 text-lg" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}