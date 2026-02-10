# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Arkade Wallet — a self-custodial Bitcoin/Ark wallet being rebuilt from an existing Ionic/React PWA (`../wallet`) into a cross-platform Expo/React Native app. The goal is to preserve the same UX, flows, and integrations. See `TASK.md` for the full feature specification.

## Development Commands

```bash
npx expo start                  # Start dev server
npx expo start --clear          # Start with cache cleared
npx expo start --web            # Start web version
npx expo lint                   # Run ESLint
npx expo doctor                 # Check project health
npx expo install --fix          # Fix incompatible package versions
```

## Architecture

### Monorepo Context

This project lives in a monorepo at `../` alongside sibling packages linked as local file dependencies:
- `@arkade-os/sdk` → `../ts-sdk` — Core wallet engine (identity, Ark protocol, VTXO management)
- `@arkade-os/boltz-swap` → `../boltz-swap` — Lightning submarine/reverse swaps via Boltz

### Crypto Polyfill Requirement

The `expo-crypto` polyfill **must be the first import** in the root layout before any SDK imports. React Native lacks native `crypto.getRandomValues`; without this, key generation and all crypto operations will fail. See `app-example/app/_layout.tsx` for the reference pattern:

```typescript
import * as Crypto from 'expo-crypto'
if (!global.crypto?.getRandomValues) {
  if (!global.crypto) global.crypto = {} as any
  global.crypto.getRandomValues = Crypto.getRandomValues
}
// Now safe to import SDK
import { Wallet, SingleKey } from '@arkade-os/sdk'
```

### SDK Integration Pattern

Wallet creation follows a specific sequence:
1. `AsyncStorageAdapter` from `@arkade-os/sdk/adapters/asyncStorage` for persistence
2. `SingleKey.fromRandomBytes()` or `SingleKey.fromHex()` for identity
3. `Wallet.create()` with `ExpoArkProvider` and `ExpoIndexerProvider` from `@arkade-os/sdk/adapters/expo`

### Navigation

Expo Router with file-based routing. Bottom tabs (`Wallet`, `Apps`, `Settings`) are the main shell; tabs hidden during onboarding/auth flows. Portrait-only orientation.

### Key Configuration

- **New Architecture** enabled (`newArchEnabled: true` in app.json)
- **React Compiler** enabled (`experiments.reactCompiler: true`)
- **Typed Routes** enabled (`experiments.typedRoutes: true`)
- Path alias: `@/*` maps to project root

### Reference Implementation

`app-example/` contains the original template code with working examples of themed components, tab navigation, haptic feedback, and wallet creation. Use it as a reference for patterns, then build into `app/`.

## Expo Documentation for AI

When working on Expo-specific features, consult:
- https://docs.expo.dev/llms-full.txt — Complete Expo + Router docs
- https://docs.expo.dev/llms-eas.txt — EAS Build/Submit/Update docs
- https://docs.expo.dev/llms-sdk.txt — Expo SDK module docs
