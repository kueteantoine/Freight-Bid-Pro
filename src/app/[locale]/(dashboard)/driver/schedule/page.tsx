import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScheduleCalendar } from "@/components/driver/availability/ScheduleCalendar";
import { TimeOffRequestForm } from "@/components/driver/availability/TimeOffRequestForm";

export default function DriverSchedulePage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Schedule & Availability</h1>
                <p className="text-muted-foreground">Manage your working hours and time off</p>
            </header>

            <Tabs defaultValue="schedule" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
                    <TabsTrigger value="timeoff">Time Off Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recurring Schedule</CardTitle>
                            <CardDescription>
                                Set your standard weekly availability. You can go online outside these hours, but this helps us plan assignments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScheduleCalendar />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeoff">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Time Off</CardTitle>
                            <CardDescription>
                                Submit requests for vacation or other unavailability.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TimeOffRequestForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
