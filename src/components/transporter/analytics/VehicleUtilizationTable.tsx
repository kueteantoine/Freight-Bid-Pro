import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VehicleData {
    id: string;
    license_plate: string;
    make: string;
    model: string;
    vehicle_status: string;
    trips_completed: number;
}

interface VehicleUtilizationProps {
    data: VehicleData[];
}

export function VehicleUtilizationTable({ data }: VehicleUtilizationProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Fleet Utilization</CardTitle>
                <p className="text-sm text-muted-foreground">
                    {data.length} vehicles total
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Simple list for now, could be a Table component */}
                    {data.slice(0, 5).map(vehicle => (
                        <div key={vehicle.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {vehicle.make} {vehicle.model}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {vehicle.license_plate}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-medium">
                                    {vehicle.trips_completed} trips
                                </div>
                                <Badge variant={
                                    vehicle.vehicle_status === 'active' ? 'default' :
                                        vehicle.vehicle_status === 'maintenance' ? 'destructive' : 'secondary'
                                }>
                                    {vehicle.vehicle_status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
