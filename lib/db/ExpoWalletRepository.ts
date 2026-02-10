import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type {
    ArkTransaction,
    ExtendedCoin,
    ExtendedVirtualCoin,
} from "@arkade-os/sdk";
import { jsonStringify, jsonParse } from "./serialization";

// Match the WalletState type from @arkade-os/sdk (not exported from main entrypoint)
interface WalletState {
    lastSyncTime?: number;
    settings?: Record<string, any>;
}

const DB_NAME = "arkade-wallet.db";

function getDb(): SQLiteDatabase {
    const db = openDatabaseSync(DB_NAME);
    db.execSync(`PRAGMA journal_mode = WAL;`);
    db.execSync(`
        CREATE TABLE IF NOT EXISTS vtxos (
            address TEXT NOT NULL,
            txid TEXT NOT NULL,
            vout INTEGER NOT NULL,
            data TEXT NOT NULL,
            PRIMARY KEY (address, txid, vout)
        );
        CREATE TABLE IF NOT EXISTS utxos (
            address TEXT NOT NULL,
            txid TEXT NOT NULL,
            vout INTEGER NOT NULL,
            data TEXT NOT NULL,
            PRIMARY KEY (address, txid, vout)
        );
        CREATE TABLE IF NOT EXISTS transactions (
            address TEXT NOT NULL,
            key_boarding_txid TEXT NOT NULL,
            key_commitment_txid TEXT NOT NULL,
            key_ark_txid TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            data TEXT NOT NULL,
            PRIMARY KEY (address, key_boarding_txid, key_commitment_txid, key_ark_txid)
        );
        CREATE TABLE IF NOT EXISTS wallet_state (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL
        );
    `);
    return db;
}

let _db: SQLiteDatabase | null = null;

function db(): SQLiteDatabase {
    if (!_db) _db = getDb();
    return _db;
}

export class ExpoWalletRepository {
    async clear(): Promise<void> {
        db().execSync(`
            DELETE FROM vtxos;
            DELETE FROM utxos;
            DELETE FROM transactions;
            DELETE FROM wallet_state;
        `);
    }

    async getVtxos(address: string): Promise<ExtendedVirtualCoin[]> {
        const rows = db().getAllSync<{ data: string }>(
            "SELECT data FROM vtxos WHERE address = ?",
            [address]
        );
        return rows.map((r) => jsonParse(r.data) as ExtendedVirtualCoin);
    }

    async saveVtxos(
        address: string,
        vtxos: ExtendedVirtualCoin[]
    ): Promise<void> {
        db().withTransactionSync(() => {
            for (const vtxo of vtxos) {
                db().runSync(
                    `INSERT OR REPLACE INTO vtxos (address, txid, vout, data) VALUES (?, ?, ?, ?)`,
                    [address, vtxo.txid, vtxo.vout, jsonStringify(vtxo)]
                );
            }
        });
    }

    async deleteVtxos(address: string): Promise<void> {
        db().runSync("DELETE FROM vtxos WHERE address = ?", [address]);
    }

    async getUtxos(address: string): Promise<ExtendedCoin[]> {
        const rows = db().getAllSync<{ data: string }>(
            "SELECT data FROM utxos WHERE address = ?",
            [address]
        );
        return rows.map((r) => jsonParse(r.data) as ExtendedCoin);
    }

    async saveUtxos(address: string, utxos: ExtendedCoin[]): Promise<void> {
        db().withTransactionSync(() => {
            for (const utxo of utxos) {
                db().runSync(
                    `INSERT OR REPLACE INTO utxos (address, txid, vout, data) VALUES (?, ?, ?, ?)`,
                    [address, utxo.txid, utxo.vout, jsonStringify(utxo)]
                );
            }
        });
    }

    async deleteUtxos(address: string): Promise<void> {
        db().runSync("DELETE FROM utxos WHERE address = ?", [address]);
    }

    async getTransactionHistory(address: string): Promise<ArkTransaction[]> {
        const rows = db().getAllSync<{ data: string }>(
            "SELECT data FROM transactions WHERE address = ? ORDER BY created_at ASC",
            [address]
        );
        return rows.map((r) => jsonParse(r.data) as ArkTransaction);
    }

    async saveTransactions(
        address: string,
        txs: ArkTransaction[]
    ): Promise<void> {
        db().withTransactionSync(() => {
            for (const tx of txs) {
                db().runSync(
                    `INSERT OR REPLACE INTO transactions (address, key_boarding_txid, key_commitment_txid, key_ark_txid, created_at, data) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        address,
                        tx.key.boardingTxid,
                        tx.key.commitmentTxid,
                        tx.key.arkTxid,
                        tx.createdAt,
                        jsonStringify(tx),
                    ]
                );
            }
        });
    }

    async deleteTransactions(address: string): Promise<void> {
        db().runSync("DELETE FROM transactions WHERE address = ?", [address]);
    }

    async getWalletState(): Promise<WalletState | null> {
        const row = db().getFirstSync<{ data: string }>(
            "SELECT data FROM wallet_state WHERE key = ?",
            ["state"]
        );
        if (!row) return null;
        return jsonParse(row.data) as WalletState;
    }

    async saveWalletState(state: WalletState): Promise<void> {
        db().runSync(
            `INSERT OR REPLACE INTO wallet_state (key, data) VALUES (?, ?)`,
            ["state", jsonStringify(state)]
        );
    }

    async [Symbol.asyncDispose](): Promise<void> {
        if (_db) {
            _db.closeSync();
            _db = null;
        }
    }
}
