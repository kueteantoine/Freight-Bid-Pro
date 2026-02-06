import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Package, Briefcase, BarChart3 } from "lucide-react";
import { getBrokerDashboardMetrics } from "@/lib/services/broker-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RenewalRemindersWidget } from "@/components/broker/RenewalRemindersWidget";

export default async function BrokerDashboardPage() {
  const { data: metrics, error } = await getBrokerDashboardMetrics();

  if (error) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-primary">Broker Dashboard</h2>
        <div className="p-8 bg-destructive/10 rounded-xl border border-destructive">
          <p className="text-destructive">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const dashboardMetrics = metrics || {
    active_shipments_as_shipper: 0,
    active_shipments_as_carrier: 0,
    total_commission_earned: 0,
    network_size: { shipper_count: 0, carrier_count: 0, total: 0 },
    recent_transactions: [],
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Broker Dashboard</h2>
        <div className="flex gap-3">
          <Link href="/broker/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/broker/network">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Network
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Network Size */}
        <Card className="bg-accent/20 border-accent shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">
              Network Size
            </CardTitle>
            <Users className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.network_size.total}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {dashboardMetrics.network_size.shipper_count} shippers, {dashboardMetrics.network_size.carrier_count} carriers
            </p>
          </CardContent>
        </Card>

        {/* Active Shipments as Shipper */}
        <Card className="bg-secondary/20 border-secondary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              Active Shipments (Shipper)
            </CardTitle>
            <Package className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.active_shipments_as_shipper}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Posted for clients
            </p>
          </CardContent>
        </Card>

        {/* Active Shipments as Carrier */}
        <Card className="bg-primary/20 border-primary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Active Bids (Carrier)
            </CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.active_shipments_as_carrier}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Through carrier network
            </p>
          </CardContent>
        </Card>

        {/* Total Commission */}
        <Card className="bg-green-500/20 border-green-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Total Commission
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-700 dark:text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.total_commission_earned.toLocaleString()} XAF
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Net earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardMetrics.recent_transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent transactions</p>
          ) : (
            <div className="space-y-4">
              {dashboardMetrics.recent_transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-accent/10 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.type.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {transaction.amount.toLocaleString()} XAF
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renewal Reminders */}
      <RenewalRemindersWidget />

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">Shipper Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Post shipments on behalf of your shipper clients</p>
            <Link href="/shipper/shipments/new">
              <Button className="w-full">Create Shipment</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">Carrier Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Bid on loads using your carrier network</p>
            <Link href="/transporter/marketplace">
              <Button className="w-full" variant="outline">Browse Loads</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}