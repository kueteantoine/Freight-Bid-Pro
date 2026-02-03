-- Carrier Service Offerings
CREATE TABLE IF NOT EXISTS carrier_service_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    freight_types TEXT[] DEFAULT '{}',
    service_regions JSONB DEFAULT '[]', -- Array of regions/coordinates
    max_distance_km INTEGER,
    min_weight_kg DECIMAL,
    max_weight_kg DECIMAL,
    special_capabilities TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transporter_user_id)
);

-- Carrier Pricing Rules
CREATE TABLE IF NOT EXISTS carrier_pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    freight_type TEXT,
    base_rate DECIMAL NOT NULL,
    rate_unit TEXT NOT NULL CHECK (rate_unit IN ('per_km', 'per_kg', 'flat', 'per_hour')),
    min_price DECIMAL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carrier Bid Automation Settings
CREATE TABLE IF NOT EXISTS carrier_bid_automation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    strategy TEXT CHECK (strategy IN ('lowest', 'market', 'premium', 'custom')),
    max_auto_bid_amount DECIMAL,
    min_profit_margin DECIMAL,
    min_shipper_rating DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transporter_user_id)
);

-- Carrier Notification Settings (Specialized preferences beyond global user prefs)
CREATE TABLE IF NOT EXISTS carrier_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transporter_user_id)
);

-- RLS Policies

-- Service Offerings
ALTER TABLE carrier_service_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can view their own service offerings"
    ON carrier_service_offerings FOR SELECT
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can insert their own service offerings"
    ON carrier_service_offerings FOR INSERT
    WITH CHECK (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can update their own service offerings"
    ON carrier_service_offerings FOR UPDATE
    USING (auth.uid() = transporter_user_id);

-- Pricing Rules
ALTER TABLE carrier_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can view their own pricing rules"
    ON carrier_pricing_rules FOR SELECT
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can insert their own pricing rules"
    ON carrier_pricing_rules FOR INSERT
    WITH CHECK (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can update their own pricing rules"
    ON carrier_pricing_rules FOR UPDATE
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can delete their own pricing rules"
    ON carrier_pricing_rules FOR DELETE
    USING (auth.uid() = transporter_user_id);

-- Bid Automation Settings
ALTER TABLE carrier_bid_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can view their own automation settings"
    ON carrier_bid_automation_settings FOR SELECT
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can insert their own automation settings"
    ON carrier_bid_automation_settings FOR INSERT
    WITH CHECK (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can update their own automation settings"
    ON carrier_bid_automation_settings FOR UPDATE
    USING (auth.uid() = transporter_user_id);

-- Notification Settings
ALTER TABLE carrier_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can view their own notification settings"
    ON carrier_notification_settings FOR SELECT
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can insert their own notification settings"
    ON carrier_notification_settings FOR INSERT
    WITH CHECK (auth.uid() = transporter_user_id);

CREATE POLICY "Transporters can update their own notification settings"
    ON carrier_notification_settings FOR UPDATE
    USING (auth.uid() = transporter_user_id);

-- Functions to update updated_at timestamp
CREATE TRIGGER update_carrier_service_offerings_modtime
    BEFORE UPDATE ON carrier_service_offerings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_carrier_pricing_rules_modtime
    BEFORE UPDATE ON carrier_pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_carrier_bid_automation_settings_modtime
    BEFORE UPDATE ON carrier_bid_automation_settings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_carrier_notification_settings_modtime
    BEFORE UPDATE ON carrier_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
