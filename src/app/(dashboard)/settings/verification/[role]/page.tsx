"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { UserRole } from "@/contexts/supabase-session-context";
import { RoleVerificationForm } from "@/components/verification/role-verification-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function RoleVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as UserRole;

  const validRoles: UserRole[] = ["shipper", "carrier", "driver", "broker"];
  
  if (!validRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold">Invalid Role</h2>
        <p className="text-muted-foreground">The requested verification role does not exist.</p>
        <Button asChild>
          <Link href="/settings">Back to Settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 shadow-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Identity Verification</h1>
            <p className="text-muted-foreground">Complete your profile as a <span className="capitalize font-semibold text-foreground">{role}</span>.</p>
          </div>
        </div>
        
        <Button variant="ghost" className="rounded-full gap-2 text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Verification FAQ</span>
        </Button>
      </div>

      <RoleVerificationForm role={role} />
    </div>
  );
}