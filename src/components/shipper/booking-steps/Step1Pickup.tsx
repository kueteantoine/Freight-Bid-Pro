import React from "react";
import { UseFormReturn } from "react-hook-form";
import { MapPin, CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { getCoordinates } from "@/lib/google-maps";

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
        <FormField<BookingFormValues, "pickup_location">
          control={form.control}
          name="pickup_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Address</FormLabel>
              <FormControl>
                <LocationAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  icon={<MapPin className="h-4 w-4 text-primary" />}
                  onSelect={async (place) => {
                    field.onChange(place.description);
                    try {
                      const coords = await getCoordinates(place.place_id);
                      form.setValue("pickup_latitude", coords.lat);
                      form.setValue("pickup_longitude", coords.lng);
                    } catch (err) {
                      console.error("Failed to get coordinates:", err);
                    }
                  }}
                  placeholder="Enter pickup location (e.g. Akwa, Douala)"
                  className="h-12 text-lg"
                />
              </FormControl>
              <FormMessage />
              <FormDescription>Start typing to see suggestions in Cameroon.</FormDescription>
            </FormItem>
          )}
        />
        <FormField<BookingFormValues, "scheduled_pickup_date">
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