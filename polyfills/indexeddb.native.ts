/**
 * IndexedDB polyfill for React Native (iOS / Android).
 *
 * Uses indexeddbshim backed by our WebSQL-over-expo-sqlite adapter.
 * Loaded via Metro's .native.ts platform extension — on web the
 * no-op sibling (indexeddb.ts) is loaded instead.
 *
 * Must be imported AFTER the crypto polyfill and BEFORE any SDK import.
 */

import { openDatabase } from '@arkade-os/sdk/adapters/expo';

// 1. Ensure `window` is defined — the SDK's getGlobalObject() and
//    indexeddbshim both reference it.
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}

// 2. Stub location.origin — indexeddbshim reads it for origin checks.
if (typeof (globalThis as any).location === 'undefined') {
  (globalThis as any).location = { origin: 'expo://localhost' };
}

// 3. Attach our WebSQL adapter so the shim finds openDatabase.
(globalThis as any).openDatabase = openDatabase;

// 4. Initialize indexeddbshim — sets globalThis.indexedDB + all IDB* globals.
// @ts-ignore — no types for the browser-noninvasive entry
import setGlobalVars from 'indexeddbshim';

setGlobalVars(globalThis, {
  checkOrigin: false,
  useSQLiteIndexes: true,
  cacheDatabaseInstances: true,
});
