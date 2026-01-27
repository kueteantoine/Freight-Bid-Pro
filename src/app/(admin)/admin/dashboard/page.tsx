import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, FileText } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">Platform Administration Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-red-100 border-red-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Pending Verifications
            </CardTitle>
            <FileText className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-600">15</div>
            <p className="text-sm text-muted-foreground mt-1">
              New documents awaiting review
            </p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-100 border-yellow-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Open Disputes
            </CardTitle>
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-yellow-600">3</div>
            <p className="text-sm text-muted-foreground mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-100 border-green-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-600">1,245</div>
            <p className="text-sm text-muted-foreground mt-1">
              Shippers, Carriers, Drivers, Brokers
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="p-8 bg-card rounded-xl shadow-2xl border border-border">
        <h3 className="text-2xl font-bold mb-4 text-primary">System Health</h3>
        <p className="text-lg text-muted-foreground">All systems operational. Check user activity logs.</p>
      </div>
    </div>
  );
}