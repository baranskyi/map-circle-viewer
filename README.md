# Map Circle Viewer

Interactive web application for visualizing geographic points with customizable circle overlays on OpenStreetMap.

## Features

- Display points on OpenStreetMap using Leaflet
- Organize points in toggleable groups
- Per-group customization:
  - Radius: 1000m - 5000m (step: 500m)
  - Color picker with 50% fill opacity
  - Show/hide toggle
- Upload your own KMZ/KML files or load from URL
- Default data: Kazakhstan (Almaty) fitness locations

## Tech Stack

- React 18 + Vite
- Leaflet + react-leaflet
- TailwindCSS
- JSZip (for KMZ parsing)

## Installation

```bash
cd Projects/map-circle-viewer
npm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:3000

## Build

```bash
npm run build
```

Output in `dist/` folder.

## Usage

1. **Default Data**: App loads with pre-configured Kazakhstan data
2. **Upload Custom Data**: Click "📁 File" to upload from disk or "🔗 URL" to load from web URL
3. **Toggle Groups**: Use checkboxes to show/hide groups
4. **Adjust Radius**: Slider controls circle size (1000-5000m)
5. **Change Colors**: Color picker changes stroke and fill (50% opacity)
6. **Reset**: Click "Reset" to restore default data

## File Format Support

- `.kmz` - Zipped KML (Google Earth export)
- `.kml` - Keyhole Markup Language

The parser extracts:
- Folders as groups
- Placemarks with coordinates
- Style colors (when available)

## Default Data

4 groups with 20 points in Almaty, Kazakhstan:
- Потенциал (9 points) - Red
- Инвиктус (7 points) - Blue
- S89 (2 points) - Green
- Одиночки (2 points) - Blue

## License

Private project
