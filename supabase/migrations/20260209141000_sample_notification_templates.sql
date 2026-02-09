-- Sample Email and SMS Templates for Notifications
-- Run this after the template_management migration

-- =====================================================
-- EMAIL TEMPLATES FOR NOTIFICATIONS
-- =====================================================

INSERT INTO public.email_templates (template_key, template_name, description, subject_template, body_template, variables_schema, language, category) VALUES
(
    'notification_bid_received',
    'Bid Received Notification',
    'Email sent when a shipper receives a new bid',
    'New Bid Received for {{load_title}}',
    '<h2>You have a new bid!</h2>
    <p>Hi {{user_name}},</p>
    <p>You have received a new bid for your load: <strong>{{load_title}}</strong></p>
    <p><strong>Bid Amount:</strong> {{bid_amount}}</p>
    <p><strong>Transporter:</strong> {{transporter_name}}</p>
    <p>Click the button below to view the bid details:</p>
    <a href="{{app_url}}/loads/{{load_id}}/bids" class="button">View Bid</a>',
    to_jsonb(ARRAY['user_name', 'load_title', 'bid_amount', 'transporter_name', 'load_id', 'app_url']),
    'en',
    'notifications'
),
(
    'notification_bid_awarded',
    'Bid Awarded Notification',
    'Email sent when a transporter wins a bid',
    'Congratulations! Your Bid Was Awarded',
    '<h2>🎉 Your bid was awarded!</h2>
    <p>Hi {{user_name}},</p>
    <p>Great news! Your bid for <strong>{{load_title}}</strong> has been awarded.</p>
    <p><strong>Awarded Amount:</strong> {{bid_amount}}</p>
    <p><strong>Pickup:</strong> {{pickup_location}}</p>
    <p><strong>Delivery:</strong> {{delivery_location}}</p>
    <p>Please review the shipment details and prepare for pickup:</p>
    <a href="{{app_url}}/shipments/{{shipment_id}}" class="button">View Shipment</a>',
    to_jsonb(ARRAY['user_name', 'load_title', 'bid_amount', 'pickup_location', 'delivery_location', 'shipment_id', 'app_url']),
    'en',
    'notifications'
),
(
    'notification_payment_received',
    'Payment Received Notification',
    'Email sent when payment is confirmed',
    'Payment Received - {{amount}}',
    '<h2>Payment Confirmed</h2>
    <p>Hi {{user_name}},</p>
    <p>We have received your payment of <strong>{{amount}}</strong>.</p>
    <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
    <p><strong>Date:</strong> {{payment_date}}</p>
    <p>Thank you for your payment!</p>
    <a href="{{app_url}}/payments/{{payment_id}}" class="button">View Receipt</a>',
    to_jsonb(ARRAY['user_name', 'amount', 'transaction_id', 'payment_date', 'payment_id', 'app_url']),
    'en',
    'notifications'
);

-- =====================================================
-- SMS TEMPLATES FOR NOTIFICATIONS
-- =====================================================

INSERT INTO public.sms_templates (template_key, template_name, description, message_template, variables_schema, language, category) VALUES
(
    'sms_bid_received',
    'Bid Received SMS',
    'SMS sent when a shipper receives a new bid',
    'New bid received for {{load_title}}: {{bid_amount}} from {{transporter_name}}. View at {{app_url}}/loads/{{load_id}}',
    to_jsonb(ARRAY['load_title', 'bid_amount', 'transporter_name', 'load_id', 'app_url']),
    'en',
    'notifications'
),
(
    'sms_bid_awarded',
    'Bid Awarded SMS',
    'SMS sent when a transporter wins a bid',
    'Congratulations! Your bid for {{load_title}} was awarded at {{bid_amount}}. View shipment: {{app_url}}/shipments/{{shipment_id}}',
    to_jsonb(ARRAY['load_title', 'bid_amount', 'shipment_id', 'app_url']),
    'en',
    'notifications'
),
(
    'sms_bid_outbid',
    'Outbid Notification SMS',
    'SMS sent when a transporter is outbid',
    'You have been outbid on {{load_title}}. Current highest bid: {{current_bid}}. Place a new bid: {{app_url}}/loads/{{load_id}}',
    to_jsonb(ARRAY['load_title', 'current_bid', 'load_id', 'app_url']),
    'en',
    'notifications'
),
(
    'sms_payment_received',
    'Payment Received SMS',
    'SMS sent when payment is confirmed',
    'Payment of {{amount}} received. Transaction ID: {{transaction_id}}. Thank you!',
    to_jsonb(ARRAY['amount', 'transaction_id']),
    'en',
    'notifications'
),
(
    'sms_shipment_update',
    'Shipment Update SMS',
    'SMS sent for shipment status updates',
    'Shipment {{shipment_id}} status: {{status}}. {{message}}',
    to_jsonb(ARRAY['shipment_id', 'status', 'message']),
    'en',
    'notifications'
),
(
    'sms_document_expiring',
    'Document Expiring SMS',
    'SMS sent when documents are about to expire',
    'Your {{document_type}} expires on {{expiry_date}}. Please renew: {{app_url}}/profile/documents',
    to_jsonb(ARRAY['document_type', 'expiry_date', 'app_url']),
    'en',
    'notifications'
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.email_templates IS 'Contains sample notification email templates';
COMMENT ON TABLE public.sms_templates IS 'Contains sample notification SMS templates';
