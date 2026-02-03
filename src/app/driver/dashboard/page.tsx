"use client"

import { useState } from "react"
import { Settings, Bell, ChevronRight, Wallet } from "lucide-react"
import { DriverLayout } from "@/components/driver/DriverLayout"
import { StatusToggle, DriverStatus } from "@/components/driver/StatusToggle"
import { JobCard, Job } from "@/components/driver/JobCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { DriverThemeToggle } from "@/components/driver/DriverThemeToggle"

// Mock Data
const MOCK_JOBS: Job[] = [
    {
        id: "1",
        pickupLocation: "Douala Port, Terminal 2",
        deliveryLocation: "Yaoundé Distribution Center",
        pickupTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        deliveryTime: new Date(Date.now() + 18000000).toISOString(), // +5 hours
        earnings: 45000,
        distance: "240 km",
        status: "assigned",
    },
    {
        id: "2",
        pickupLocation: "Kribi Deep Sea Port",
        deliveryLocation: "Edea Industrial Zone",
        pickupTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        deliveryTime: new Date(Date.now() + 90000000).toISOString(),
        earnings: 32000,
        distance: "95 km",
        status: "assigned",
    }
]

export default function DriverDashboardPage() {
    const [status, setStatus] = useState<DriverStatus>("offline")

    return (
        <DriverLayout>
            {/* Header */}
            <header className="bg-primary text-primary-foreground p-6 pb-12 rounded-b-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                    <DriverThemeToggle />
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/20">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/20">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold">Hello, John</h1>
                    <p className="text-primary-foreground/80">Ready to hit the road?</p>
                </div>
            </header>

            <div className="px-4 -mt-8 space-y-6">
                {/* Status Toggle */}
                <div className="bg-background rounded-xl shadow-lg p-2">
                    <StatusToggle status={status} onStatusChange={setStatus} />
                </div>

                {/* Earnings Summary */}
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase">Today's Earnings</p>
                            <h2 className="text-3xl font-bold mt-1">
                                12,500 <span className="text-sm font-normal text-gray-400">XAF</span>
                            </h2>
                        </div>
                        <div className="bg-white/10 p-3 rounded-full">
                            <Wallet className="h-6 w-6 text-green-400" />
                        </div>
                    </CardContent>
                    <div className="px-4 pb-3">
                        <Button variant="link" className="text-gray-300 text-xs p-0 h-auto hover:text-white group">
                            View History <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </div>
                </Card>

                {/* Quick Actions or Job Queue */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Upcoming Jobs</h3>
                        <Button variant="link" size="sm" className="text-muted-foreground">View All</Button>
                    </div>

                    <div className="space-y-4">
                        {MOCK_JOBS.map((job) => (
                            <JobCard key={job.id} job={job} onViewDetails={(id) => console.log("View job", id)} />
                        ))}
                    </div>
                </div>

            </div>
        </DriverLayout>
    )
}
