# iOS Home Assistant App - Configuration Error Fix

## The Problem
The iOS app is showing "Configuration error" on cards after AutoSnooze update. This is due to aggressive caching on iOS.

## Quick Fix Steps

### Option 1: Clear App Cache (Recommended)
1. Open **Home Assistant iOS app**
2. Go to **Settings** (gear icon, bottom right)
3. Scroll down to **Companion App**
4. Tap **Reset frontend cache**
5. **Force close** the app (swipe up from bottom)
6. **Reopen** the app
7. Check if cards work

### Option 2: Remove Old Lovelace Resources
1. In Home Assistant, go to **Settings** → **Dashboards**
2. Tap **⋮** (three dots, top right) → **Resources**
3. Find and **DELETE** any entries containing:
   - `/autosnooze/`
   - `autosnooze-card.js`
4. Tap **Save**
5. **Restart Home Assistant** (Settings → System → Restart)
6. After restart, **reset frontend cache** in iOS app (Option 1)

### Option 3: Remove and Reinstall AutoSnooze Integration
1. Go to **Settings** → **Devices & Services** → **Integrations**
2. Find **AutoSnooze**
3. Tap **⋮** → **Delete**
4. **Restart Home Assistant**
5. After restart, **reinstall AutoSnooze**:
   - Settings → Devices & Services → **+ Add Integration**
   - Search for "AutoSnooze"
   - Add it
6. **Reset frontend cache** in iOS app

### Option 4: Force Full Refresh
1. In iOS app Settings → Companion App
2. **Sign out**
3. **Force close** the app
4. **Reopen** and **sign back in**
5. This forces complete reload of all resources

## Why This Happened

The AutoSnooze card was loading JavaScript from external CDNs. When those CDNs failed, it broke the Lovelace module loading system, causing ALL cards to fail with "Configuration error" messages.

**The Fix:** Version 2.7.0 now bundles the Lit library into the card file (45KB), eliminating all external dependencies. The card can no longer break other cards.

## If Still Broken After Above Steps

The bundled card is already in your update. If none of the above work:

1. Check that AutoSnooze updated to **version 2.7.0** or later
2. Try accessing from a desktop browser to verify it works there
3. If it works on desktop but not iOS, try **reinstalling the Home Assistant iOS app**

## Technical Details

- **Old version**: Loaded Lit from unpkg.com CDN → failed → broke everything
- **New version (2.7.0)**: Lit bundled into card → no external dependencies → can't break other cards
- **File**: `/autosnooze/autosnooze-card.js` (45KB, self-contained)
