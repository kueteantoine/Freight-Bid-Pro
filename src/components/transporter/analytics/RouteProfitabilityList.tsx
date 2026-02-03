import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RouteData {
    origin: string;
    destination: string;
    trip_count: number;
    avg_revenue: number;
}

interface RouteProfitabilityProps {
    data: RouteData[];
}

export function RouteProfitabilityList({ data }: RouteProfitabilityProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Route Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Route</TableHead>
                            <TableHead className="text-right">Trips</TableHead>
                            <TableHead className="text-right">Avg. Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((route, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">
                                    {route.origin} → {route.destination}
                                </TableCell>
                                <TableCell className="text-right">{route.trip_count}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(route.avg_revenue)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">No route data available</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
