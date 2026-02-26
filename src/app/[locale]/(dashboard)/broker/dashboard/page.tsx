import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Package, Briefcase, BarChart3 } from "lucide-react";
import { getBrokerDashboardMetrics } from "@/lib/services/broker-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RenewalRemindersWidget } from "@/components/broker/RenewalRemindersWidget";
import { getTranslations } from "next-intl/server";

export default async function BrokerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brokerDashboard' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const { data: metrics, error } = await getBrokerDashboardMetrics();

  if (error) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-primary">{t("title")}</h2>
        <div className="p-8 bg-destructive/10 rounded-xl border border-destructive">
          <p className="text-destructive">{tCommon("error")}: {error}</p>
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
        <h2 className="text-3xl font-bold text-primary">{t("title")}</h2>
        <div className="flex gap-3">
          <Link href="/broker/commissions">
            <Button variant="default">
              <DollarSign className="mr-2 h-4 w-4" />
              {t("commissions")}
            </Button>
          </Link>
          <Link href="/broker/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("analytics")}
            </Button>
          </Link>
          <Link href="/broker/network">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              {t("manageNetwork")}
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
              {t("networkSize.title")}
            </CardTitle>
            <Users className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.network_size.total}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("networkSize.details", {
                shippers: dashboardMetrics.network_size.shipper_count,
                carriers: dashboardMetrics.network_size.carrier_count
              })}
            </p>
          </CardContent>
        </Card>

        {/* Active Shipments as Shipper */}
        <Card className="bg-secondary/20 border-secondary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">
              {t("activeShipmentsShipper")}
            </CardTitle>
            <Package className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.active_shipments_as_shipper}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("postedForClients")}
            </p>
          </CardContent>
        </Card>

        {/* Active Shipments as Carrier */}
        <Card className="bg-primary/20 border-primary shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              {t("activeBidsCarrier")}
            </CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.active_shipments_as_carrier}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("throughCarrierNetwork")}
            </p>
          </CardContent>
        </Card>

        {/* Total Commission */}
        <Card className="bg-green-500/20 border-green-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              {t("totalCommission")}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-700 dark:text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-primary">
              {dashboardMetrics.total_commission_earned.toLocaleString()} XAF
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("netEarnings")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">{t("recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardMetrics.recent_transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("noRecentTransactions")}</p>
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
            <CardTitle className="text-lg font-bold text-primary">{t("shipperMode.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">{t("shipperMode.description")}</p>
            <Link href="/shipper/shipments/new">
              <Button className="w-full">{t("shipperMode.button")}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">{t("carrierMode.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">{t("carrierMode.description")}</p>
            <Link href="/transporter/marketplace">
              <Button className="w-full" variant="outline">{t("carrierMode.button")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}