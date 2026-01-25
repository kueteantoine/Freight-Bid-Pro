import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign } from "lucide-react";

export default function BrokerDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary">Broker Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 Shippers</div>
            <p className="text-xs text-muted-foreground">
              +5 new carriers this month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Commissions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125,000 XAF</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment settlement
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Load Match Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              Successfully matched loads
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-6 bg-card rounded-xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold mb-4">Mediation & Optimization</h3>
        <p className="text-muted-foreground">Manage your shipper and carrier networks efficiently.</p>
      </div>
    </div>
  );
}