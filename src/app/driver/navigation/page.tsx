"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getDriverJobs, DriverJob } from "@/app/actions/driver-jobs";
import { LocationTracker } from "@/components/driver/tracking/LocationTracker";
import { NavigationPanel } from "@/components/driver/tracking/NavigationPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Dynamically import Map to avoid SSR errors with mapbox-gl
const DriverMapView = dynamic(
    () => import("@/components/driver/tracking/DriverMapView"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Initializing Map Components...</p>
            </div>
        )
    }
);

export default function DriverNavigationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = searchParams.get("jobId");

    const [job, setJob] = useState<DriverJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!jobId) {
            router.push("/driver/dashboard");
            return;
        }

        async function loadJob() {
            const { jobs, error } = await getDriverJobs("active");
            if (error) {
                toast.error("Failed to load job details");
                router.push("/driver/dashboard");
                return;
            }

            const activeJob = jobs.find(j => j.shipment_id === jobId);
            if (!activeJob) {
                toast.error("Job not found or not active");
                router.push("/driver/dashboard");
                return;
            }

            setJob(activeJob);
            setLoading(false);
        }

        loadJob();
    }, [jobId, router]);

    if (loading || !job) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading navigation data...</p>
            </div>
        );
    }

    const pickup = { lat: job.shipment.pickup_latitude, lng: job.shipment.pickup_longitude };
    const delivery = { lat: job.shipment.delivery_latitude, lng: job.shipment.delivery_longitude };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-4 bg-background z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold leading-tight">{job.shipment.shipment_number}</h1>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        To: {job.shipment.delivery_location}
                    </p>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <DriverMapView
                    pickup={pickup}
                    delivery={delivery}
                    currentLocation={currentPos}
                />

                {/* Location Tracker (Headless) */}
                <LocationTracker
                    shipmentId={job.shipment_id}
                    pickupCoords={pickup}
                    deliveryCoords={delivery}
                    currentStatus={job.status as any}
                    onLocationUpdate={(lat, lng) => setCurrentPos({ lat, lng })}
                />

                {/* Bottom Navigation Panel */}
                <NavigationPanel
                    eta="1h 15m"
                    distanceRemaining="4.2 km"
                    nextInstruction="Turn right onto Avenue de l'Indépendance"
                    onCallShipper={() => window.location.href = "tel:+237-600000000"}
                    onReportIssue={() => toast.info("Opening issue report form...")}
                />
            </div>
        </div>
    );
}
