# How to Update AutoSnooze to v2.7.0 (The Fixed Version)

## You're Currently Running v2.0.0
The version showing in your integrations is **2.0.0** - this is the OLD version that tries to load Lit from CDN and breaks other cards.

You need to update to **v2.7.0** which has Lit bundled and won't break other cards.

## Update Instructions

### Method 1: Using Git (If you have access to the server)

```bash
# SSH into your Home Assistant server
# Navigate to the AutoSnooze directory
cd /config/custom_components/autosnooze
# Or wherever you installed it

# Pull the latest changes from the fix branch
git fetch origin
git checkout claude/fix-config-flow-error-3cKac
git pull origin claude/fix-config-flow-error-3cKac

# Verify you have version 2.7.0
cat custom_components/autosnooze/www/autosnooze-card.js | head -1
# Should show: const t=window,e=t.ShadowRoot... (minified bundled code)

# Restart Home Assistant
# Settings → System → Restart
```

### Method 2: Using File Editor (If you have HACS File Editor)

1. **Download the fixed files from GitHub:**
   - Go to: https://github.com/mossipcams/autosnooze/tree/claude/fix-config-flow-error-3cKac
   - Download the repository as ZIP
   - Extract it

2. **Replace the files:**
   - Navigate to `/config/custom_components/autosnooze/`
   - Replace all files with the ones from the downloaded ZIP
   - Make sure `www/autosnooze-card.js` is the new bundled version (~45KB)

3. **Restart Home Assistant**

### Method 3: Reinstall via HACS (If using HACS)

1. Go to **HACS** → **Integrations**
2. Find **AutoSnooze**
3. Click **⋮** (three dots) → **Redownload**
4. Make sure it's pulling from the correct branch/repo
5. **Restart Home Assistant**

### Method 4: Manual File Upload

I can provide you the fixed bundled card file:

1. Delete the current AutoSnooze integration:
   - Settings → Devices & Services → Integrations
   - Find AutoSnooze → **Delete**

2. Delete the old files:
   - Go to `/config/custom_components/autosnooze/`
   - Delete the entire `autosnooze` folder

3. Get the new version:
   - Download from: https://github.com/mossipcams/autosnooze/archive/refs/heads/claude/fix-config-flow-error-3cKac.zip
   - Extract the ZIP
   - Copy the `custom_components/autosnooze` folder to `/config/custom_components/`

4. **Restart Home Assistant**

5. Re-add AutoSnooze:
   - Settings → Devices & Services → **+ Add Integration**
   - Search for "AutoSnooze"
   - Add it

6. **Restart Home Assistant again**

## After Updating

Once you have v2.7.0 installed:

1. **Clear iOS Safari cache:**
   - iOS Settings → Safari → Advanced → Website Data
   - Find your HA URL and delete it

2. **Clear iOS HA App cache:**
   - HA App → Settings → Companion App → Reset frontend cache
   - Force close and reopen the app

3. **Check that cards work**

## How to Verify You Have v2.7.0

After updating and restarting:

1. Go to Settings → Devices & Services → Integrations
2. Find AutoSnooze
3. Version should show **2.7.0** or higher

## What's Different in v2.7.0

**Old v2.0.0 card (broken):**
```javascript
// Tries to load from CDN - breaks everything when it fails
import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/...";
```

**New v2.7.0 card (fixed):**
```javascript
// Lit is bundled into the file - no external dependencies
const t=window,e=t.ShadowRoot... // (minified bundled code)
```

The new version:
- **45KB** bundled file (old was ~10KB + CDN)
- **No external dependencies**
- **Cannot break other cards**
- **Works offline**
- **Matches Mushroom cards pattern**

## Need Help?

If you don't have server access or can't update:
1. Let me know what access you DO have
2. Tell me if you're using HACS or manual installation
3. I can provide more specific instructions
