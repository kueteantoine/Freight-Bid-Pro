import React from "react";
import { UseFormReturn } from "react-hook-form";
import { MapPin, CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { getCoordinates } from "@/lib/google-maps";

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
                <LocationAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  icon={<MapPin className="h-4 w-4 text-red-500" />}
                  onSelect={async (place) => {
                    field.onChange(place.description);
                    try {
                      const coords = await getCoordinates(place.place_id);
                      form.setValue("delivery_latitude", coords.lat);
                      form.setValue("delivery_longitude", coords.lng);
                    } catch (err) {
                      console.error("Failed to get coordinates:", err);
                    }
                  }}
                  placeholder="Enter destination (e.g. Bastos, Yaoundé)"
                  className="h-12 text-lg"
                />
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