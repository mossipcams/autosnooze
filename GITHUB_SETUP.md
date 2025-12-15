# GitHub + HACS Setup Guide

## Repository Structure

Your GitHub repository should look like this:

```
your-repo/
├── README.md                    ← Project documentation
├── LICENSE                      ← Required by HACS
├── hacs.json                    ← HACS configuration
├── info.md                      ← Optional: HACS info page
│
├── custom_components/
│   └── autosnooze/
│       ├── __init__.py
│       ├── sensor.py
│       ├── config_flow.py
│       ├── manifest.json
│       ├── services.yaml
│       └── translations/
│           └── en.json
│
└── www/
    └── autosnooze-card.js
```

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `autosnooze` (or your preferred name)
3. Description: "Temporarily pause Home Assistant automations"
4. Public repository (required for HACS)
5. **Do NOT** initialize with README (we have one)
6. Click "Create repository"

## Step 2: Upload Files

### Option A: GitHub Web Interface

1. Click "uploading an existing file"
2. Drag the entire `autosnooze/` folder structure
3. Commit directly to main

### Option B: Git Command Line

```bash
cd autosnooze

# Initialize git
git init
git add .
git commit -m "Initial commit - AutoSnooze v2.0.0"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/autosnooze.git
git branch -M main
git push -u origin main
```

## Step 3: Add Required Files

### LICENSE (Required by HACS)

Create a `LICENSE` file in the root. Use MIT License:

```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### hacs.json (Already included)

Your `hacs.json` is already configured:
```json
{
  "name": "AutoSnooze",
  "content_in_root": false,
  "render_readme": true
}
```

### info.md (Optional)

Create `info.md` for a custom HACS info page:

```markdown
# AutoSnooze

Temporarily pause Home Assistant automations with Area and Label filtering.

## Features

- ✅ Filter by Area or Label
- ✅ Preset duration pills (30m, 1h, 4h, 1 day)
- ✅ Custom duration input
- ✅ Toast notifications
- ✅ Survives restarts
- ✅ Real-time countdowns

## Installation via HACS

1. Click the button below or add this repository manually in HACS
2. Restart Home Assistant
3. Go to Settings → Devices & Services → Add Integration
4. Search for "AutoSnooze"

## Dashboard Card

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

For full documentation, see [README.md](https://github.com/YOUR_USERNAME/autosnooze)
```

## Step 4: Create a Release (Recommended)

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v2.0.0`
4. Release title: `AutoSnooze v2.0.0`
5. Description:
   ```
   Initial release of AutoSnooze - Temporarily pause Home Assistant automations
   
   Features:
   - Area and Label filtering
   - Preset duration pills
   - Toast notifications
   - Amber-bordered active state
   - Persistent across restarts
   ```
6. Click "Publish release"

## Step 5: Add to HACS

### Method 1: Wait for Official Inclusion
Submit to HACS default repository (takes time, strict requirements)

### Method 2: Custom Repository (Immediate)

Users can add your repo directly:

1. In Home Assistant: HACS → Integrations → ⋮ (three dots) → Custom repositories
2. Repository URL: `https://github.com/YOUR_USERNAME/autosnooze`
3. Category: Integration
4. Click "Add"
5. Find "AutoSnooze" and install

## Step 6: Update manifest.json

Make sure your repository URL is in `manifest.json`:

```json
{
  "domain": "autosnooze",
  "name": "AutoSnooze",
  "codeowners": [],
  "config_flow": true,
  "dependencies": [],
  "documentation": "https://github.com/YOUR_USERNAME/autosnooze",
  "integration_type": "service",
  "iot_class": "local_push",
  "requirements": [],
  "version": "2.0.0"
}
```

## Repository Settings

### Topics (Recommended)
Add these topics to your repository for discoverability:
- `home-assistant`
- `home-assistant-integration`
- `hacs`
- `automation`
- `homeassistant-custom`

Go to your repo → Settings (gear icon) → Topics

### Description
Set repository description:
"Temporarily pause Home Assistant automations with Area and Label filtering"

## Testing Installation

After setup, test that users can install:

1. Open HACS in Home Assistant
2. Integrations → ⋮ → Custom repositories
3. Add: `https://github.com/YOUR_USERNAME/autosnooze`
4. Category: Integration
5. Should appear in HACS as "AutoSnooze"
6. Click "Download" → "Download"
7. Restart Home Assistant
8. Add integration works

## Updating Versions

When you make changes:

```bash
# 1. Update version in manifest.json
# 2. Commit changes
git add .
git commit -m "Update to v2.0.1"
git push

# 3. Create new release on GitHub
# Tag: v2.0.1
# Users can update via HACS
```

## Common Issues

**"Repository structure not compliant"**
- Make sure `custom_components/autosnooze/` exists
- Ensure `manifest.json` has correct domain
- Verify `hacs.json` has `"content_in_root": false`

**"Could not find integration"**
- Check domain in `manifest.json` matches folder name
- Ensure `__init__.py` has correct DOMAIN constant

**Card not loading**
- Verify `www/autosnooze-card.js` exists
- Check card type in dashboard is `custom:autosnooze-card`
- Clear browser cache

## HACS Validation

Before submitting to HACS default:
- ✅ Repository is public
- ✅ Has LICENSE file
- ✅ Has hacs.json with correct structure
- ✅ Has README.md
- ✅ Releases use semantic versioning
- ✅ Code follows Home Assistant integration standards

## Promotion

Add badges to README.md:

```markdown
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/YOUR_USERNAME/autosnooze.svg)](https://github.com/YOUR_USERNAME/autosnooze/releases)
[![License](https://img.shields.io/github/license/YOUR_USERNAME/autosnooze.svg)](LICENSE)
```

Share on:
- Home Assistant Community Forum
- Reddit: r/homeassistant
- Home Assistant Discord
