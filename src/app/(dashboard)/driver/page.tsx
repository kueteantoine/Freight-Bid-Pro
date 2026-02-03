import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck, DollarSign, ListChecks } from "lucide-react";
import { getDriverJobs } from "@/app/actions/driver-jobs";

export default async function DriverDashboardPage() {
    // Fetch some basic stats
    const { jobs: activeJobs } = await getDriverJobs("active");
    const { jobs: pendingJobs } = await getDriverJobs("pending");

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Driver Dashboard</h1>
                <div className="flex bg-slate-100 rounded-full p-1 border">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold shadow-sm text-green-700">Online</span>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <Truck className="h-8 w-8 text-blue-600" />
                        <div>
                            <div className="text-2xl font-bold">{activeJobs?.length || 0}</div>
                            <div className="text-xs text-muted-foreground">Active Jobs</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                            <div className="text-2xl font-bold">45K</div>
                            <div className="text-xs text-muted-foreground">Today's Earnings</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
                <h2 className="font-semibold text-lg">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-3">
                    <Link href="/driver/jobs">
                        <Button variant="outline" className="w-full justify-start h-14 text-left">
                            <ListChecks className="mr-3 h-5 w-5" />
                            <div className="flex flex-col items-start">
                                <span>My Jobs</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {pendingJobs && pendingJobs.length > 0 ? `${pendingJobs.length} new offers` : "View job history"}
                                </span>
                            </div>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Recent/Active Job Preview */}
            {activeJobs && activeJobs.length > 0 && (
                <div className="space-y-2">
                    <h2 className="font-semibold text-lg">Current Job</h2>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{activeJobs[0].shipment.shipment_number}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm pb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground">Pickup:</span>
                                <span className="font-medium text-right">{activeJobs[0].shipment.pickup_location}</span>
                            </div>
                            <Link href={`/driver/jobs/${activeJobs[0].id}`}>
                                <Button size="sm" className="w-full mt-2">Continue Trip</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
