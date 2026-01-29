import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { TRUCK_TYPES } from "@/lib/constants/shipment-constants";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";

interface Step4VehicleProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step4Vehicle({ form }: Step4VehicleProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Choose your vehicle</h2>
        <p className="text-muted-foreground">What kind of truck does this load require?</p>
      </div>
      <FormField<BookingFormValues, "preferred_vehicle_type">
        control={form.control}
        name="preferred_vehicle_type"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRUCK_TYPES.map((truck: { id: string, label: string, icon: any, description: string }) => (
                  <div
                    key={truck.id}
                    onClick={() => field.onChange(truck.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group",
                      field.value === truck.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-muted hover:border-primary/20 bg-background"
                    )}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={cn(
                        "p-3 rounded-lg transition-colors",
                        field.value === truck.id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <truck.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold flex items-center justify-between">
                          {truck.label}
                          {field.value === truck.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{truck.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<BookingFormValues, "special_equipment_needs">
        control={form.control}
        name="special_equipment_needs"
        render={({ field }) => (
          <FormItem className="bg-muted/30 p-4 rounded-xl border border-dashed animate-in slide-in-from-top-2 duration-700">
            <h3 className="text-sm font-bold mb-2">Special Equipment Needs</h3>
            <FormControl>
              <textarea
                {...field}
                className="w-full min-h-[80px] bg-background border rounded-md p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. Lift gate, Pallet jack, Straps, Refrigeration specifics..."
              />
            </FormControl>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-widest">Optional requirements for the transporter</p>
          </FormItem>
        )}
      />
    </div>
  );
}