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
  bid_breakdown_json: BidBreakdown;
  bid_status: BidStatus;
  bid_message: string | null;
  bid_submitted_at: string;
  bid_expires_at: string | null;
  auto_bid_enabled: boolean;
  max_auto_bid_amount: number | null;
  bid_ranking: number | null;
  is_counter_offer: boolean;
  original_bid_id: string | null;
  created_at: string;
  updated_at: string;
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
  auto_accept_enabled: boolean;
  auto_accept_price_threshold: number | null;
  auto_accept_min_rating: number | null;
  auto_accept_max_delivery_days: number | null;
}

export interface BidBreakdown {
  base_rate?: number;
  fuel_cost?: number;
  driver_payment?: number;
  overhead?: number;
  profit_margin?: number;
  insurance?: number;
  tolls?: number;
  other_costs?: number;
  notes?: string;
}

export interface CarrierProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  company_name?: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  completed_shipments_count: number;
  success_rate: number;
  overall_rating: number;
  rating_timeliness: number;
  rating_communication: number;
  rating_condition: number;
  total_reviews: number;
  fleet_info?: {
    vehicle_types: string[];
    total_vehicles: number;
    special_features: string[];
  };
  insurance_info?: {
    policy_number: string;
    provider: string;
    coverage_amount: number;
    expiry_date: string;
  };
}

export interface AutoAcceptRules {
  enabled: boolean;
  price_threshold: number | null;
  min_rating: number | null;
  max_delivery_days: number | null;
}

export interface BidAnalytics {
  shipment_id: string;
  total_bids: number;
  average_bid: number;
  lowest_bid: number;
  highest_bid: number;
  bid_spread: number;
  time_to_first_bid_minutes: number | null;
  market_rate_comparison?: {
    current_average: number;
    historical_average: number;
    difference_percentage: number;
  };
}

export interface BidHistory {
  id: string;
  bid_id: string;
  action_type: 'submitted' | 'modified' | 'withdrawn' | 'outbid' | 'awarded' | 'expired' | 'rejected';
  action_timestamp: string;
  previous_amount: number | null;
  new_amount: number | null;
  action_by_user_id: string | null;
  notes: string | null;
}