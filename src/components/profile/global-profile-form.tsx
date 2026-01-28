"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/supabase-session-context";

const globalProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  phone_number: z.string().min(8, "Phone number is required."),
});

type GlobalProfileValues = z.infer<typeof globalProfileSchema>;

interface GlobalProfileFormProps {
  initialData: {
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
  };
}

export function GlobalProfileForm({ initialData }: GlobalProfileFormProps) {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<GlobalProfileValues>({
    resolver: zodResolver(globalProfileSchema),
    defaultValues: {
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      phone_number: initialData.phone_number || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      phone_number: initialData.phone_number || "",
    });
  }, [initialData, form]);

  async function onSubmit(values: GlobalProfileValues) {
    if (!user) return;
    setIsLoading(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          phone_number: values.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Optionally update auth.users metadata (for phone number consistency)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
            first_name: values.first_name,
            last_name: values.last_name,
            phone_number: values.phone_number,
        }
      });

      if (authError) console.warn("Failed to update auth metadata:", authError.message);


      toast.success("Personal information updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+237 6XX XXX XXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="rounded-full px-8 shadow-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}