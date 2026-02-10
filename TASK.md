# Arkade Wallet: Cross-Platform Build Brief

## High-Level Intent
- Rebuild Arkade Wallet (self-custodial Bitcoin/Ark PWA) in Expo/React Native while preserving UX, flows, and partner integrations.
- Keep bottom-tab navigation (`Wallet`, `Apps`, `Settings`), onboarding + auth, and payment rail auto-selection.
- Find the current implementation as PWA in the `../wallet` folder
- Reuse as much code as you can especially in the `providers` and `lib` folders that should be platform-agnostic

## Navigation & Shell
- Single-shell app; bottom tab bar hidden during onboarding/init/unlock.
- Navigation stack via context.
- Portrait-only; prefers light theme.

## Onboarding & Wallet Lifecycle
- Create wallet: generate BIP39 mnemonic → seed → single private key, set default password `"noah"`, go to success.
- Restore wallet: accept `nsec` or hex private key; may pull Nostr config backup; inline validation/errors.
- Unlock: tries default password silently, then prompts for password/passkey if needed.

## Wallet Home (Wallet Tab)
- Shows logo, balance (hideable), PSA/nudges, server-error banner, transactions list with statuses; empty state graphic.
- Primary CTAs: `Send`, `Receive` (set flow context and route).

## Send Flow
- Recipient parser: Ark address (off-chain VTXO), on-chain BTC, Lightning invoice, LNURL, BIP21 (ark+btc+ln), Ark note voucher, URL with `lightning=` query.
- Validates server min/max limits, rail permissions (on-chain/off-chain), self-send prevention; nudges to enable Boltz if Lightning disabled.
- Amount input supports fiat toggle and custom numpad on mobile; fee/rail selection shown in details; success screen after broadcast/swap.

## Receive Flow
- Optional amount entry; faucet button when balance==0 and faucet reachable; shows Lightning fee estimate if swap needed.
- QR page builds BIP21 combining: on-chain boarding addr (if allowed), Ark off-chain addr, optional Boltz reverse-swap Lightning invoice; warns to keep tab open.
- Listens for service-worker payment events; on payment triggers success screen. Share sheet exports selected address/URI.

## Apps Tab (Partner dApps)
- Cards with NEW/coming-soon tags. Live pages:
  - Boltz: connection status, swaps list, detail page to refund submarine swaps or claim reverse swaps; settings toggle enables/disables and restores swaps.
  - Fuji Money: listed only (no page yet).

## Settings Tab
- Menu sections: General, Security, Advanced (Config hidden behind these). Key panels:
  - Backup: reveal/copy private key after password/passkey; toggle Nostr backups (full config + wallet).
  - Lock/Password: lock screen & change password/passkey.
  - Notifications: app-level toggle (service worker push analogue needed).
  - Server: change Ark server URL (normalizes protocol).
  - Logs, Support, About, Theme/Display/Fiat toggles (balance visibility, unit, currency display).
  - Advanced: VTXO manager, server, logs, reset; Reset wipes storage/config.
  - Notes: create/redeem Ark voucher notes.

## VTXO Management
- Settings → VTXOs lists spendable/recoverable coins, expiry countdowns, dust warnings; shows tags (settled/subdust/swept/unconfirmed/expiring soon).
- “Renew/Complete boarding” triggers rollover/settlement; computes best market hour; success toast hides UTXO list briefly.

## Tech Expectations to Mirror
- React + Ionic in web; replace with RN components but keep layout semantics (FlexRow/FlexCol, cards/shadows, dark palette with purple/green accents).
- Wallet engine: `@arkade-os/sdk` ServiceWorkerWallet + IndexedDB; in Expo use equivalent storage + background tasks for sync/notifications.
- Ark server (`aspUrl`) supplies limits, balances, history, rollover; enforce same gating logic in UI.
- Lightning: optional Boltz (`@arkade-os/boltz-swap`) for submarine/reverse swaps; create invoice for receive; subscribe to swap updates; allow refund/claim.

## Arkade dependencies

[//]: # (- PWA features: install prompt, push, portrait lock—map to mobile equivalents &#40;app install/push/back handling&#41;.)

## UX Styling Notes
- rounded cards, subtle shadows; accent purple/green for status.
- Bottom CTAs on critical flows; generous padding; monospace tags for badges; simple outline icons.

## Expected User Journeys
- First run → onboarding → create/restore → unlock → Wallet home.
- Send flow auto-selects rail (Ark off-chain vs on-chain vs Lightning) based on recipient + limits.
- Receive flow generates multi-rail QR (Ark/on-chain/Lightning) and listens for funds.
- Apps tab hosts embedded partner experiences that call back into wallet for addresses/signing/sending.
- Settings governs security, backups, server, appearance, and advanced VTXO upkeep.
