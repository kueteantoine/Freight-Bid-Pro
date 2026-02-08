import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TRUCK_TYPES } from "@/lib/constants/shipment-constants";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { getTieredMatch } from "@/lib/utils/matching-utils";

interface Step4VehicleProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step4Vehicle({ form }: Step4VehicleProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [suggestion, setSuggestion] = useState<{ label: string, id: string } | null>(null);

  const selectedVehicle = form.watch("preferred_vehicle_type");

  useEffect(() => {
    // Check if current value is one of the standard ones
    const isStandard = TRUCK_TYPES.some(t => t.id === selectedVehicle);
    setIsCustom(!isStandard && selectedVehicle !== "");
  }, [selectedVehicle]);

  const handleCustomChange = (val: string) => {
    form.setValue("preferred_vehicle_type", val);

    // Find best suggestion from standard types
    if (val.length > 2) {
      let bestMatchLabel = "";
      let bestMatchId = "";
      let bestScore = 0;

      for (const truck of TRUCK_TYPES) {
        const match = getTieredMatch(val, truck.label);
        if (match.tier <= 3 && match.score > bestScore) {
          bestMatchLabel = truck.label;
          bestMatchId = truck.id;
          bestScore = match.score;
        }
      }

      if (bestScore > 0) {
        setSuggestion({ label: bestMatchLabel, id: bestMatchId });
      } else {
        setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Choose your vehicle</h2>
        <p className="text-muted-foreground">What kind of truck does this load require?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TRUCK_TYPES.map((truck) => (
          <div
            key={truck.id}
            onClick={() => {
              form.setValue("preferred_vehicle_type", truck.id);
              setIsCustom(false);
              setSuggestion(null);
            }}
            className={cn(
              "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group",
              selectedVehicle === truck.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-muted hover:border-primary/20 bg-background"
            )}
          >
            <div className="flex gap-4 items-start">
              <div className={cn(
                "p-3 rounded-lg transition-colors",
                selectedVehicle === truck.id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <truck.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold flex items-center justify-between">
                  {truck.label}
                  {selectedVehicle === truck.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{truck.description}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Custom Option Card */}
        <div
          onClick={() => {
            setIsCustom(true);
            form.setValue("preferred_vehicle_type", "");
          }}
          className={cn(
            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group",
            isCustom
              ? "border-primary bg-primary/5 shadow-md"
              : "border-muted hover:border-primary/20 bg-background"
          )}
        >
          <div className="flex gap-4 items-start">
            <div className={cn(
              "p-3 rounded-lg transition-colors",
              isCustom ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold flex items-center justify-between">
                Other / Custom
                {isCustom && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Specify a special vehicle type not listed above.</p>
            </div>
          </div>
        </div>
      </div>

      {isCustom && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <FormField<BookingFormValues, "preferred_vehicle_type">
            control={form.control}
            name="preferred_vehicle_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Vehicle Type</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Modified 4x4 with Winch, Lowboy Trailer"
                    className="h-12"
                    onChange={(e) => handleCustomChange(e.target.value)}
                  />
                </FormControl>
                {suggestion && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span>Did you mean <strong>{suggestion.label}</strong>?</span>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("preferred_vehicle_type", suggestion.id);
                        setIsCustom(false);
                        setSuggestion(null);
                      }}
                      className="ml-auto text-primary font-bold hover:underline"
                    >
                      Use Standard
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">
                  ⚠️ Custom types may receive fewer bids. Consider using a standard type if possible.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

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