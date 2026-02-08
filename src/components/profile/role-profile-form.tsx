"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Package, Truck, Users, Shield, CalendarIcon, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { UserRole } from "@/hooks/use-user-data";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";

// --- Zod Schemas ---
const shipperProfileSchema = z.object({
  company_name: z.string().min(2, "Company name is required."),
  business_reg_number: z.string().min(5, "Registration number is required."),
  tax_id: z.string().min(5, "Tax ID is required."),
  industry_type: z.string().min(2, "Industry type is required."),
  billing_address: z.string().min(10, "Billing address is required."),
  preferred_freight_types: z.array(z.string()).optional(),
});

const transporterProfileSchema = z.object({
  company_name: z.string().min(2, "Company name is required."),
  fleet_size: z.coerce.number().min(1, "Fleet size must be at least 1."),
  business_license_number: z.string().min(5, "License number is required."),
  insurance_details: z.string().min(5, "Insurance details are required."),
  operating_regions: z.string().min(2, "Operating regions are required."),
});

const driverProfileSchema = z.object({
  full_name: z.string().min(5, "Full name is required."),
  date_of_birth: z.string().min(1, "Date of birth is required."),
  license_number: z.string().min(5, "License number is required."),
  license_expiry: z.string().min(1, "License expiry date is required."),
  emergency_contact: z.string().min(8, "Emergency contact is required."),
});

const brokerProfileSchema = z.object({
  broker_license_number: z.string().min(5, "Broker license number is required."),
  commission_rates: z.string().min(1, "Commission rates description is required."),
  service_areas: z.string().min(2, "Service areas are required."),
});

type RoleProfileKey =
  | 'company_name'
  | 'business_reg_number'
  | 'tax_id'
  | 'industry_type'
  | 'billing_address'
  | 'fleet_size'
  | 'business_license_number'
  | 'insurance_details'
  | 'operating_regions'
  | 'full_name'
  | 'date_of_birth'
  | 'license_number'
  | 'license_expiry'
  | 'emergency_contact'
  | 'broker_license_number'
  | 'commission_rates'
  | 'broker_license_number'
  | 'commission_rates'
  | 'service_areas'
  | 'preferred_freight_types';

type ProfileValues = Partial<Record<RoleProfileKey, string | number | string[]>>;

type ProfileSchema = z.ZodObject<any>;

const schemaMap: Record<UserRole, ProfileSchema> = {
  shipper: shipperProfileSchema,
  transporter: transporterProfileSchema,
  driver: driverProfileSchema,
  broker: brokerProfileSchema,
  admin: z.object({}),
};

const fieldConfig: Record<UserRole, { name: RoleProfileKey; label: string; type?: string; placeholder?: string }[]> = {
  shipper: [
    { name: "company_name", label: "Company Name" },
    { name: "business_reg_number", label: "Business Registration Number" },
    { name: "tax_id", label: "Tax ID (NIU)" },
    { name: "industry_type", label: "Industry Type", placeholder: "e.g., Manufacturing, Retail" },
    { name: "preferred_freight_types", label: "Preferred Freight Types", type: "tags", placeholder: "Add types..." },
    { name: "billing_address", label: "Billing Address", type: "textarea" },
  ],
  transporter: [
    { name: "company_name", label: "Company Name" },
    { name: "fleet_size", label: "Fleet Size (Number of Vehicles)", type: "number" },
    { name: "business_license_number", label: "Business License Number" },
    { name: "insurance_details", label: "Insurance Details Summary", type: "textarea" },
    { name: "operating_regions", label: "Operating Regions", placeholder: "e.g., Littoral, Centre, West" },
  ],
  driver: [
    { name: "full_name", label: "Full Name" },
    { name: "date_of_birth", label: "Date of Birth", type: "date" },
    { name: "license_number", label: "Driver's License Number" },
    { name: "license_expiry", label: "License Expiry Date", type: "date" },
    { name: "emergency_contact", label: "Emergency Contact Phone", placeholder: "+237..." },
  ],
  broker: [
    { name: "broker_license_number", label: "Brokerage License Number" },
    { name: "commission_rates", label: "Commission Rates Description", type: "textarea" },
    { name: "service_areas", label: "Service Areas", placeholder: "e.g., Cameroon, Nigeria, Chad" },
  ],
  admin: [],
};

const roleIconMap: Record<UserRole, any> = {
  shipper: Package,
  transporter: Truck,
  driver: Users,
  broker: Shield,
  admin: Shield,
};

interface RoleProfileFormProps {
  role: UserRole;
  initialData: any;
  verificationStatus: string;
}

export function RoleProfileForm({ role, initialData, verificationStatus }: RoleProfileFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const CurrentSchema = schemaMap[role];
  const fields = fieldConfig[role];
  const RoleIcon = roleIconMap[role];
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (field: any, value: string) => {
    if (!value.trim()) return;
    const currentTags = (field.value as string[]) || [];
    if (!currentTags.includes(value.trim())) {
      field.onChange([...currentTags, value.trim()]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (field: any, tagToRemove: string) => {
    const currentTags = (field.value as string[]) || [];
    field.onChange(currentTags.filter((tag: string) => tag !== tagToRemove));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(CurrentSchema),
    defaultValues: initialData || {},
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const calculateCompleteness = () => {
    const totalFields = fields.length;
    if (totalFields === 0) return 100;

    let completedFields = 0;
    const currentValues = form.getValues();

    fields.forEach(field => {
      const value = currentValues[field.name];
      if (value && String(value).trim() !== "" && value !== 0) {
        completedFields++;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  };

  const completeness = calculateCompleteness();

  async function onSubmit(values: ProfileValues) {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({
          role_specific_profile: values,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("role_type", role);

      if (error) throw error;

      toast.success(`${role} profile updated successfully!`);
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (role === 'admin') return null;

  return (
    <Card className="border-border shadow-xl">
      <CardHeader className="bg-muted/10 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <RoleIcon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="capitalize">{role} Profile Details</CardTitle>
            <CardDescription>Specific information required for your operations as a {role}.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 p-4 border rounded-lg flex justify-between items-center bg-background shadow-inner">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Profile Completeness</p>
            <p className="text-xs text-muted-foreground">Fill out all fields to ensure maximum visibility and trust.</p>
          </div>
          <div className="text-2xl font-bold text-primary">{completeness}%</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as keyof ProfileValues}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea
                            placeholder={field.placeholder}
                            className="min-h-[100px]"
                            {...formField}
                          />
                        ) : field.type === "date" ? (
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              className="pl-10"
                              {...formField}
                              value={formField.value ? String(formField.value).split('T')[0] : ''}
                              onChange={(e) => formField.onChange(e.target.value)}
                            />
                          </div>
                        ) : field.type === "tags" ? (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder={field.placeholder}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag(formField, tagInput);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleAddTag(formField, tagInput)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(formField.value as string[] || []).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1">
                                  {tag}
                                  <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => handleRemoveTag(formField, tag)}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Common types: General Cargo, Perishable, Hazardous, Fragile
                            </p>
                          </div>
                        ) : (
                          <Input
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value === 0 && field.type === 'number' ? '' : formField.value}
                            onChange={(e) => {
                              if (field.type === 'number') {
                                formField.onChange(e.target.value === '' ? 0 : Number(e.target.value));
                              } else {
                                formField.onChange(e.target.value);
                              }
                            }}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <Button type="submit" className="w-full rounded-full h-12 text-lg font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save {role} Profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}