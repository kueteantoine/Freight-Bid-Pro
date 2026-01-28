import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ShipperShipmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Shipments</h1>
          <p className="text-muted-foreground">List of all your posted loads and their current status.</p>
        </div>
        <Link href="/shipper/shipments/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Shipment
          </Button>
        </Link>
      </div>

      {/* Shipment list will be added in a future prompt */}
      <div className="border-2 border-dashed border-muted rounded-xl h-64 flex items-center justify-center bg-muted/50">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No shipments found.</p>
          <Link href="/shipper/shipments/new">
            <Button variant="outline" size="sm">Post your first load</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}