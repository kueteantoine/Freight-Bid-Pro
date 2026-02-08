"use client";

import React from "react";
import { CarrierProfileForm } from "@/components/transporter/profile/CarrierProfileForm";
import { supabase } from "@/lib/supabase/client";
import { FeaturedBadge } from "@/components/ads/featured-badge";

export default function TransporterProfilePage() {
    const [tier, setTier] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchTier = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { getUserSubscriptionTier } = await import("@/lib/subscription-helpers");
                const sub = await getUserSubscriptionTier(user.id);
                setTier(sub?.tier);
            }
        };
        fetchTier();
    }, []);


    return (
        <div className="space-y-10 pb-10">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Carrier Profile</h2>
                        {tier && <FeaturedBadge tierSlug={tier.tier_slug} size="lg" />}
                    </div>
                    <p className="text-slate-500 mt-1">
                        Manage your business information, operating regions, and insurance details.
                    </p>
                </div>
            </div>


            <CarrierProfileForm
                onSave={async (data) => {
                    console.log("Saving profile data:", data);
                    // In a real scenario, this would call a profile service
                    return new Promise((resolve) => setTimeout(resolve, 1000));
                }}
            />
        </div>
    );
}
