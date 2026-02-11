/**
 * IndexedDB polyfill for React Native (iOS / Android).
 *
 * Uses indexeddbshim backed by our WebSQL-over-expo-sqlite adapter.
 * Loaded via Metro's .native.ts platform extension — on web the
 * no-op sibling (indexeddb.ts) is loaded instead.
 *
 * Must be imported AFTER the crypto polyfill and BEFORE any SDK import.
 */

import { setupExpoDb } from '@arkade-os/sdk/adapters/expo';

setupExpoDb();
