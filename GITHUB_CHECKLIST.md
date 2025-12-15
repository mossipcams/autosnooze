# Quick GitHub Setup Checklist

## ✅ Pre-Upload Checklist

- [ ] Update `YOUR_USERNAME` in README.md badges
- [ ] Update `YOUR_USERNAME` in info.md
- [ ] Update `YOUR_USERNAME` in manifest.json documentation URL
- [ ] Add your name/year to LICENSE file
- [ ] Review INSTALL.md for accuracy

## 📤 Upload to GitHub

### Method 1: GitHub Web (Easiest)

1. Create new repository on GitHub
   - Name: `autosnooze`
   - Public
   - No README/LICENSE (we have them)

2. Upload files:
   - Click "uploading an existing file"
   - Drag entire autosnooze folder
   - Commit to main

### Method 2: Git CLI

```bash
cd autosnooze

git init
git add .
git commit -m "Initial release - AutoSnooze v2.0.0"

git remote add origin https://github.com/YOUR_USERNAME/autosnooze.git
git branch -M main
git push -u origin main
```

## 🏷️ Create Release

1. Go to repository → Releases → "Create a new release"
2. Tag: `v2.0.0`
3. Title: `AutoSnooze v2.0.0 - Initial Release`
4. Description:
   ```
   # AutoSnooze v2.0.0
   
   Initial release with full PRD compliance.
   
   ## Features
   - Area and Label filtering
   - Preset duration pills (30m/1h/4h/1day)
   - Custom duration input
   - Toast notifications
   - Real-time countdowns
   - Amber-bordered active state
   - Persistent across restarts
   
   ## Installation
   Via HACS: Add as custom repository
   Manual: See INSTALL.md
   
   ## Breaking Changes
   Domain changed from `automation_pause` to `autosnooze`
   See MIGRATION.md for upgrade instructions
   ```
5. Click "Publish release"

## 🎨 Repository Settings

### Add Topics
Go to repo main page → About (gear icon) → Topics:
- `home-assistant`
- `home-assistant-integration`
- `hacs`
- `automation`
- `homeassistant-custom`
- `smart-home`

### Set Description
"Temporarily pause Home Assistant automations with Area and Label filtering"

### Enable Issues
Settings → Features → Check "Issues"

## 📦 Make HACS Compatible

Your repo is already HACS-ready:
- ✅ `custom_components/autosnooze/` folder structure
- ✅ `hacs.json` configured
- ✅ `LICENSE` file included
- ✅ `info.md` for HACS display
- ✅ `README.md` with documentation

Users can add via:
HACS → Integrations → ⋮ → Custom repositories
→ Add: `https://github.com/YOUR_USERNAME/autosnooze`
→ Category: Integration

## 🧪 Test Installation

1. In your Home Assistant:
   - HACS → Integrations → ⋮ → Custom repositories
   - Repository: `https://github.com/YOUR_USERNAME/autosnooze`
   - Category: Integration
   - Click "Add"

2. Search "AutoSnooze" in HACS
3. Click "Download"
4. Restart Home Assistant
5. Settings → Devices & Services → Add Integration → AutoSnooze
6. Add dashboard card:
   ```yaml
   type: custom:autosnooze-card
   title: AutoSnooze
   ```

## 📢 Share Your Work

Post on:
- [Home Assistant Community](https://community.home-assistant.io/)
- [r/homeassistant](https://www.reddit.com/r/homeassistant/)
- Home Assistant Discord

Example announcement:
```
I created AutoSnooze - a new integration to temporarily pause automations!

Features:
• Filter by Area or Label
• Preset duration buttons
• Real-time countdowns
• Survives restarts

GitHub: https://github.com/YOUR_USERNAME/autosnooze
Add via HACS as custom repository

Feedback welcome!
```

## 🔄 Future Updates

When making changes:

1. Update version in `manifest.json`
2. Commit and push changes
3. Create new release with new tag (e.g., `v2.0.1`)
4. Users update via HACS

## 🐛 Issues

Enable GitHub Issues for bug reports and feature requests.

Create issue templates:
- Bug Report
- Feature Request
- Question

## ⭐ Next Steps

- [ ] Get users to star the repo
- [ ] Collect feedback
- [ ] Submit to HACS default (optional, strict requirements)
- [ ] Create screenshots/GIFs for README
- [ ] Add to Home Assistant Brand repository (optional)

---

See [GITHUB_SETUP.md](GITHUB_SETUP.md) for detailed instructions.
