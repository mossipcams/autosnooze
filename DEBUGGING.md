# AutoSnooze Card Debugging Guide

## Current Issue
Dashboard shows "Configuration error" on multiple cards after updating AutoSnooze.

## Steps to Fix

### 1. Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Take a screenshot of any errors mentioning AutoSnooze or custom elements

### 2. Remove Old Lovelace Resource Registrations
1. Go to **Settings** → **Dashboards** → **⋮ (three dots)** → **Resources**
2. Look for any entries containing `/autosnooze/` or `autosnooze-card.js`
3. **DELETE ALL** AutoSnooze resource entries
4. Click **Save**

### 3. Check for Duplicate Registrations
The integration auto-registers the card, but old registrations might conflict.
After deleting resources in step 2, the integration will re-register on next restart.

### 4. Full Restart Sequence
1. Delete AutoSnooze resources (step 2)
2. **Restart Home Assistant** (Settings → System → Restart)
3. Wait for restart to complete
4. **Hard refresh browser**:
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear all browser cache for your HA URL
5. Check dashboard

### 5. If Still Broken - Temporarily Disable Auto-Registration
If the above doesn't work, we can disable auto-registration temporarily:
1. Go to Settings → Devices & Services → Integrations
2. Find AutoSnooze integration
3. Click **...** → **Delete**
4. Reinstall AutoSnooze
5. Manually add resource: `/autosnooze/autosnooze-card.js` as JavaScript Module

### 6. Check What Error Messages Say
Click on one of the "Configuration error" boxes and tell me:
- What is the exact error message?
- Which custom element is failing?
- Is it still mentioning "mushroom-person-card" or something else?

## Common Causes
- **Old resource registration** pointing to broken CDN version
- **Duplicate registrations** causing conflicts
- **Browser cache** serving old broken JavaScript
- **Card definition not loaded** before being used

## Next Steps
Please try steps 1-4 above and report back:
1. What errors appear in browser console?
2. Did removing resources and restarting fix it?
3. What specific error message shows when you click a "Configuration error"?
