export type ShipmentStatus = "draft" | "open_for_bidding" | "bid_awarded" | "in_transit" | "delivered" | "cancelled";
export type BidStatus = "active" | "withdrawn" | "outbid" | "awarded" | "rejected" | "expired";
export type AuctionType = "standard" | "sealed" | "dutch" | "buy_it_now";
export type TrackingEvent = "shipment_created" | "bid_awarded" | "driver_assigned" | "pickup_started" | "loaded" | "in_transit" | "delivered" | "cancelled";
export type VehicleStatus = "active" | "maintenance" | "inactive";
export type VehicleDocumentType = "registration" | "insurance" | "permit" | "inspection" | "other";
export type DriverStatus = "online" | "busy" | "offline";
export type TimeOffStatus = "pending" | "approved" | "rejected";
export type FuelLevel = "empty" | "low" | "half" | "full";
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
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_location: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  scheduled_pickup_date: string;
  scheduled_delivery_date: string | null;
  freight_type: string;
  weight_kg: number;
  dimensions_json: {
    length: number;
    width: number;
    height: number;
  };
  quantity: number;
  special_handling_requirements: string | null;
  preferred_vehicle_type: string | null;
  insurance_required: boolean;
  insurance_value: number;
  loading_requirements: string | null;
  unloading_requirements: string | null;
  status: ShipmentStatus;
  auction_type: AuctionType;
  bidding_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  bids: Bid[]; // Array of associated bids
  bid_expires_at: string | null;
  auto_accept_enabled: boolean;
  auto_accept_price_threshold: number | null;
  auto_accept_min_rating: number | null;
  auto_accept_max_delivery_days: number | null;
  // Tracking fields
  assigned_transporter_user_id: string | null;
  assigned_driver_user_id: string | null;
  assigned_vehicle_id: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  estimated_arrival: string | null;
  actual_pickup_at: string | null;
  shipper_user_id: string;
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

export interface TransporterProfile {
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

export interface ShipmentTracking {
  id: string;
  shipment_id: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  tracking_event: TrackingEvent;
  event_timestamp: string;
  recorded_by_user_id: string | null;
  notes: string | null;
  images_json: string[];
  created_at: string;
}

export interface Vehicle {
  id: string;
  transporter_user_id: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  license_plate: string;
  capacity_kg: number;
  capacity_cubic_meters: number | null;
  insurance_policy_number: string | null;
  insurance_expiry_date: string | null;
  gps_device_id: string | null;
  last_maintenance_date: string | null;
  next_maintenance_due_date: string | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: VehicleDocumentType;
  document_number: string | null;
  document_url: string;
  issue_date: string | null;
  expiry_date: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
}

export interface ShipmentTrackingWithUser extends ShipmentTracking {
  profiles: Profile | null;
}

export interface ShipmentWithDetails extends Shipment {
  tracking_events: ShipmentTrackingWithUser[];
  transporter_profile: TransporterProfile | null;
  driver_profile: Profile | null;
}

export type MessageType = "text" | "image" | "document" | "audio";
export type ConversationType = "shipment_chat" | "bid_negotiation" | "support_ticket";
export type NotificationType =
  | "bid_received"
  | "bid_outbid"
  | "bid_awarded"
  | "payment_received"
  | "shipment_update"
  | "message_received"
  | "document_expiring"
  | "dispute_created"
  | "dispute_resolved"
  | "bid_rejected";

export interface Message {
  id: string;
  conversation_type: ConversationType;
  related_shipment_id: string | null;
  related_bid_id: string | null;
  sender_user_id: string;
  receiver_user_id: string | null;
  message_content: string;
  message_type: MessageType;
  attachment_url: string | null;
  is_read: boolean;
  sent_at: string;
  sender_profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  for_role_type: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  sent_via_email: boolean;
  sent_via_sms: boolean;
  sent_via_push: boolean;
  created_at: string;
}

export interface DriverInvitation {
  id: string;
  transporter_user_id: string;
  email: string | null;
  phone_number: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface DriverAssignment {
  id: string;
  driver_user_id: string;
  vehicle_id: string;
  transporter_user_id: string;
  assignment_start_date: string;
  assignment_end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverAvailability {
  id: string;
  driver_user_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverPayment {
  id: string;
  driver_user_id: string;
  transporter_user_id: string;
  shipment_id: string | null;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  search_name: string;
  filters: any;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableTruck {
  id: string;
  transporter_user_id: string;
  origin_location: string;
  origin_latitude: number | null;
  origin_longitude: number | null;
  destination_location: string | null;
  destination_latitude: number | null;
  destination_longitude: number | null;
  available_from: string;
  available_until: string | null;
  vehicle_type: string;
  capacity_kg: number | null;
  contact_phone: string | null;
  notes: string | null;
  status: 'active' | 'matched' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ServiceOfferings {
  id: string;
  transporter_user_id: string;
  freight_types: string[];
  service_regions: any[]; // JSONB - Legacy complex polygons
  base_city: string | null;
  base_latitude: number | null;
  base_longitude: number | null;
  service_radius_km: number;
  max_distance_km: number | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  special_capabilities: string[];
  willing_to_backhaul: boolean;
  cross_border: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreferredRoute {
  id: string;
  transporter_user_id: string;
  from_city: string;
  from_latitude: number | null;
  from_longitude: number | null;
  to_city: string;
  to_latitude: number | null;
  to_longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  transporter_user_id: string;
  rule_name: string;
  freight_type: string | null;
  base_rate: number;
  rate_unit: 'per_km' | 'per_kg' | 'flat' | 'per_hour';
  min_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BidAutomationSettings {
  id: string;
  transporter_user_id: string;
  enabled: boolean;
  strategy: 'lowest' | 'market' | 'premium' | 'custom' | null;
  max_auto_bid_amount: number | null;
  min_profit_margin: number | null;
  min_shipper_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface CarrierNotificationSettings {
  id: string;
  transporter_user_id: string;
  preferences: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface DriverStatusRecord {
  user_id: string;
  status: DriverStatus;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
  current_session_started_at: string | null;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  driver_user_id: string;
  transporter_user_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: TimeOffStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleChecklist {
  id: string;
  driver_user_id: string;
  vehicle_id: string;
  fuel_level: FuelLevel | null;
  tire_pressure_ok: boolean;
  cleanliness_ok: boolean;
  safety_equipment_ok: boolean;
  gps_functional: boolean;
  notes: string | null;
  submitted_at: string;
  created_at: string;
}

export interface ShiftLog {
  id: string;
  driver_user_id: string;
  shift_start: string;
  shift_end: string | null;
  jobs_completed: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}