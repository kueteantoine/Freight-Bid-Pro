import Dexie, { type Table } from "dexie";

// Offline sync queue entry
export interface PendingAction {
    id?: number;
    type: string;
    payload: any;
    timestamp: number;
}

// Local cache for shipments (example)
export interface CachedShipment {
    id: string;
    data: any;
    lastUpdated: number;
}

export class FreightBidDB extends Dexie {
    pendingActions!: Table<PendingAction>;
    shipments!: Table<CachedShipment>;

    constructor() {
        super("FreightBidDB");
        this.version(1).stores({
            pendingActions: "++id, type, timestamp",
            shipments: "id, lastUpdated",
        });
    }

    async queueAction(type: string, payload: any) {
        return await this.pendingActions.add({
            type,
            payload,
            timestamp: Date.now(),
        });
    }

    async clearPendingAction(id: number) {
        return await this.pendingActions.delete(id);
    }
}

export const db = new FreightBidDB();
