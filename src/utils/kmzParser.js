import JSZip from 'jszip';

// Parse KMZ file and extract groups with points
export async function parseKMZ(file) {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // Find the KML file inside the KMZ
  let kmlFile = null;
  for (const filename of Object.keys(contents.files)) {
    if (filename.endsWith('.kml')) {
      kmlFile = contents.files[filename];
      break;
    }
  }

  if (!kmlFile) {
    throw new Error('No KML file found in KMZ archive');
  }

  const kmlText = await kmlFile.async('text');
  return parseKML(kmlText);
}

// Parse KML text and extract groups with points
export function parseKML(kmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, 'text/xml');

  const groups = [];
  const folders = doc.querySelectorAll('Folder');

  // Color palette for groups without defined colors
  const defaultColors = ['#FF5252', '#0288D1', '#7CB342', '#FF9800', '#9C27B0', '#00BCD4', '#795548', '#607D8B'];
  let colorIndex = 0;

  folders.forEach((folder, index) => {
    const folderName = folder.querySelector(':scope > name')?.textContent || `Group ${index + 1}`;
    const placemarks = folder.querySelectorAll('Placemark');

    if (placemarks.length === 0) return;

    const points = [];
    let groupColor = defaultColors[colorIndex % defaultColors.length];

    placemarks.forEach(placemark => {
      const name = placemark.querySelector('name')?.textContent || 'Unnamed';
      const coordinates = placemark.querySelector('coordinates')?.textContent;

      if (coordinates) {
        const [lng, lat] = coordinates.trim().split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({ name, lat, lng });
        }
      }

      // Try to extract color from style
      const styleUrl = placemark.querySelector('styleUrl')?.textContent;
      if (styleUrl) {
        const styleId = styleUrl.replace('#', '');
        const style = doc.querySelector(`Style[id="${styleId}"], StyleMap[id="${styleId}"]`);
        if (style) {
          const color = extractColorFromStyle(style, doc);
          if (color) {
            groupColor = color;
          }
        }
      }
    });

    if (points.length > 0) {
      groups.push({
        id: `group-${index}-${Date.now()}`,
        name: folderName,
        defaultColor: groupColor,
        defaultRadius: 1000,
        points
      });
      colorIndex++;
    }
  });

  // If no folders, try to get all placemarks as a single group
  if (groups.length === 0) {
    const allPlacemarks = doc.querySelectorAll('Placemark');
    const points = [];

    allPlacemarks.forEach(placemark => {
      const name = placemark.querySelector('name')?.textContent || 'Unnamed';
      const coordinates = placemark.querySelector('coordinates')?.textContent;

      if (coordinates) {
        const [lng, lat] = coordinates.trim().split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({ name, lat, lng });
        }
      }
    });

    if (points.length > 0) {
      groups.push({
        id: `group-default-${Date.now()}`,
        name: 'Imported Points',
        defaultColor: '#FF5252',
        defaultRadius: 1000,
        points
      });
    }
  }

  return { groups };
}

// Extract color from KML style element
function extractColorFromStyle(style, doc) {
  // Check for StyleMap - get the normal style
  const styleMapPair = style.querySelector('Pair');
  if (styleMapPair) {
    const normalStyleUrl = styleMapPair.querySelector('styleUrl')?.textContent;
    if (normalStyleUrl) {
      const normalStyleId = normalStyleUrl.replace('#', '');
      style = doc.querySelector(`Style[id="${normalStyleId}"]`);
      if (!style) return null;
    }
  }

  // Get color from IconStyle or LineStyle
  const iconColor = style.querySelector('IconStyle color')?.textContent;
  const lineColor = style.querySelector('LineStyle color')?.textContent;
  const polyColor = style.querySelector('PolyStyle color')?.textContent;

  const kmlColor = iconColor || lineColor || polyColor;
  if (!kmlColor) return null;

  // KML color format: aabbggrr (alpha, blue, green, red)
  // Convert to HTML hex format: #rrggbb
  if (kmlColor.length === 8) {
    const r = kmlColor.substring(6, 8);
    const g = kmlColor.substring(4, 6);
    const b = kmlColor.substring(2, 4);
    return `#${r}${g}${b}`.toUpperCase();
  }

  return null;
}

// Calculate center point from all groups
export function calculateCenter(groups) {
  let totalLat = 0;
  let totalLng = 0;
  let count = 0;

  groups.forEach(group => {
    group.points.forEach(point => {
      totalLat += point.lat;
      totalLng += point.lng;
      count++;
    });
  });

  if (count === 0) return [43.235, 76.92]; // Default to Almaty

  return [totalLat / count, totalLng / count];
}
