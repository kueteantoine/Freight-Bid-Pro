import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DriverData {
    driver_id: string;
    email: string;
    trips_completed: number;
    avg_rating: number;
}

interface DriverPerformanceProps {
    data: DriverData[];
}

export default function DriverPerformanceList({ data }: DriverPerformanceProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Top Drivers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {data.slice(0, 5).map((driver, index) => (
                        <div key={driver.driver_id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{driver.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{driver.email}</p>
                                    <p className="text-xs text-muted-foreground">{driver.trips_completed} trips completed</p>
                                </div>
                            </div>
                            <div className="font-medium text-sm">
                                {driver.avg_rating.toFixed(1)} ★
                            </div>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <p className="text-sm text-muted-foreground">No driver data available.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
