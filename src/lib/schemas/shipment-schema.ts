import * as z from "zod";

export const auctionTypeEnum = z.enum(["standard", "sealed", "dutch", "buy_it_now"]);
export const visibilityEnum = z.enum(["public", "private"]);

export const bookingSchema = z.object({
  pickup_location: z.string().min(5, { message: "Pickup location is required" }),
  delivery_location: z.string().min(5, { message: "Delivery location is required" }),
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
});

export type BookingFormValues = z.infer<typeof bookingSchema>;