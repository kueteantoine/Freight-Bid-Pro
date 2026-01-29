import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign } from "lucide-react";

export default function BrokerDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-primary">Broker Dashboard Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">
              Active Clients
            </CardTitle>
            <Users className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">18 Shippers</div>
            <p className="text-sm text-muted-foreground mt-1">
              +5 new transporters this month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              Pending Commissions
            </CardTitle>
            <DollarSign className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">125,000 XAF</div>
            <p className="text-sm text-muted-foreground mt-1">
              Awaiting payment settlement
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Load Match Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">92%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Successfully matched loads
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-8 bg-card rounded-xl shadow-2xl border border-border">
        <h3 className="text-2xl font-bold mb-4 text-primary">Mediation & Optimization</h3>
        <p className="text-lg text-muted-foreground">Manage your shipper and transporter networks efficiently.</p>
      </div>
    </div>
  );
}