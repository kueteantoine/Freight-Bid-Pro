import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Truck, TrendingUp } from "lucide-react";

export default function CarrierDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary">Carrier Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Loads
            </CardTitle>
            <Briefcase className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">
              Matching your fleet capacity
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Bids
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              4 bids currently winning
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fleet Utilization
            </CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">
              Target: 80%
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-6 bg-card rounded-xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold mb-4">Load Matching</h3>
        <p className="text-muted-foreground">View the load board to find new opportunities.</p>
      </div>
    </div>
  );
}