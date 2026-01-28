"use client";

import React, { useState } from "react";
import { useSession, UserRole } from "@/contexts/supabase-session-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Package, Truck, Users, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
      window.location.reload(); // Refresh to update context
    } catch (err) {
      toast.error("Failed to activate role.");
    } finally {
      setIsActivating(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account, roles, and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile">Global Profile</TabsTrigger>
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Global Account</CardTitle>
              <CardDescription>Update your primary account information used across all roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+237 ..." defaultValue={user?.user_metadata?.phone_number} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Roles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Active Roles
              </h3>
              {userRoles.map((role) => (
                <Card key={role} className={role === activeRole ? "border-primary bg-primary/5" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background border">
                        {role === 'shipper' && <Package className="h-5 w-5 text-blue-600" />}
                        {role === 'carrier' && <Truck className="h-5 w-5 text-green-600" />}
                        {role === 'driver' && <Users className="h-5 w-5 text-orange-600" />}
                        {role === 'broker' && <Shield className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-bold capitalize">{role}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">Verified</Badge>
                      </div>
                    </div>
                    {role === activeRole && <Badge>Active Session</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Roles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Activate New Roles
              </h3>
              {inactiveRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">You have activated all available roles.</p>
              ) : (
                inactiveRoles.map((role) => (
                  <Card key={role}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {role === 'shipper' && <Package className="h-5 w-5 text-muted-foreground" />}
                          {role === 'carrier' && <Truck className="h-5 w-5 text-muted-foreground" />}
                          {role === 'driver' && <Users className="h-5 w-5 text-muted-foreground" />}
                          {role === 'broker' && <Shield className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-bold capitalize">{role}</p>
                          <p className="text-xs text-muted-foreground">Requires verification</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleActivateRole(role)}
                        disabled={isActivating === role}
                      >
                        {isActivating === role ? "Activating..." : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>Customize your platform experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">English</Button>
                  <Button variant="outline" className="flex-1">Français</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Badge variant="secondary" className="text-lg py-1 px-4">XAF (CFA Franc)</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}