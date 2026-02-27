"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";

export function useOfflineSync(onSync?: (action: any) => Promise<void>) {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const updateCount = async () => {
            const count = await db.pendingActions.count();
            setPendingCount(count);
        };

        updateCount();

        const handleOnline = async () => {
            console.log("App is online, starting sync...");
            const actions = await db.pendingActions.toArray();

            for (const action of actions) {
                try {
                    if (onSync) {
                        await onSync(action);
                        await db.clearPendingAction(action.id!);
                    }
                } catch (error) {
                    console.error(`Failed to sync action ${action.id}:`, error);
                }
            }
            updateCount();
        };

        window.addEventListener("online", handleOnline);
        // Poll for count changes if needed, or trigger manually on queue
        const interval = setInterval(updateCount, 10000);

        return () => {
            window.removeEventListener("online", handleOnline);
            clearInterval(interval);
        };
    }, [onSync]);

    const queueAction = async (type: string, payload: any) => {
        await db.queueAction(type, payload);
        const count = await db.pendingActions.count();
        setPendingCount(count);
    };

    return {
        pendingCount,
        queueAction
    };
}
