"use client";

import React, { useState } from "react";
import { useSession, UserRole } from "@/contexts/supabase-session-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Package, Truck, Users, CheckCircle2, AlertCircle, Plus, ArrowRight, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, userRoles, activeRole } = useSession();
  const [isActivating, setIsActivating] = useState<UserRole | null>(null);

  const availableRoles: UserRole[] = ["shipper", "carrier", "driver", "broker"];
  const inactiveRoles = availableRoles.filter(r => !userRoles.includes(r));

  const handleActivateRole = async (role: UserRole) => {
    if (!user) return;
    setIsActivating(role);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role_type: role,
        is_active: true,
        verification_status: "pending",
      });

      if (error) throw error;
      toast.success(`${role} role activated! Please complete verification.`);
      window.location.reload(); 
    } catch (err) {
      toast.error("Failed to activate role.");
    } finally {
      setIsActivating(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Account & Security</h2>
        <p className="text-muted-foreground">Manage your credentials, role authorizations, and personal data.</p>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/30 p-1 h-12 rounded-xl">
          <TabsTrigger value="roles" className="rounded-lg data-[state=active]:shadow-md">Workspaces & Roles</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:shadow-md">Personal Info</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:shadow-md">Global Prefs</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Roles Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Active Roles
              </h3>
              <div className="grid gap-4">
                {userRoles.map((role) => (
                  <Card key={role} className={cn(
                    "border-border shadow-sm overflow-hidden transition-all hover:shadow-md",
                    role === activeRole && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}>
                    <CardContent className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted/50 border shadow-inner">
                          {role === 'shipper' && <Package className="h-6 w-6 text-blue-600" />}
                          {role === 'carrier' && <Truck className="h-6 w-6 text-green-600" />}
                          {role === 'driver' && <Users className="h-6 w-6 text-orange-600" />}
                          {role === 'broker' && <Shield className="h-6 w-6 text-purple-600" />}
                          {role === 'admin' && <ShieldAlert className="h-6 w-6 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg capitalize flex items-center gap-2">
                            {role}
                            {role === activeRole && (
                              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Active Workspace</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:text-primary">
                        <Link href={`/settings/verification/${role}`}>
                          Verification <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inactive Roles Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                <Plus className="h-6 w-6 text-primary" />
                Unlock Capabilities
              </h3>
              <div className="grid gap-4">
                {inactiveRoles.length === 0 ? (
                  <Card className="bg-muted/10 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <Shield className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">You have activated all available platform roles.</p>
                    </CardContent>
                  </Card>
                ) : (
                  inactiveRoles.map((role) => (
                    <Card key={role} className="border-border hover:border-primary/30 transition-colors">
                      <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-muted/20 grayscale opacity-60">
                            {role === 'shipper' && <Package className="h-6 w-6" />}
                            {role === 'carrier' && <Truck className="h-6 w-6" />}
                            {role === 'driver' && <Users className="h-6 w-6" />}
                            {role === 'broker' && <Shield className="h-6 w-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-lg capitalize">{role}</p>
                            <p className="text-xs text-muted-foreground">Requires document submission</p>
                          </div>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="rounded-full font-bold px-6"
                          onClick={() => handleActivateRole(role)}
                          disabled={isActivating === role}
                        >
                          {isActivating === role ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="border-border shadow-md">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle>Global Identity</CardTitle>
              <CardDescription>Primary information used to verify your identity across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Registered Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted border-muted-foreground/10 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Primary Phone</Label>
                  <Input id="phone" placeholder="+237 ..." defaultValue={user?.user_metadata?.phone_number} className="font-medium" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/5 border-t py-4">
              <Button className="rounded-full px-8 shadow-lg">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="border-border shadow-md">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle>Regional & UX Preferences</CardTitle>
              <CardDescription>Customize your units, language, and interface settings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <Label className="font-bold">Preferred Language</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-12 border-primary/20 bg-primary/5 text-primary font-bold">English (UK)</Button>
                  <Button variant="outline" className="h-12 text-muted-foreground hover:bg-muted">Français (CM)</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Platform Currency</Label>
                <div className="p-4 rounded-xl border bg-muted/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold">XAF - Central African CFA Franc</p>
                    <p className="text-xs text-muted-foreground">Standard for all regional transactions</p>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">System Default</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}