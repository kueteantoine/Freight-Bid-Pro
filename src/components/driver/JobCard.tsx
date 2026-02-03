"use client"

import { MapPin, Calendar, DollarSign, Clock } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Job {
    id: string
    pickupLocation: string
    deliveryLocation: string
    pickupTime: string
    deliveryTime: string
    earnings: number
    distance: string
    status: "assigned" | "active" | "completed"
}

interface JobCardProps {
    job: Job
    onViewDetails?: (id: string) => void
}

export function JobCard({ job, onViewDetails }: JobCardProps) {
    return (
        <Card className="mb-4 overflow-hidden border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 pb-2">
                <div className="flex justify-between items-start mb-3">
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>
                        {job.status === "active" ? "In Progress" : "Upcoming"}
                    </Badge>
                    <div className="flex items-center text-green-600 font-bold">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.earnings.toLocaleString()}
                    </div>
                </div>

                <div className="space-y-4 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[7px] top-2 bottom-6 w-0.5 bg-gray-200" />

                    {/* Pickup */}
                    <div className="flex gap-3 relative z-10">
                        <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 mt-1 shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Pickup</p>
                            <p className="text-sm font-medium line-clamp-1">{job.pickupLocation}</p>
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(job.pickupTime).toLocaleDateString()}
                                <Clock className="h-3 w-3 ml-2 mr-1" />
                                {new Date(job.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex gap-3 relative z-10">
                        <div className="w-4 h-4 rounded-full bg-orange-100 border-2 border-orange-500 mt-1 shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Delivery</p>
                            <p className="text-sm font-medium line-clamp-1">{job.deliveryLocation}</p>
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(job.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="mx-2">•</span>
                                <span>{job.distance}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-2">
                <Button
                    className="w-full"
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(job.id)}
                >
                    View Details
                </Button>
            </CardFooter>
        </Card>
    )
}
