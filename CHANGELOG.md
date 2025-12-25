# Changelog

All notable changes to Map Circle Viewer will be documented in this file.

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

## [2.9.1] - 2025-12-25

### Fixed
- Terminated clients layer not showing on map
- Upload script now correctly preserves layer_name from JSON data
- Delete operation now clears all layers before re-upload

---

## [2.9.0] - 2025-12-25

### Added
- **Kyivstar: Завершені клієнти** layer with red color gradient
- 878 hexagons, 37,605 terminated clients
- Separate toggle for terminated clients in UI
- Same brightness/opacity logic as active clients

### Changed
- Split single Kyivstar toggle into two separate toggles
- Updated extraction script to handle both layers

---

## [2.8.1] - 2025-12-25

### Changed
- Increased hexagon visibility with darker colors
- Opacity range: 0.35 → 0.75 (was 0.25 → 0.5)
- More saturated green gradient (#7ed694 → #0d5016)

---

## [2.8.0] - 2025-12-25

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

## [2.7.0] - 2025-12-24

### Added
- **Map layer switcher** with 4 tile options:
  - 🗺️ OpenStreetMap
  - 🛣️ Google Maps (streets)
  - 🛰️ Google Satellite
  - 🌍 Google Hybrid
- Dropdown control in top-right corner of map

---

## [2.6.0] - 2025-12-24

### Added
- **Polygon persistence** to database
- Polygons from KML/KMZ files now saved to Supabase
- Polygons column added to groups table (JSONB)

---

## [2.5.0] - 2025-12-23

### Added
- **Marker icons** for KML points (circle, pin, square, diamond, star)
- **Compact labels** for markers with permanent tooltips
- Icon selector in group settings

---

## [2.4.0] - 2025-12-23

### Changed
- **UI restructure**: Upload and groups moved inside selected map
- Cleaner navigation flow between map list and map details

---

## [2.3.1] - 2025-12-22

### Fixed
- KMZ upload to selected map
- groups_type constraint issue

---

## [2.3.0] - 2025-12-22

### Added
- KMZ/KML file upload with group auto-detection
- Support for uploading to existing maps

---

## [2.2.0] - 2025-12-21

### Added
- **POI Layers**:
  - 🚇 Метро Києва (Kyiv Metro stations)
  - 🏬 Торгові центри (Shopping malls)
  - 🏋️ Фітнес-клуби (Fitness clubs)
  - 🛒 Супермаркети (Supermarkets)
- Adjustable radius for each POI layer (0-2000m)

---

## [2.1.0] - 2025-12-20

### Added
- User authentication (Supabase Auth)
- Map creation and management
- Group/point CRUD operations
- Map access control (owner, editor, viewer)

---

## [2.0.0] - 2025-12-19

### Added
- Supabase backend integration
- PostgreSQL database with RLS
- Railway deployment

### Changed
- Migrated from local-only to cloud-based storage

---

## [1.0.0] - 2025-12-18

### Added
- Initial release
- React + Vite + TailwindCSS frontend
- Leaflet map with circle overlays
- KMZ/KML file parsing
- Local file upload support
- Group visibility toggles
- Radius adjustment per group
- Color customization
