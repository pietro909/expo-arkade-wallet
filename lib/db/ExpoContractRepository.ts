import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type { Contract, ContractState } from "@arkade-os/sdk";
import { jsonStringify, jsonParse } from "./serialization";

// Match the ContractFilter type from @arkade-os/sdk (not exported from main entrypoint)
interface ContractFilter {
    script?: string | string[];
    state?: ContractState | ContractState[];
    type?: string | string[];
}

const DB_NAME = "arkade-contracts.db";

function getDb(): SQLiteDatabase {
    const db = openDatabaseSync(DB_NAME);
    db.execSync(`PRAGMA journal_mode = WAL;`);
    db.execSync(`
        CREATE TABLE IF NOT EXISTS contracts (
            script TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            state TEXT NOT NULL,
            data TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
        CREATE INDEX IF NOT EXISTS idx_contracts_state ON contracts(state);
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

export class ExpoContractRepository {
    async clear(): Promise<void> {
        db().runSync("DELETE FROM contracts");
    }

    async getContracts(filter?: ContractFilter): Promise<Contract[]> {
        if (!filter || Object.keys(filter).length === 0) {
            const rows = db().getAllSync<{ data: string }>(
                "SELECT data FROM contracts"
            );
            return rows.map((r) => jsonParse(r.data) as Contract);
        }

        const scripts = toArray(filter.script);
        const states = toArray(filter.state);
        const types = toArray(filter.type);

        const conditions: string[] = [];
        const params: string[] = [];

        if (scripts && scripts.length > 0) {
            conditions.push(
                `script IN (${scripts.map(() => "?").join(",")})`
            );
            params.push(...scripts);
        }
        if (states && states.length > 0) {
            conditions.push(
                `state IN (${states.map(() => "?").join(",")})`
            );
            params.push(...states);
        }
        if (types && types.length > 0) {
            conditions.push(
                `type IN (${types.map(() => "?").join(",")})`
            );
            params.push(...types);
        }

        const where =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        const rows = db().getAllSync<{ data: string }>(
            `SELECT data FROM contracts ${where}`,
            params
        );
        return rows.map((r) => jsonParse(r.data) as Contract);
    }

    async saveContract(contract: Contract): Promise<void> {
        db().runSync(
            `INSERT OR REPLACE INTO contracts (script, type, state, data) VALUES (?, ?, ?, ?)`,
            [contract.script, contract.type, contract.state, jsonStringify(contract)]
        );
    }

    async deleteContract(script: string): Promise<void> {
        db().runSync("DELETE FROM contracts WHERE script = ?", [script]);
    }

    async [Symbol.asyncDispose](): Promise<void> {
        if (_db) {
            _db.closeSync();
            _db = null;
        }
    }
}
