"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "./file-upload";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/hooks/use-user-data";
import { User } from "@supabase/supabase-js";

interface RoleVerificationFormProps {
  role: UserRole;
}

const roleDocs: Record<UserRole, { label: string; desc: string; key: string }[]> = {
  shipper: [
    { label: "Business Registration", desc: "Company registration certificate or equivalent", key: "business_reg" },
    { label: "Tax Identification", desc: "Proof of tax registration (e.g. NIU)", key: "tax_id" }
  ],
  transporter: [
    { label: "Transport License", desc: "Official license to operate as a transporter", key: "transport_license" },
    { label: "Insurance Certificate", desc: "Commercial vehicle insurance for your fleet", key: "fleet_insurance" },
    { label: "Business Registration", desc: "Official business registration documents", key: "business_reg" }
  ],
  driver: [
    { label: "Driver's License", desc: "Valid professional driver's license", key: "license" },
    { label: "National ID", desc: "Front and back of your National Identity Card", key: "national_id" },
    { label: "Professional Certification", desc: "Any relevant professional driving certifications", key: "pro_cert" }
  ],
  broker: [
    { label: "Brokerage License", desc: "Official license to operate as a freight broker", key: "broker_license" },
    { label: "Professional Insurance", desc: "Liability insurance for brokerage operations", key: "pro_insurance" }
  ],
  admin: []
};

export function RoleVerificationForm({ role }: RoleVerificationFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const requiredDocs = roleDocs[role] || [];
  const isComplete = requiredDocs.every(doc => documents[doc.key]);

  const handleUpload = (key: string, url: string) => {
    setDocuments(prev => ({ ...prev, [key]: url }));
  };

  const handleSubmit = async () => {
    if (!user || !isComplete) return;

    setIsSubmitting(true);
    try {
      if (role === 'driver') {
        // Driver specific table storage
        const docPromises = Object.entries(documents).map(([type, url]) =>
          supabase.from('driver_documents').insert({
            driver_user_id: user.id,
            document_type: type as any,
            document_url: url,
            verification_status: 'pending'
          })
        );
        await Promise.all(docPromises);
      }

      // Update the user_role status and JSONB metadata
      const { error } = await supabase
        .from('user_roles')
        .update({
          verification_status: 'pending',
          verification_documents: documents,
          activated_at: null // Reset activation if it was previously rejected
        })
        .eq('user_id', user.id)
        .eq('role_type', role);

      if (error) throw error;

      toast.success("Verification documents submitted for review!");
      router.push("/settings");
    } catch (error: any) {
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="capitalize">{role} Verification</CardTitle>
            <CardDescription>Submit the required documents to unlock full platform features.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {requiredDocs.map((doc) => (
            <FileUpload
              key={doc.key}
              label={doc.label}
              description={doc.desc}
              path={`${user?.id}/${role}/${doc.key}`}
              onUploadComplete={(url) => handleUpload(doc.key, url)}
            />
          ))}
        </div>

        <div className="bg-muted/30 rounded-xl p-4 flex gap-4 items-start border border-dashed border-muted-foreground/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Important Submission Policy</p>
            <p>Documents are typically reviewed within 24-48 business hours. Ensure all photos are clear, text is legible, and documents are not expired to avoid rejection.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            className="w-full h-12 text-lg font-bold rounded-xl shadow-lg"
            disabled={!isComplete || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            Submit for Review
          </Button>
          {!isComplete && (
            <p className="text-center text-xs text-muted-foreground font-medium">
              Please upload all required documents to proceed.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}