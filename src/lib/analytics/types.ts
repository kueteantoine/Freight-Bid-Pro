export type EventCategory =
  | 'navigation'
  | 'engagement'
  | 'conversion'
  | 'error'
  | 'performance';

export interface PlatformEvent {
  user_id?: string;
  session_id: string;
  event_name: string;
  event_category: EventCategory;
  event_data?: Record<string, unknown>;
  page_url?: string;
  referrer_url?: string;
  user_agent?: string;
  created_at?: string;
}

export interface EngagementMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  total_events: number;
  unique_sessions: number;
  avg_events_per_session: number;
  dau_trend: {
    date: string;
    active_users: number;
    sessions: number;
    events: number;
  }[];
  events_by_category: Record<string, number>;
}

export interface ConversionFunnelStep {
  name: string;
  event_name: string;
  count: number;
}

export interface ConversionFunnel {
  steps: ConversionFunnelStep[];
}

export interface FeatureUsage {
  feature: string;
  total_uses: number;
  unique_users: number;
  unique_sessions: number;
}

export interface EventTrend {
  date: string;
  category: string;
  count: number;
}

export interface PerformanceMetrics {
  avg_page_load_ms: number | null;
  p95_page_load_ms: number | null;
  avg_api_response_ms: number | null;
  error_rate: number | null;
  page_load_trend: {
    date: string;
    avg_ms: number;
    samples: number;
  }[];
  api_response_trend: {
    date: string;
    avg_ms: number;
    samples: number;
  }[];
}

export interface ErrorAnalytics {
  total_errors: number;
  errors_today: number;
  top_errors: {
    error_type: string;
    message: string;
    occurrences: number;
    affected_users: number;
    last_seen: string;
  }[];
  error_trend: {
    date: string;
    count: number;
    unique_errors: number;
  }[];
}

export type DateRange = '7_days' | '30_days' | '90_days' | 'ytd';
