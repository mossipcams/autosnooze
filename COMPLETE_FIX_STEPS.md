# Complete Fix for Configuration Errors - iOS Safari

## The Problem
After updating AutoSnooze, iOS Safari is showing "Configuration error" on multiple cards (Mushroom cards, etc.). This is because:
1. Old broken AutoSnooze card version tried to load from CDN → failed
2. This broke Lovelace's entire resource loading system
3. iOS/Safari aggressively caches the broken resources

## Complete Fix (Do ALL Steps in Order)

### Step 1: Update AutoSnooze Integration
**On your Home Assistant server:**
```bash
cd /path/to/custom_components/autosnooze
git fetch origin
git checkout claude/fix-config-flow-error-3cKac
git pull origin claude/fix-config-flow-error-3cKac
```

Or if using HACS:
1. Go to HACS → Integrations
2. Find AutoSnooze
3. Click **Reinstall** or **Update**
4. Make sure version **2.7.0** or newer is installed

### Step 2: Remove ALL AutoSnooze Lovelace Resources
**Critical - Don't skip this!**

1. Open Home Assistant in **desktop browser** (easier to work with)
2. Go to **Settings** → **Dashboards**
3. Click **⋮** (three dots, top right) → **Resources**
4. Find **every entry** containing:
   - `/autosnooze/`
   - `autosnooze-card.js`
   - Any external URLs to CDNs (unpkg, jsdelivr, etc.) related to AutoSnooze
5. **DELETE ALL** of them
6. Click **Save**

### Step 3: Restart Home Assistant
**Completely restart the server:**
1. Settings → System → **Restart**
2. Wait for full restart (check availability)

### Step 4: Clear iOS Safari Cache Completely
**On your iOS device:**

**Option A - Within Safari:**
1. Open **Settings** app (iOS Settings, not HA app)
2. Scroll down to **Safari**
3. Scroll down to **Advanced** → **Website Data**
4. Find your Home Assistant URL
5. Swipe left and **Delete**
6. Or tap **Remove All Website Data** (clears everything)

**Option B - Using Home Assistant App:**
1. Open **Home Assistant iOS app**
2. Tap **Settings** (gear icon, bottom right)
3. Scroll to **Companion App** section
4. Tap **Reset frontend cache**
5. **Force close** the app completely:
   - Swipe up from bottom (or double-tap home button)
   - Swipe up on Home Assistant app to close
6. **Reopen** the app

### Step 5: Clear ALL Browser Tabs
1. Close **all** Safari tabs showing Home Assistant
2. Close Home Assistant iOS app completely
3. Wait 10 seconds

### Step 6: Fresh Start
1. Open Safari or HA app fresh
2. Navigate to your dashboard
3. Cards should now work

## Still Not Working?

### Verify AutoSnooze Version
1. Go to Settings → Devices & Services → Integrations
2. Find AutoSnooze
3. Check version should be **2.7.0** or higher

### Nuclear Option - Reinstall AutoSnooze
1. Settings → Devices & Services → Integrations
2. Find **AutoSnooze** → Click **⋮** → **Delete**
3. **Restart Home Assistant**
4. After restart: Settings → Devices & Services → **+ Add Integration**
5. Search "AutoSnooze" and add it
6. **Restart Home Assistant again**
7. Clear iOS Safari cache (Step 4 above)
8. Force close and reopen

### Check Resources Again
1. Go to Settings → Dashboards → Resources
2. You should see `/autosnooze/autosnooze-card.js` (added by integration)
3. If you see multiple entries, delete all and restart HA

### Desktop Browser Test
1. Try opening HA in desktop Chrome/Firefox
2. Open Developer Tools (F12) → Console
3. Look for errors mentioning AutoSnooze
4. If desktop works but iOS doesn't → it's iOS cache issue
5. Try Safari **Private Browsing** mode on iOS as test

## Why This Happened

**Old AutoSnooze (v2.6.0 and earlier):**
```javascript
// Tried to load from CDN - when this failed, broke everything
import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/...";
```

**New AutoSnooze (v2.7.0+):**
```javascript
// Lit is bundled into the 45KB card file - no external dependencies
const t=window,e=t.ShadowRoot... // (minified bundled code)
```

The new version **cannot break other cards** because:
- No external CDN dependencies
- Self-contained JavaScript
- Follows same pattern as Mushroom cards

## If Nothing Works

Try these last resort options:

1. **Delete and reinstall Home Assistant iOS app** (after doing Steps 1-3)
2. **Use desktop browser instead** (Chrome on your computer)
3. **Contact me with:**
   - Screenshot of Settings → Dashboards → Resources page
   - iOS version
   - Safari version
   - Exact AutoSnooze version installed
