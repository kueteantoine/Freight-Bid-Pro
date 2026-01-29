export type ShipmentStatus = "draft" | "open_for_bidding" | "bid_awarded" | "in_transit" | "delivered" | "cancelled";
export type BidStatus = "active" | "withdrawn" | "outbid" | "awarded" | "rejected" | "expired";
export type AuctionType = "standard" | "sealed" | "dutch" | "buy_it_now";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface Bid {
  id: string;
  shipment_id: string;
  transporter_user_id: string;
  bid_amount: number;
  estimated_delivery_date: string | null;
  bid_status: BidStatus;
  bid_submitted_at: string;
  bid_expires_at: string | null;
  bid_message: string | null;
  profiles: Profile; // Joined profile data of the transporter
}

export interface Shipment {
  id: string;
  shipment_number: string;
  pickup_location: string;
  delivery_location: string;
  scheduled_pickup_date: string;
  status: ShipmentStatus;
  auction_type: AuctionType;
  bidding_duration_minutes: number | null;
  created_at: string;
  bids: Bid[]; // Array of associated bids
  bid_expires_at: string | null;
}