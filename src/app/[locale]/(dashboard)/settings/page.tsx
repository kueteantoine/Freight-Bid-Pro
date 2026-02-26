"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Package, Truck, Users, CheckCircle2, AlertCircle, Plus, ArrowRight, ShieldAlert, Loader2, UserCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUserData, UserRole } from "@/hooks/use-user-data";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { GlobalProfileForm } from "@/components/profile/global-profile-form";
import { RoleProfileForm } from "@/components/profile/role-profile-form";
import { User } from "@supabase/supabase-js";
import { FeaturedBadge } from "@/components/ads/featured-badge";


const roleIconMap: Record<UserRole, any> = {
  shipper: Package,
  transporter: Truck,
  driver: Users,
  broker: Shield,
  admin: ShieldAlert,
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  verified: { label: "Verified", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  pending: { label: "Pending Review", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const { profile, roles: allRoles, isLoading: isDataLoading } = useUserData();
  const [isActivating, setIsActivating] = useState<UserRole | null>(null);
  const [tier, setTier] = useState<any>(null);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPendingLang, startTransitionLang] = useTransition();

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    const urlSegments = pathname.split('/');
    if (urlSegments[1] === 'en' || urlSegments[1] === 'fr') {
      urlSegments.splice(1, 1);
    }
    const newPath = `/${newLocale}${urlSegments.join('/')}`.replace('//', '/');

    startTransitionLang(() => {
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      router.replace(newPath);
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (user) {
      const fetchTier = async () => {
        const { getUserSubscriptionTier } = await import("@/lib/subscription-helpers");
        const sub = await getUserSubscriptionTier(user.id);
        setTier(sub?.tier);
      };
      fetchTier();
    }
  }, [user]);

  const availableRoles: UserRole[] = ["shipper", "transporter", "driver", "broker"];


  const activeRoleTypes = allRoles.map(r => r.role_type);
  const inactiveRoles = availableRoles.filter(r => !activeRoleTypes.includes(r));

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

  if (isDataLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AuthLoading />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Account & Security</h2>
        <p className="text-muted-foreground">Manage your credentials, role authorizations, and personal data.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted/30 p-1 h-12 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:shadow-md">Personal Info</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg data-[state=active]:shadow-md">Workspaces & Roles</TabsTrigger>
          {activeRoleTypes.map(role => (
            <TabsTrigger key={role} value={role} className="rounded-lg data-[state=active]:shadow-md capitalize">
              {role} Profile
            </TabsTrigger>
          ))}
          <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:shadow-md">Global Prefs</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="profile" className="space-y-8">
          <Card className="border-border shadow-md">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle>Global Identity</CardTitle>
              <CardDescription>Primary information used to verify your identity across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <AvatarUpload />
                  {tier && (
                    <div className="absolute -bottom-2 -right-2">
                      <FeaturedBadge tierSlug={tier.tier_slug} size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                </div>
              </div>


              <GlobalProfileForm
                initialData={{
                  first_name: profile?.first_name || "",
                  last_name: profile?.last_name || "",
                  phone_number: profile?.phone_number || "",
                }}
              />

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="email" className="font-bold">Registered Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted border-muted-foreground/10 font-medium" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Roles Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Active Roles
              </h3>
              <div className="grid gap-4">
                {allRoles.map((roleData) => {
                  const role = roleData.role_type;
                  const RoleIcon = roleIconMap[role];
                  const status = statusConfig[roleData.verification_status] || statusConfig.pending;

                  return (
                    <Card key={role} className={cn(
                      "border-border shadow-sm overflow-hidden transition-all hover:shadow-md",
                      roleData.is_active && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}>
                      <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-muted/50 border shadow-inner">
                            <RoleIcon className={cn("h-6 w-6", status.color.includes("green") ? "text-green-600" : "text-primary")} />
                          </div>
                          <div>
                            <p className="font-bold text-lg capitalize flex items-center gap-2">
                              {role}
                              {roleData.is_active && (
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Active</Badge>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tighter", status.color)}>
                                <status.icon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:text-primary">
                          <Link href={`/settings/verification/${role}`}>
                            {roleData.verification_status === 'pending' ? 'View Status' : 'Manage Docs'} <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
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
                  inactiveRoles.map((role) => {
                    const RoleIcon = roleIconMap[role];
                    return (
                      <Card key={role} className="border-border hover:border-primary/30 transition-colors">
                        <CardContent className="flex items-center justify-between p-5">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-muted/20 grayscale opacity-60">
                              <RoleIcon className="h-6 w-6" />
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
                            {isActivating === role ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Activate"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Role Specific Profile Tabs */}
        {allRoles.map((roleData) => (
          <TabsContent key={roleData.role_type} value={roleData.role_type}>
            <RoleProfileForm
              role={roleData.role_type}
              initialData={roleData.role_specific_profile}
              verificationStatus={roleData.verification_status}
            />
          </TabsContent>
        ))}

        {/* Global Preferences Tab */}
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
                  <Button
                    variant="outline"
                    className={cn("h-12 font-bold", locale === 'en' ? "border-primary/20 bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted")}
                    onClick={() => switchLanguage('en')}
                    disabled={isPendingLang}
                  >
                    English (UK)
                  </Button>
                  <Button
                    variant="outline"
                    className={cn("h-12 font-bold", locale === 'fr' ? "border-primary/20 bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted")}
                    onClick={() => switchLanguage('fr')}
                    disabled={isPendingLang}
                  >
                    Français (CM)
                  </Button>
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