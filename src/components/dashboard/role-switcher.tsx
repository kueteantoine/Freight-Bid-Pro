"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, UserCircle, Shield, Truck, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { useActiveRole } from "@/hooks/use-active-role";

export type UserRole = "shipper" | "transporter" | "driver" | "broker" | "admin";

const roleConfig: Record<UserRole, { label: string; icon: any; color: string }> = {
  shipper: { label: "Shipper", icon: Package, color: "text-blue-600" },
  transporter: { label: "Transporter", icon: Truck, color: "text-green-600" },
  driver: { label: "Driver", icon: Users, color: "text-orange-600" },
  broker: { label: "Broker", icon: Shield, color: "text-purple-600" },
  admin: { label: "Administrator", icon: Shield, color: "text-red-600" },
};

export function RoleSwitcher({
  currentRole,
  availableRoles
}: {
  currentRole: UserRole | null,
  availableRoles: UserRole[]
}) {
  const { switchRole } = useActiveRole();

  const handleRoleSwitch = async (role: UserRole) => {
    await switchRole(role);
  };

  if (availableRoles.length <= 1) {
    const role = currentRole || availableRoles[0];
    if (!role) return null;
    const config = roleConfig[role];
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border">
        <config.icon className={cn("h-4 w-4", config.color)} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  }

  const activeConfig = currentRole ? roleConfig[currentRole] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 hover:border-primary/50 transition-all">
          {activeConfig && <activeConfig.icon className={cn("h-4 w-4", activeConfig.color)} />}
          <span className="font-semibold">{activeConfig?.label || "Select Role"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
          Switch Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => {
          const config = roleConfig[role];
          const isActive = currentRole === role;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={cn(
                "flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer mb-1 last:mb-0",
                isActive ? "bg-primary/5 text-primary font-medium" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <config.icon className={cn("h-4 w-4", config.color)} />
                <span>{config.label}</span>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href="/settings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <UserCircle className="h-4 w-4" />
            <span>Add New Role</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}