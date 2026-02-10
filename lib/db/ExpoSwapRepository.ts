import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type {
    BoltzSwapStatus,
    PendingReverseSwap,
    PendingSubmarineSwap,
} from "@arkade-os/boltz-swap";
import { jsonStringify, jsonParse } from "./serialization";

// These types match @arkade-os/boltz-swap but aren't exported from the main entrypoint
type PendingSwap = PendingReverseSwap | PendingSubmarineSwap;

type GetSwapsFilter = {
    id?: string | string[];
    status?: BoltzSwapStatus | BoltzSwapStatus[];
    type?: PendingSwap["type"] | PendingSwap["type"][];
    orderBy?: "createdAt";
    orderDirection?: "asc" | "desc";
};

const DB_NAME = "arkade-boltz-swap.db";

function getDb(): SQLiteDatabase {
    const db = openDatabaseSync(DB_NAME);
    db.execSync(`PRAGMA journal_mode = WAL;`);
    db.execSync(`
        CREATE TABLE IF NOT EXISTS swaps (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            data TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_swaps_type ON swaps(type);
        CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
        CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON swaps(created_at);
    `);
    return db;
}

let _db: SQLiteDatabase | null = null;

function db(): SQLiteDatabase {
    if (!_db) _db = getDb();
    return _db;
}

function toArray<T>(value: T | T[] | undefined): T[] | undefined {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [value];
}

export class ExpoSwapRepository {
    async saveSwap<T extends PendingSwap>(swap: T): Promise<void> {
        db().runSync(
            `INSERT OR REPLACE INTO swaps (id, type, status, created_at, data) VALUES (?, ?, ?, ?, ?)`,
            [swap.id, swap.type, swap.status, swap.createdAt, jsonStringify(swap)]
        );
    }

    async deleteSwap(id: string): Promise<void> {
        db().runSync("DELETE FROM swaps WHERE id = ?", [id]);
    }

    async getAllSwaps<T extends PendingSwap>(
        filter?: GetSwapsFilter
    ): Promise<T[]> {
        if (!filter || Object.keys(filter).length === 0) {
            const rows = db().getAllSync<{ data: string }>(
                "SELECT data FROM swaps"
            );
            return rows.map((r) => jsonParse(r.data) as T);
        }

        const ids = toArray(filter.id);
        const statuses = toArray(filter.status);
        const types = toArray(filter.type);

        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (ids && ids.length > 0) {
            conditions.push(`id IN (${ids.map(() => "?").join(",")})`);
            params.push(...ids);
        }
        if (statuses && statuses.length > 0) {
            conditions.push(
                `status IN (${statuses.map(() => "?").join(",")})`
            );
            params.push(...statuses);
        }
        if (types && types.length > 0) {
            conditions.push(`type IN (${types.map(() => "?").join(",")})`);
            params.push(...types);
        }

        const where =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        let orderBy = "";
        if (filter.orderBy === "createdAt") {
            const dir = filter.orderDirection === "asc" ? "ASC" : "DESC";
            orderBy = `ORDER BY created_at ${dir}`;
        }

        const rows = db().getAllSync<{ data: string }>(
            `SELECT data FROM swaps ${where} ${orderBy}`,
            params
        );
        return rows.map((r) => jsonParse(r.data) as T);
    }

    async clear(): Promise<void> {
        db().runSync("DELETE FROM swaps");
    }

    async [Symbol.asyncDispose](): Promise<void> {
        if (_db) {
            _db.closeSync();
            _db = null;
        }
    }
}
