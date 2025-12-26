# Changelog

All notable changes to Map Circle Viewer will be documented in this file.

## [2.17.5] (Fennec) - 2025-12-26

### Added
- **"Всі міста" option** - show all cities heatmap simultaneously (default)
- **Multi-city heatmaps** - 7 Ukrainian cities:
  - Київ (999 hexagons)
  - Одеса (555 hexagons)
  - Львів (254 hexagons)
  - Вінниця (101 hexagons)
  - Тернопіль (47 hexagons)
  - Біла Церква (31 hexagons)
  - Бориспіль (17 hexagons)
- **City selector dropdown** - choose specific city or all cities
- **Copyright notice** - "Слава Баранский 2026" under mascot

### Changed
- Default city changed from 'kyiv' to 'all'
- Parallel loading of all city data using Promise.allSettled

### Removed
- Quick preset buttons (Пн 8:00, Пн 18:00, Сб 14:00)

### Technical
- cities_config.py for city bounding boxes
- generate_all_heatmaps.py unified pipeline script
- ~2000 hexagons when all cities displayed

---

## [2.17.3] (Fennec) - 2025-12-26

### Added
- **Instruction modal** - "Інструкція" button in heatmap controls
- **Data flow diagram** - visual explanation of heatmap methodology

---

## [2.17.2] (Fennec) - 2025-12-26

### Added
- **HeatmapInstructionModal** component with methodology explanation

---

## [2.17.1] (Fennec) - 2025-12-26

### Changed
- **Full data format** - switched from compact (0.8MB) to full format (6.27MB)
- **Variation in synthetic patterns** - ±50% intensity, ±2h time shift
- **Location-based modulation** - center 1.2x, suburbs 0.5-0.8x intensity
- **Per-POI randomization** - reproducible via POI ID seed

---

## [2.17.0] (Fennec) - 2025-12-26

### Added
- **Heatmap layer** - city-wide visit popularity visualization for Kyiv
- **Time slider** - adjust hours (0-23) to see different time periods
- **Day selector** - switch between days of week (Mon-Sun)
- **Opacity control** - adjust heatmap transparency (0-100%)
- **Fennec mascot** for v2.17.x (desert fox pixel art)

### Technical
- H3 hexagonal aggregation (resolution 8, ~461m cells)
- Data sourced from 15,766 POIs across Kyiv
- leaflet.heat integration for smooth heatmap rendering

---

## [2.16.4] (Quetzal) - 2025-12-26

### Added
- **Opacity slider for user groups** - adjustable circle transparency (0-100%) in "Мої карти"

### Changed
- **Ukrainian translation** - ControlPanel and GroupControl translated (Групи, Радіус, Колір, Іконка, Підписи, etc.)
- Access level labels translated (власник, редактор, глядач)

---

## [2.16.3] (Quetzal) - 2025-12-26

### Added
- **InfoTooltip for Infrastructure** - explains that layers can be reordered but not added/removed

---

## [2.16.2] (Quetzal) - 2025-12-26

### Changed
- **Badge shows points count** - now displays number of visible points (not groups)
- **Smaller badge** - reduced size by 1.5x (text-[10px], smaller padding)
- **Smaller indicator dot** - w-2 h-2 instead of w-2.5 h-2.5

---

## [2.16.1] (Quetzal) - 2025-12-26

### Added
- **Active map indicators** - green dot and badge showing which maps have visible groups
- Green highlight for maps with active points displayed on map
- Tooltip showing active/total groups ratio (e.g., "2/5 груп активно")

---

## [2.16.0] (Quetzal) - 2025-12-26

### Added
- **Multi-map display** - show points from multiple maps simultaneously
- Groups from ALL visited maps are accumulated and displayed together
- New Quetzal mascot (colorful bird) for v2.16.x
- CLAUDE.md with project-specific rules

### Changed
- `allLoadedGroups` state accumulates groups across map switches
- `toggleAllGroups` now works per-map in control panel
- **MINOR version** - significant feature addition

---

## [2.15.5] (Puffin) - 2025-12-26

### Removed
- **Supermarkets layer** removed from Infrastructure section

### Fixed
- **Group checkbox persistence** - settings now preserved when switching between maps

---

## [2.15.4] (Puffin) - 2025-12-25

### Changed
- **Removed zoom controls** - +/- buttons removed from map for cleaner UI
- **Unified panel positions** - left panel now at same height as right panel (top-4)
- **Layer switcher aligned** - positioned at top level with panels

---

## [2.15.3] (Puffin) - 2025-12-25

### Fixed
- **Left panel moved below zoom buttons** - panel starts at 90px from top, clear of +/- controls
- **Layer switcher repositioned** - now at 80px from top, moves with panel collapse
- **Improved collapse button** - larger double-chevron icon (<<) with hover effect

---

## [2.15.2] (Puffin) - 2025-12-25

### Fixed
- **Left panel positioning** - panel no longer overlaps zoom +/- buttons
- **Horizontal scroll removed** - left panel content stays within bounds
- **Layer switcher follows panel** - map layer dropdown moves with left panel collapse/expand

---

## [2.15.1] (Puffin) - 2025-12-25

### Added
- **Mascot Gallery modal** - click on mascot to view all version mascots
- **Version history grid** - 18 mascots from v1.0.0 to v2.15.x displayed as tiles
- **Clickable mascot** - hover effect and click to open gallery

---

## [2.15.0] (Puffin) - 2025-12-25

### Added
- **Collapsible left panel** - hamburger menu button to collapse/expand the control panel
- **Pixel art logo** - new Map Circle Viewer logo with map pin and circles
- **Puffin mascot** for v2.15.x

### Fixed
- **Labels on KMZ polygons** - labels now show only on hover, not permanently
- **Map layer switcher position** - moved left to avoid overlap with right panel

### Changed
- Header redesigned with pixel logo and collapse button

---

## [2.14.0] (Okapi) - 2025-12-25

### Added
- **All visible points in side panel** - now shows ALL infrastructure points (Metro, Apollo, Fitness, Malls, Supermarkets) not just user map points
- **Infrastructure icons in panel** - each POI type has its own icon (М for Metro, A for Apollo, etc.)
- **Type-based grouping** - points are grouped by type (Метро, APOLLO NEXT, Фітнес, ТРЦ, Супермаркет)

### Changed
- POI layers now report their points to parent for unified tracking
- BoundsTracker tracks both user groups and all infrastructure points
- New Okapi pixel art mascot for v2.14.x

### Fixed
- Right panel was showing 0 points even when many points visible on map

---

## [2.13.0] (Narwhal) - 2025-12-25

### Added
- **Visible points panel** - right-side panel showing all points visible on current screen
- **Search functionality** in panel - filter visible points by name or group
- **Hover-to-highlight** - hovering over point in panel highlights it on the map with glow effect
- **Click-to-center** - clicking point in panel centers the map on that location
- **Points grouping** - visible points organized by their groups in the panel
- **Collapsible panel** - can be minimized to icon with point count badge
- **Highlighted marker icons** - larger icons with animated glow when hovered from panel

### Changed
- New Narwhal pixel art mascot for v2.13.x
- Improved marker interaction with highlighted states

---

## [2.12.1] (Pangolin) - 2025-12-25

### Added
- **Pixel art mascot** for each version (120x120px) displayed under version number
- Version naming rules: animal changes only on minor version (2.12.x → 2.13.0)

### Fixed
- **Click-through for markers** - circles no longer block clicks on underlying markers
- Points can now be clicked even when covered by other layers' radius circles

### Changed
- Removed unnecessary drag hint text from infrastructure panel

---

## [2.12.0] (Pangolin) - 2025-12-25

### Added
- **Draggable infrastructure cards** - reorder layers by drag-and-drop
- Layer order **saved to user account** (Supabase for authenticated users, localStorage for guests)
- Visual drag handle with grab cursor for each layer card

### Changed
- Infrastructure layers now use unified `DraggableInfrastructure` component
- Improved layer card design with drag state visual feedback

---

## [2.11.0] (Axolotl) - 2025-12-25

### Added
- **Brightness/opacity sliders** for all infrastructure layers (0-100%)
- **"М" letter markers** for Metro stations (like "A" for Apollo)
- Proportional opacity for Kyivstar hexagons (preserves relative brightness based on people count)

### Changed
- Metro markers now use custom icons with "М" letter instead of circle markers
- All layer components now accept opacity prop for smooth control

---

## [2.10.1] (Quokka) - 2025-12-25

### Added
- **Radius control for Apollo clubs** - adjustable coverage circles (0-2000m)
- Quick buttons: Вимк, 500м, 1000м, 2000м
- Manual input for custom radius values

---

## [2.10.0] (Capybara) - 2025-12-25

### Added
- **APOLLO NEXT clubs layer** with 19 fitness club locations
- **Version codenames** - each version now has a meme animal name
- Orange markers with "A" icon for club identification
- Popup with club name, mall/TC name, address, and city
- Coverage across 6 cities:
  - Київ: 13 clubs
  - Львів: 2 clubs
  - Одеса: 2 clubs
  - Вінниця, Біла Церква, Бориспіль: 1 club each
- Toggle "🏋️ APOLLO NEXT клуби" in infrastructure panel
- Geocoding script for address → coordinates conversion
- Database table `apollo_clubs` with RLS policies

---

## [2.9.1] (Wombat) - 2025-12-25

### Fixed
- Terminated clients layer not showing on map
- Upload script now correctly preserves layer_name from JSON data
- Delete operation now clears all layers before re-upload

---

## [2.9.0] (Wombat) - 2025-12-25

### Added
- **Kyivstar: Завершені клієнти** layer with red color gradient
- 878 hexagons, 37,605 terminated clients
- Separate toggle for terminated clients in UI
- Same brightness/opacity logic as active clients

### Changed
- Split single Kyivstar toggle into two separate toggles
- Updated extraction script to handle both layers

---

## [2.8.1] (Platypus) - 2025-12-25

### Changed
- Increased hexagon visibility with darker colors
- Opacity range: 0.35 → 0.75 (was 0.25 → 0.5)
- More saturated green gradient (#7ed694 → #0d5016)

---

## [2.8.0] (Platypus) - 2025-12-25

### Added
- **Kyivstar hexagon layer** for customer distribution zones
- 390 hexagons showing active Apollo clients
- Color gradient based on people count (darker = more people)
- Click popup with statistics:
  - 🏠 Тільки дім (home only)
  - 🏢 Тільки робота (work only)
  - 🏠🏢 Дім і робота (home + work)
  - 📊 Всього (total)
  - 🏋️ Розподіл по спортзалах (gym distribution)
- Python script for extracting data from Kyivstar HTML maps
- Node.js script for uploading data to Supabase
- Database migration for kyivstar_hexagons table

---

## [2.7.0] (Sloth) - 2025-12-24

### Added
- **Map layer switcher** with 4 tile options:
  - 🗺️ OpenStreetMap
  - 🛣️ Google Maps (streets)
  - 🛰️ Google Satellite
  - 🌍 Google Hybrid
- Dropdown control in top-right corner of map

---

## [2.6.0] (RedPanda) - 2025-12-24

### Added
- **Polygon persistence** to database
- Polygons from KML/KMZ files now saved to Supabase
- Polygons column added to groups table (JSONB)

---

## [2.5.0] (Hedgehog) - 2025-12-23

### Added
- **Marker icons** for KML points (circle, pin, square, diamond, star)
- **Compact labels** for markers with permanent tooltips
- Icon selector in group settings

---

## [2.4.0] (Otter) - 2025-12-23

### Changed
- **UI restructure**: Upload and groups moved inside selected map
- Cleaner navigation flow between map list and map details

---

## [2.3.1] (Raccoon) - 2025-12-22

### Fixed
- KMZ upload to selected map
- groups_type constraint issue

---

## [2.3.0] (Raccoon) - 2025-12-22

### Added
- KMZ/KML file upload with group auto-detection
- Support for uploading to existing maps

---

## [2.2.0] (Koala) - 2025-12-21

### Added
- **POI Layers**:
  - 🚇 Метро Києва (Kyiv Metro stations)
  - 🏬 Торгові центри (Shopping malls)
  - 🏋️ Фітнес-клуби (Fitness clubs)
  - 🛒 Супермаркети (Supermarkets)
- Adjustable radius for each POI layer (0-2000m)

---

## [2.1.0] (Alpaca) - 2025-12-20

### Added
- User authentication (Supabase Auth)
- Map creation and management
- Group/point CRUD operations
- Map access control (owner, editor, viewer)

---

## [2.0.0] (Llama) - 2025-12-19

### Added
- Supabase backend integration
- PostgreSQL database with RLS
- Railway deployment

### Changed
- Migrated from local-only to cloud-based storage

---

## [1.0.0] (Dodo) - 2025-12-18

### Added
- Initial release
- React + Vite + TailwindCSS frontend
- Leaflet map with circle overlays
- KMZ/KML file parsing
- Local file upload support
- Group visibility toggles
- Radius adjustment per group
- Color customization
