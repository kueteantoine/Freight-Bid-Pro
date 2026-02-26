import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck, ListChecks, Clock, Receipt, BarChart3 } from "lucide-react";
import { getDriverJobs } from "@/app/actions/driver-jobs";
import { AvailabilityToggle } from "@/components/driver/availability/AvailabilityToggle";
import { ShiftSummary } from "@/components/driver/availability/ShiftSummary";
import { getTranslations } from "next-intl/server";

export default async function DriverDashboardPage({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'driverDashboard' });
    const { jobs: activeJobs } = await getDriverJobs("active");
    const { jobs: pendingJobs } = await getDriverJobs("pending");

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("title")}</h1>
            </header>

            <AvailabilityToggle />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <Truck className="h-8 w-8 text-blue-600" />
                        <div>
                            <div className="text-2xl font-bold">{activeJobs?.length || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("activeJobs")}</div>
                        </div>
                    </CardContent>
                </Card>
                <ShiftSummary />
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
                <h2 className="font-semibold text-lg">{t("quickActions")}</h2>
                <div className="grid grid-cols-1 gap-3">
                    <Link href="/driver/jobs">
                        <Button variant="outline" className="w-full justify-start h-14 text-left">
                            <ListChecks className="mr-3 h-5 w-5" />
                            <div className="flex flex-col items-start">
                                <span>{t("myJobs")}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {pendingJobs && pendingJobs.length > 0 ? t("newOffers", { count: pendingJobs.length }) : t("viewHistory")}
                                </span>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/driver/schedule">
                        <Button variant="outline" className="w-full justify-start h-14 text-left">
                            <Clock className="mr-3 h-5 w-5 text-purple-600" />
                            <div className="flex flex-col items-start">
                                <span>{t("manageSchedule")}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {t("scheduleDesc")}
                                </span>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/driver/performance">
                        <Button variant="outline" className="w-full justify-start h-14 text-left">
                            <BarChart3 className="mr-3 h-5 w-5 text-blue-600" />
                            <div className="flex flex-col items-start">
                                <span>{t("performance")}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {t("performanceDesc")}
                                </span>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/driver/expenses">
                        <Button variant="outline" className="w-full justify-start h-14 text-left">
                            <Receipt className="mr-3 h-5 w-5 text-emerald-600" />
                            <div className="flex flex-col items-start">
                                <span>{t("logExpenses")}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {t("expensesDesc")}
                                </span>
                            </div>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Recent/Active Job Preview */}
            {activeJobs && activeJobs.length > 0 && (
                <div className="space-y-2">
                    <h2 className="font-semibold text-lg">{t("currentJob")}</h2>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{activeJobs[0].shipment.shipment_number}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm pb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground">{t("pickup")}:</span>
                                <span className="font-medium text-right">{activeJobs[0].shipment.pickup_location}</span>
                            </div>
                            <Link href={`/driver/jobs/${activeJobs[0].id}`}>
                                <Button size="sm" className="w-full mt-2">{t("continueTrip")}</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
