import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, DollarSign } from "lucide-react";

export default function ShipperDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary">Shipper Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Shipments
            </CardTitle>
            <Package className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +5 shipments this week
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Bids
            </CardTitle>
            <DollarSign className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Waiting for carrier response
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Carriers
            </CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">
              Available in your region
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-6 bg-card rounded-xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <p className="text-muted-foreground">Start by creating a new shipment request.</p>
      </div>
    </div>
  );
}