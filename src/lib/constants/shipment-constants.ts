import { Truck, Package, Snowflake, Droplet, FileText, Car } from "lucide-react";

export const TRUCK_TYPES = [
  { id: "flatbed", label: "Flatbed", icon: Truck, description: "Open trailer for construction, machinery" },
  { id: "box_van", label: "Box Van", icon: Package, description: "Enclosed van for general consumer goods" },
  { id: "refrigerated", label: "Refrigerated", icon: Snowflake, description: "Temperature controlled for food/medical" },
  { id: "tanker", label: "Tanker", icon: Droplet, description: "For liquid bulk or hazardous materials" },
  { id: "curtainside", label: "Curtainside", icon: FileText, description: "Easy side-loading for pallets" },
  { id: "small_van", label: "Small Van", icon: Car, description: "For small deliveries and courier service" },
];

export const AUCTION_TYPES = [
  { id: "standard", label: "Standard Auction", desc: "Open bidding, highest bid wins." },
  { id: "sealed", label: "Sealed Bid", desc: "Bids hidden until auction closes." },
  { id: "buy_it_now", label: "Buy It Now", desc: "Set a fixed price for instant acceptance." },
];