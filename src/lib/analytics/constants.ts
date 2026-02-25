/**
 * Standardized event name constants for platform analytics.
 * Use these instead of raw strings to ensure consistency.
 */

// Navigation events
export const NAV_PAGE_VIEW = 'page_view';
export const NAV_NAVIGATION_CLICK = 'navigation_click';
export const NAV_ROLE_SWITCH = 'role_switch';
export const NAV_TAB_CHANGE = 'tab_change';

// Engagement events
export const ENG_BUTTON_CLICK = 'button_click';
export const ENG_FORM_SUBMIT = 'form_submit';
export const ENG_SEARCH_PERFORMED = 'search_performed';
export const ENG_FILTER_APPLIED = 'filter_applied';
export const ENG_MAP_INTERACTION = 'map_interaction';
export const ENG_NOTIFICATION_OPENED = 'notification_opened';
export const ENG_DOCUMENT_DOWNLOADED = 'document_downloaded';
export const ENG_CHAT_MESSAGE_SENT = 'chat_message_sent';

// Conversion events
export const CONV_REGISTRATION_STARTED = 'registration_started';
export const CONV_REGISTRATION_COMPLETED = 'registration_completed';
export const CONV_PROFILE_COMPLETED = 'profile_completed';
export const CONV_SHIPMENT_CREATED = 'shipment_created';
export const CONV_BID_SUBMITTED = 'bid_submitted';
export const CONV_BID_AWARDED = 'bid_awarded';
export const CONV_PAYMENT_INITIATED = 'payment_initiated';
export const CONV_PAYMENT_COMPLETED = 'payment_completed';
export const CONV_SHIPMENT_DELIVERED = 'shipment_delivered';
export const CONV_RATING_SUBMITTED = 'rating_submitted';

// Error events
export const ERR_CLIENT_ERROR = 'client_error';
export const ERR_API_ERROR = 'api_error';
export const ERR_FORM_VALIDATION = 'form_validation_error';
export const ERR_AUTH_ERROR = 'auth_error';
export const ERR_PAYMENT_ERROR = 'payment_error';

// Performance events
export const PERF_PAGE_LOAD = 'page_load';
export const PERF_API_RESPONSE = 'api_response_time';
export const PERF_WEB_VITAL_LCP = 'web_vital_lcp';
export const PERF_WEB_VITAL_FID = 'web_vital_fid';
export const PERF_WEB_VITAL_CLS = 'web_vital_cls';

// Event category groups (for filtering in dashboards)
export const EVENT_CATEGORIES = {
    navigation: [NAV_PAGE_VIEW, NAV_NAVIGATION_CLICK, NAV_ROLE_SWITCH, NAV_TAB_CHANGE],
    engagement: [
        ENG_BUTTON_CLICK, ENG_FORM_SUBMIT, ENG_SEARCH_PERFORMED,
        ENG_FILTER_APPLIED, ENG_MAP_INTERACTION, ENG_NOTIFICATION_OPENED,
        ENG_DOCUMENT_DOWNLOADED, ENG_CHAT_MESSAGE_SENT,
    ],
    conversion: [
        CONV_REGISTRATION_STARTED, CONV_REGISTRATION_COMPLETED,
        CONV_PROFILE_COMPLETED, CONV_SHIPMENT_CREATED, CONV_BID_SUBMITTED,
        CONV_BID_AWARDED, CONV_PAYMENT_INITIATED, CONV_PAYMENT_COMPLETED,
        CONV_SHIPMENT_DELIVERED, CONV_RATING_SUBMITTED,
    ],
    error: [ERR_CLIENT_ERROR, ERR_API_ERROR, ERR_FORM_VALIDATION, ERR_AUTH_ERROR, ERR_PAYMENT_ERROR],
    performance: [PERF_PAGE_LOAD, PERF_API_RESPONSE, PERF_WEB_VITAL_LCP, PERF_WEB_VITAL_FID, PERF_WEB_VITAL_CLS],
} as const;
