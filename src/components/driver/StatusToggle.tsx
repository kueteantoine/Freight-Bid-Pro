"use client"

import * as React from "react"
import { Power, Radio, Truck } from "lucide-react"

import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"

export type DriverStatus = "available" | "on_trip" | "offline"

interface StatusToggleProps {
    status: DriverStatus
    onStatusChange: (status: DriverStatus) => void
}

export function StatusToggle({ status, onStatusChange }: StatusToggleProps) {
    return (
        <ToggleGroup
            type="single"
            value={status}
            onValueChange={(value) => {
                if (value) onStatusChange(value as DriverStatus)
            }}
            className="w-full justify-between gap-4"
        >
            <ToggleGroupItem
                value="available"
                aria-label="Toggle available"
                className="flex-1 flex-col h-auto py-4 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-200 border border-transparent"
            >
                <Radio className="h-6 w-6 mb-2" />
                <span className="text-xs font-semibold">Available</span>
            </ToggleGroupItem>

            <ToggleGroupItem
                value="on_trip"
                aria-label="Toggle on trip"
                className="flex-1 flex-col h-auto py-4 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 border border-transparent"
            >
                <Truck className="h-6 w-6 mb-2" />
                <span className="text-xs font-semibold">On Trip</span>
            </ToggleGroupItem>

            <ToggleGroupItem
                value="offline"
                aria-label="Toggle offline"
                className="flex-1 flex-col h-auto py-4 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700 data-[state=on]:border-gray-200 border border-transparent"
            >
                <Power className="h-6 w-6 mb-2" />
                <span className="text-xs font-semibold">Offline</span>
            </ToggleGroupItem>
        </ToggleGroup>
    )
}
