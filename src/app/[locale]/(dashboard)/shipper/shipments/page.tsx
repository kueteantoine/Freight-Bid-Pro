import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getShipmentsByStatus, getShipmentCounts } from "@/app/actions/tracking-actions";
import { ShipmentListView } from "@/components/shipper/tracking/ShipmentListView";
import { getTranslations } from "next-intl/server";

export default async function ShipperShipmentsPage() {
  const t = await getTranslations("shipperSubPages");

  // Fetch all shipments and counts
  const [shipments, counts] = await Promise.all([
    getShipmentsByStatus(),
    getShipmentCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("myShipments")}</h1>
          <p className="text-muted-foreground">{t("myShipmentsDesc")}</p>
        </div>
        <Link href="/shipper/shipments/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createShipment")}
          </Button>
        </Link>
      </div>

      <ShipmentListView shipments={shipments} counts={counts} />
    </div>
  );
}