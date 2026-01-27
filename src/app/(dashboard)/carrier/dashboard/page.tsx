import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Truck, TrendingUp } from "lucide-react";

export default function CarrierDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-primary">Carrier Dashboard Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">
              Available Loads
            </CardTitle>
            <Briefcase className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">25</div>
            <p className="text-sm text-muted-foreground mt-1">
              Matching your fleet capacity
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              Active Bids
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">8</div>
            <p className="text-sm text-muted-foreground mt-1">
              4 bids currently winning
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Fleet Utilization
            </CardTitle>
            <Truck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">65%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Target: 80%
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-8 bg-card rounded-xl shadow-2xl border border-border">
        <h3 className="text-2xl font-bold mb-4 text-primary">Load Matching</h3>
        <p className="text-lg text-muted-foreground">View the load board to find new opportunities.</p>
      </div>
    </div>
  );
}