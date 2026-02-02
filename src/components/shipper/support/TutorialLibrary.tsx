"use client";

import React from "react";
import { PlayCircle, Clock, ArrowRight, ExternalLink, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const TutorialLibrary = () => {
    const tutorials = [
        {
            id: 1,
            title: "Creating Your First Shipment",
            description: "Learn how to use the multi-step booking form to post your first load to the marketplace.",
            duration: "3:45",
            category: "Getting Started",
            thumbnail: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 2,
            title: "Understanding Bid Quotations",
            description: "How to compare carrier bids, check ratings, and understand fee breakdowns.",
            duration: "5:20",
            category: "Bidding",
            thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 3,
            title: "Real-time Tracking & Map",
            description: "Using the live tracking dashboard to monitor your shipments in transit.",
            duration: "2:15",
            category: "Operations",
            thumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 4,
            title: "Managing Mobile Money Payments",
            description: "Securely paying for shipments via Orange Money or MTN MoMo.",
            duration: "4:30",
            category: "Payments",
            thumbnail: "https://images.unsplash.com/photo-1563013544-824ae14f4826?auto=format&fit=crop&q=80&w=400"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <Video className="w-6 h-6 text-primary" />
                        Video Tutorials
                    </h2>
                    <p className="text-sm text-slate-500">Quick guides to help you master the platform</p>
                </div>
                <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="group overflow-hidden border-slate-200 hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={tutorial.thumbnail}
                                alt={tutorial.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <PlayCircle className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                                {tutorial.duration}
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-2">
                            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold h-5">
                                {tutorial.category}
                            </Badge>
                            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                {tutorial.title}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
                                {tutorial.description}
                            </p>
                        </CardContent>
                        <CardFooter className="px-4 pb-4 pt-0">
                            <Button variant="ghost" className="w-full text-xs font-semibold h-8 rounded-lg border border-slate-100 hover:bg-slate-50">
                                Watch Now
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-r from-primary to-indigo-600 border-none text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-bold">Need a live walkthrough?</h3>
                        <p className="text-white/80 max-w-lg">
                            Schedule a 15-minute onboarding session with one of our support specialists to help you set up your shipper account.
                        </p>
                    </div>
                    <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/10">
                        Schedule Demo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

// Internal utility
const ChevronRight = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);
