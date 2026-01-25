import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, FileText } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">Platform Administration</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-red-100 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              New documents awaiting review
            </p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-100 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Disputes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-100 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">
              Shippers, Carriers, Drivers, Brokers
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-6 bg-card rounded-xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold mb-4">System Health</h3>
        <p className="text-muted-foreground">All systems operational. Check user activity logs.</p>
      </div>
    </div>
  );
}