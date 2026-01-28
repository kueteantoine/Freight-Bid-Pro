import * as z from "zod";

export const auctionTypeEnum = z.enum(["standard", "sealed", "dutch", "buy_it_now"]);
export const visibilityEnum = z.enum(["public", "private"]);

export const autoAcceptCriteriaSchema = z.object({
  enabled: z.boolean().default(false),
  max_price: z.coerce.number().min(0).optional(), // Max price shipper is willing to pay
  min_rating: z.coerce.number().min(1).max(5).optional(), // Minimum carrier rating (1-5)
  max_delivery_days: z.coerce.number().min(1).optional(), // Maximum delivery time in days
});

export const bookingSchema = z.object({
  pickup_location: z.string().min(5, { message: "Pickup location is required" }),
  pickup_latitude: z.number().optional(),
  pickup_longitude: z.number().optional(),
  delivery_location: z.string().min(5, { message: "Delivery location is required" }),
  delivery_latitude: z.number().optional(),
  delivery_longitude: z.number().optional(),
  scheduled_pickup_date: z.string().min(1, { message: "Pickup date is required" }),
  scheduled_delivery_date: z.string().optional(),
  freight_type: z.string().min(2, { message: "Freight type is required" }),
  weight_kg: z.coerce.number().min(1, { message: "Weight must be at least 1kg" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  dimensions_json: z.object({
    length: z.coerce.number().min(0),
    width: z.coerce.number().min(0),
    height: z.coerce.number().min(0),
  }),
  preferred_vehicle_type: z.string().min(1, { message: "Preferred vehicle type is required" }),
  special_equipment_needs: z.string().optional(),
  special_handling_requirements: z.string().optional(),
  insurance_required: z.boolean().default(false),
  insurance_value: z.coerce.number().default(0),
  loading_requirements: z.string().optional(),
  unloading_requirements: z.string().optional(),
  save_as_template: z.boolean().default(false),
  template_name: z.string().optional(),

  // Bidding Fields
  auction_type: auctionTypeEnum.default("standard"),
  bidding_duration_minutes: z.coerce.number().min(5, "Minimum duration is 5 minutes").optional(),
  min_bid_increment: z.coerce.number().min(0).default(0),
  reserve_price: z.coerce.number().min(0).optional(),
  buy_it_now_price: z.coerce.number().min(0).optional(),
  marketplace_visibility: visibilityEnum.default("public"),
  auto_accept_criteria_json: autoAcceptCriteriaSchema.default({ enabled: false }),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;