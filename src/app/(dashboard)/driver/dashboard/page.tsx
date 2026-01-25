import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary">Driver Dashboard</h2>
      
      <div className="flex justify-center">
        <Button size="lg" className="w-full max-w-xs h-16 text-lg rounded-full bg-green-600 hover:bg-green-700 transition-all shadow-lg">
          Online (Available)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Job
            </CardTitle>
            <MapPin className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pickup: Douala</div>
            <p className="text-xs text-muted-foreground">
              Next stop in 15 min
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ETA
            </CardTitle>
            <Clock className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14:30 CAT</div>
            <p className="text-xs text-muted-foreground">
              Estimated delivery time
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Earnings
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,000 XAF</div>
            <p className="text-xs text-muted-foreground">
              Pending payment: 5,000 XAF
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-6 bg-card rounded-xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold mb-4">Job Assignments</h3>
        <p className="text-muted-foreground">Waiting for new assignments from your carrier.</p>
      </div>
    </div>
  );
}