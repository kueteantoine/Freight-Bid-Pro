'use client';

import {
    createContext,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { EventTracker, getTracker } from '@/lib/analytics/event-tracker';
import type { EventCategory } from '@/lib/analytics/types';

interface AnalyticsContextValue {
    tracker: EventTracker;
    trackEvent: (
        name: string,
        category: EventCategory,
        data?: Record<string, unknown>,
    ) => void;
    trackError: (error: Error | string, context?: Record<string, unknown>) => void;
    trackConversion: (step: string, data?: Record<string, unknown>) => void;
}

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
    children: ReactNode;
    userId?: string;
}

export function AnalyticsProvider({ children, userId }: AnalyticsProviderProps) {
    const trackerRef = useRef<EventTracker>(getTracker());
    const pathname = usePathname();
    const prevPathname = useRef<string>('');

    // Set userId on the tracker when it changes
    useEffect(() => {
        trackerRef.current.setUserId(userId);
    }, [userId]);

    // Track page views on route changes
    useEffect(() => {
        if (pathname && pathname !== prevPathname.current) {
            prevPathname.current = pathname;
            trackerRef.current.trackPageView(pathname);
        }
    }, [pathname]);

    // Track page load performance after mount
    useEffect(() => {
        const timer = setTimeout(() => {
            trackerRef.current.trackPageLoad();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Cleanup tracker on unmount
    useEffect(() => {
        const tracker = trackerRef.current;
        return () => tracker.destroy();
    }, []);

    const trackEvent = useCallback(
        (name: string, category: EventCategory, data?: Record<string, unknown>) => {
            trackerRef.current.trackEvent(name, category, data);
        },
        [],
    );

    const trackError = useCallback(
        (error: Error | string, context?: Record<string, unknown>) => {
            trackerRef.current.trackError(error, context);
        },
        [],
    );

    const trackConversion = useCallback(
        (step: string, data?: Record<string, unknown>) => {
            trackerRef.current.trackEvent(step, 'conversion', data);
        },
        [],
    );

    return (
        <AnalyticsContext.Provider
            value={{
                tracker: trackerRef.current,
                trackEvent,
                trackError,
                trackConversion,
            }}
        >
            {children}
        </AnalyticsContext.Provider>
    );
}
