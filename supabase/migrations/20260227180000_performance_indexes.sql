-- Performance Optimization Indexes for shipments table

-- Index for shipper-specific queries
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_user_id ON public.shipments(shipper_user_id);

-- Index for searching by shipment number
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_number ON public.shipments(shipment_number);

-- Index for filtering by freight type
CREATE INDEX IF NOT EXISTS idx_shipments_freight_type ON public.shipments(freight_type);

-- Index for sorting/filtering by pickup date
CREATE INDEX IF NOT EXISTS idx_shipments_scheduled_pickup_date ON public.shipments(scheduled_pickup_date);

-- Composite index for status and user (common for dashboards)
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_status ON public.shipments(shipper_user_id, status);
