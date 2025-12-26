# Map Circle Viewer - Claude Code Rules

## Git Push Rules

**MANDATORY** on EVERY version push to GitHub:

1. **Update CHANGELOG.md** at the TOP with new version entry:
   ```markdown
   ## [X.Y.Z] (Mascot) - YYYY-MM-DD

   ### Added
   - **Feature name** - description

   ### Changed
   - **Change description**

   ### Fixed
   - **Bug fix description**

   ### Removed
   - **Removed feature**

   ---
   ```

2. **Include CHANGELOG.md in commit** before pushing

---

## Version Mascot Rules

**MANDATORY** on MINOR version bump (e.g., v2.15.x -> v2.16.0):

1. **Create new mascot** in `src/components/VersionMascot.jsx`:
   - Add new entry to `MASCOTS` object at the TOP (before previous version)
   - Include: name, emoji, colors array, 12x12 pixels array

2. **Update gallery** in `src/components/MascotGallery.jsx`:
   - Add new entry to `VERSION_HISTORY` array at the TOP

3. **Update version string** in `src/App.jsx`:
   - Change `APP_VERSION` constant with new animal name

**Example:**
```javascript
// VersionMascot.jsx - add at TOP of MASCOTS
quetzal: {
  name: 'Quetzal',
  emoji: '🐦',
  colors: ['transparent', '#1B5E20', '#4CAF50', ...],
  pixels: [[...], [...], ...]
}

// MascotGallery.jsx - add at TOP of VERSION_HISTORY
{ version: '2.16.x', animal: 'quetzal' },

// App.jsx
const APP_VERSION = '2.16.0 (Quetzal)';
```

**PATCH versions** (e.g., v2.16.0 -> v2.16.1) keep the same mascot.

## Multi-Map Display (v2.16.0+)

- Groups from ALL visited maps are accumulated in `allLoadedGroups`
- Enabled checkboxes show points from multiple maps simultaneously
- `toggleAllGroups` affects only current map's groups in control panel
