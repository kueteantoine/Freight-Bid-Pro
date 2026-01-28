"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Loader2, 
  MapPin, 
  Package, 
  Truck, 
  Calendar as CalendarIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/supabase-session-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  pickup_location: z.string().min(5, { message: "Pickup location is required" }),
  delivery_location: z.string().min(5, { message: "Delivery location is required" }),
  scheduled_pickup_date: z.string().min(1, { message: "Pickup date is required" }),
  freight_type: z.string().min(2, { message: "Freight type is required" }),
  weight_kg: z.coerce.number().min(1, { message: "Weight must be at least 1kg" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  preferred_vehicle_type: z.string().default("General Truck"),
  special_handling_requirements: z.string().default(""),
  insurance_required: z.boolean().default(false),
  insurance_value: z.coerce.number().default(0),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function ShipmentBookingForm() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSession();
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickup_location: "",
      delivery_location: "",
      scheduled_pickup_date: "",
      freight_type: "",
      weight_kg: 0,
      quantity: 1,
      preferred_vehicle_type: "General Truck",
      special_handling_requirements: "",
      insurance_required: false,
      insurance_value: 0,
    },
  });

  const nextStep = async () => {
    let fields: (keyof BookingFormValues)[] = [];
    if (step === 1) fields = ["pickup_location", "delivery_location", "scheduled_pickup_date"];
    if (step === 2) fields = ["freight_type", "weight_kg", "quantity"];
    
    const isValid = await form.trigger(fields);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  async function onSubmit(values: BookingFormValues) {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("shipments").insert({
        shipper_user_id: user.id,
        pickup_location: values.pickup_location,
        delivery_location: values.delivery_location,
        scheduled_pickup_date: new Date(values.scheduled_pickup_date).toISOString(),
        freight_type: values.freight_type,
        weight_kg: values.weight_kg,
        quantity: values.quantity,
        preferred_vehicle_type: values.preferred_vehicle_type,
        special_handling_requirements: values.special_handling_requirements,
        insurance_required: values.insurance_required,
        insurance_value: values.insurance_value,
        status: "open_for_bidding",
      });

      if (error) throw error;

      toast.success("Shipment posted to marketplace!");
      router.push("/shipper/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to post shipment.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Progress Stepper */}
      <div className="flex justify-between mb-12 relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
        {[
          { icon: MapPin, label: "Locations" },
          { icon: Package, label: "Freight" },
          { icon: Truck, label: "Details" }
        ].map((item, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300",
              step > i + 1 ? "border-green-500 bg-green-50 text-green-500" : 
              step === i + 1 ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg" : 
              "border-muted text-muted-foreground"
            )}>
              {step > i + 1 ? <CheckCircle2 className="w-6 h-6" /> : <item.icon className="w-6 h-6" />}
            </div>
            <span className={cn(
              "mt-2 text-xs font-bold uppercase tracking-wider",
              step === i + 1 ? "text-primary" : "text-muted-foreground"
            )}>{item.label}</span>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-primary/10 shadow-xl">
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pickup_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Region (e.g. Douala, Littoral)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="delivery_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Region (e.g. Yaoundé, Centre)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="scheduled_pickup_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Pickup Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="datetime-local" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="freight_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Freight Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Agricultural Products, Construction Materials" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                          <FormLabel>Quantity / Pieces</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="preferred_vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Vehicle Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 10-Ton Flatbed, Van, Refrigerated" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="special_handling_requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Handling Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Fragile items, specific orientation, loading dock required, etc." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4">
            {step > 1 ? (
              <Button type="button" variant="outline" size="lg" onClick={prevStep} className="px-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : <div />}
            
            {step < 3 ? (
              <Button type="button" size="lg" onClick={nextStep} className="px-8">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={isLoading} className="px-12 bg-green-600 hover:bg-green-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Post to Marketplace
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}