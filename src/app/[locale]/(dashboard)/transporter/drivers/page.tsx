import { Metadata } from "next";
import { DriverManagement } from "@/components/transporter/drivers/DriverManagement";

export const metadata: Metadata = {
    title: "Driver Management | Freight Bid Pro",
    description: "Manage your driver fleet, invitations, and assignments.",
};

export default function DriversPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
                <p className="text-muted-foreground">
                    Manage your drivers, send invitations, and assign them to vehicles.
                </p>
            </div>
            <DriverManagement />
        </div>
    );
}
