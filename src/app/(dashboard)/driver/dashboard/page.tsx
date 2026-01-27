import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriverDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-primary">Driver Dashboard Overview</h2>
      
      <div className="flex justify-center">
        <Button size="lg" className="w-full max-w-sm h-16 text-xl font-bold rounded-full bg-green-600 hover:bg-green-700 transition-all shadow-2xl hover:shadow-green-500/50">
          Online (Available)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-accent/20 border-accent shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">
              Current Job
            </CardTitle>
            <MapPin className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">Pickup: Douala</div>
            <p className="text-sm text-muted-foreground mt-1">
              Next stop in 15 min
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              ETA
            </CardTitle>
            <Clock className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">14:30 CAT</div>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated delivery time
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/20 border-primary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Today's Earnings
            </CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">15,000 XAF</div>
            <p className="text-sm text-muted-foreground mt-1">
              Pending payment: 5,000 XAF
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-8 bg-card rounded-xl shadow-2xl border border-border">
        <h3 className="text-2xl font-bold mb-4 text-primary">Job Assignments</h3>
        <p className="text-lg text-muted-foreground">Waiting for new assignments from your carrier.</p>
      </div>
    </div>
  );
}