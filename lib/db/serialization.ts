import { hex } from "@scure/base";

/**
 * JSON serialization helpers for SQLite storage.
 * Handles Uint8Array (→ hex) and Date (→ timestamp) round-tripping.
 */

function replacer(_key: string, value: unknown): unknown {
    if (value instanceof Uint8Array) {
        return { __t: "u8a", d: hex.encode(value) };
    }
    if (value instanceof Date) {
        return { __t: "date", d: value.getTime() };
    }
    return value;
}

function reviver(_key: string, value: unknown): unknown {
    if (
        value !== null &&
        typeof value === "object" &&
        "__t" in (value as Record<string, unknown>)
    ) {
        const v = value as { __t: string; d: unknown };
        if (v.__t === "u8a" && typeof v.d === "string") {
            return hex.decode(v.d);
        }
        if (v.__t === "date" && typeof v.d === "number") {
            return new Date(v.d);
        }
    }
    return value;
}

export function jsonStringify(value: unknown): string {
    return JSON.stringify(value, replacer);
}

export function jsonParse(text: string): unknown {
    return JSON.parse(text, reviver);
}
