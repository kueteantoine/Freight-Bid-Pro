"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export function NotificationSimulator() {
    return (
        <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-12 w-12 shadow-lg"
            onClick={() => {
                toast("New Job Offer", {
                    description: "Pickup at 123 Main St. - 150,000 XAF",
                    action: {
                        label: "View",
                        onClick: () => console.log("Navigate to job")
                    },
                });
            }}
        >
            <Bell className="h-6 w-6" />
        </Button>
    );
}
