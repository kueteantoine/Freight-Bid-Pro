import type { EventCategory, PlatformEvent } from './types';
import { NAV_PAGE_VIEW, PERF_PAGE_LOAD, ERR_CLIENT_ERROR } from './constants';

const BATCH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 50;
const SESSION_KEY = 'fbp_analytics_session_id';

function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
}

export class EventTracker {
    private queue: PlatformEvent[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private userId: string | undefined;
    private isClient: boolean;

    constructor() {
        this.isClient = typeof window !== 'undefined';
        if (this.isClient) {
            this.startFlushTimer();
            this.attachUnloadHandler();
        }
    }

    setUserId(id: string | undefined) {
        this.userId = id;
    }

    trackPageView(url?: string) {
        this.push(NAV_PAGE_VIEW, 'navigation', {
            url: url || (this.isClient ? window.location.pathname : undefined),
        });
    }

    trackEvent(
        name: string,
        category: EventCategory,
        data?: Record<string, unknown>,
    ) {
        this.push(name, category, data);
    }

    trackError(error: Error | string, context?: Record<string, unknown>) {
        const message = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : undefined;
        this.push(ERR_CLIENT_ERROR, 'error', {
            message,
            stack: stack?.substring(0, 500),
            ...context,
        });
    }

    trackPerformance(metric: string, durationMs: number, data?: Record<string, unknown>) {
        this.push(metric, 'performance', {
            duration: Math.round(durationMs),
            ...data,
        });
    }

    trackPageLoad() {
        if (!this.isClient) return;
        const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (perf) {
            this.push(PERF_PAGE_LOAD, 'performance', {
                duration: Math.round(perf.loadEventEnd - perf.startTime),
                dns: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
                tcp: Math.round(perf.connectEnd - perf.connectStart),
                ttfb: Math.round(perf.responseStart - perf.requestStart),
                dom_interactive: Math.round(perf.domInteractive - perf.startTime),
                dom_complete: Math.round(perf.domComplete - perf.startTime),
            });
        }
    }

    private push(
        eventName: string,
        eventCategory: EventCategory,
        eventData?: Record<string, unknown>,
    ) {
        const event: PlatformEvent = {
            user_id: this.userId,
            session_id: getSessionId(),
            event_name: eventName,
            event_category: eventCategory,
            event_data: eventData,
            page_url: this.isClient ? window.location.pathname + window.location.search : undefined,
            referrer_url: this.isClient ? document.referrer || undefined : undefined,
            user_agent: this.isClient ? navigator.userAgent : undefined,
            created_at: new Date().toISOString(),
        };

        this.queue.push(event);

        if (process.env.NODE_ENV === 'development') {
            console.debug('[Analytics]', eventName, eventData);
        }

        if (this.queue.length >= MAX_BATCH_SIZE) {
            this.flush();
        }
    }

    async flush() {
        if (this.queue.length === 0) return;

        const batch = this.queue.splice(0, MAX_BATCH_SIZE);

        try {
            const response = await fetch('/api/analytics/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: batch }),
            });

            if (!response.ok && process.env.NODE_ENV === 'development') {
                console.warn('[Analytics] Failed to flush events:', response.status);
                // Re-queue failed events (limit to prevent infinite growth)
                if (this.queue.length < MAX_BATCH_SIZE * 3) {
                    this.queue.unshift(...batch);
                }
            }
        } catch {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Analytics] Network error flushing events');
            }
        }
    }

    private startFlushTimer() {
        this.flushTimer = setInterval(() => this.flush(), BATCH_INTERVAL_MS);
    }

    private attachUnloadHandler() {
        if (!this.isClient) return;
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flushSync();
            }
        });
    }

    private flushSync() {
        if (this.queue.length === 0 || !this.isClient) return;

        const batch = this.queue.splice(0, MAX_BATCH_SIZE);

        try {
            const blob = new Blob(
                [JSON.stringify({ events: batch })],
                { type: 'application/json' },
            );
            navigator.sendBeacon('/api/analytics/events', blob);
        } catch {
            // Silently fail on page unload
        }
    }

    destroy() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush();
    }
}

// Singleton instance
let trackerInstance: EventTracker | null = null;

export function getTracker(): EventTracker {
    if (!trackerInstance) {
        trackerInstance = new EventTracker();
    }
    return trackerInstance;
}
