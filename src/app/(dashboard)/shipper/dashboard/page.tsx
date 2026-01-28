"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, DollarSign, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ShipperDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Shipper Dashboard Overview</h2>
        <Button asChild className="rounded-full shadow-lg">
          <Link href="/shipper/bookings/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Book Shipment
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">
              Active Shipments
            </CardTitle>
            <Package className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">12</div>
            <p className="text-sm text-muted-foreground mt-1">
              +5 shipments this week
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              Open Bids
            </CardTitle>
            <DollarSign className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">4</div>
            <p className="text-sm text-muted-foreground mt-1">
              Waiting for carrier response
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Carriers
            </CardTitle>
            <Truck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">85</div>
            <p className="text-sm text-muted-foreground mt-1">
              Available in your region
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-8 bg-card rounded-xl shadow-2xl border border-border">
          <h3 className="text-2xl font-bold mb-4 text-primary">Get Started</h3>
          <p className="text-lg text-muted-foreground mb-6">
            Post your first shipment to receive competitive bids from our verified carrier network.
          </p>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/shipper/bookings/new">
              Create My First Load <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="p-8 bg-card rounded-xl shadow-2xl border border-border flex flex-col justify-center items-center text-center">
          <Truck className="h-12 w-12 text-primary/40 mb-4" />
          <h3 className="text-xl font-bold mb-2">Fleet Visibility</h3>
          <p className="text-muted-foreground">
            Once your shipment is awarded, you'll see real-time tracking here.
          </p>
        </div>
      </div>
    </div>
  );
}