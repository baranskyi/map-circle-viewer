import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MetroLayer, MallsLayer, FitnessLayer, SupermarketsLayer } from './POILayers';

// Icon types for markers
const ICON_TYPES = {
  circle: (color) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  }),
  pin: (color) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:16px solid ${color};filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16]
  }),
  square: (color) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  }),
  diamond: (color) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  }),
  star: (color) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="color:${color};font-size:16px;text-shadow:0 0 2px white,0 1px 2px rgba(0,0,0,0.3);">★</div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })
};

// Get icon by type
const getIcon = (type, color) => {
  const iconFn = ICON_TYPES[type] || ICON_TYPES.circle;
  return iconFn(color);
};

// Component to update map view only when center/zoom actually change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);

  useEffect(() => {
    const centerChanged = prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1];
    const zoomChanged = prevZoom.current !== zoom;

    if (centerChanged || zoomChanged) {
      map.setView(center, zoom);
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

function MapView({
  groups,
  groupSettings,
  center,
  zoom,
  showMetro = true,
  showMalls = false,
  showFitness = false,
  showSupermarkets = false,
  metroRadius = 500,
  mallsRadius = 1000,
  fitnessRadius = 500,
  supermarketsRadius = 500
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} zoom={zoom} />

      {/* POI Layers */}
      <MetroLayer visible={showMetro} radius={metroRadius} />
      <MallsLayer visible={showMalls} radius={mallsRadius} />
      <FitnessLayer visible={showFitness} radius={fitnessRadius} />
      <SupermarketsLayer visible={showSupermarkets} radius={supermarketsRadius} />

      {groups.map(group => {
        const settings = groupSettings[group.id];
        if (!settings || !settings.visible) return null;

        const iconType = settings.iconType || 'circle';

        return [
          // Render coverage circles for points (only if radius > 0)
          ...(settings.radius > 0 ? (group.points || []).map((point, idx) => (
            <Circle
              key={`coverage-${group.id}-${idx}`}
              center={[point.lat, point.lng]}
              radius={settings.radius}
              pathOptions={{
                color: settings.color,
                fillColor: settings.color,
                fillOpacity: 0.1,
                weight: 1
              }}
            />
          )) : []),

          // Render point markers with icons
          ...(group.points || []).map((point, idx) => (
            <Marker
              key={`marker-${group.id}-${idx}-${iconType}-${settings.color}`}
              position={[point.lat, point.lng]}
              icon={getIcon(iconType, settings.color)}
            >
              <Popup>
                <div>
                  <strong>{point.name}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{group.name}</span>
                </div>
              </Popup>
              {settings.labelsVisible && (
                <Tooltip permanent direction="top" offset={[0, -8]} className="compact-label">
                  {point.name}
                </Tooltip>
              )}
            </Marker>
          )),

          // Render polygons
          ...(settings.polygonsVisible && group.polygons ? group.polygons.map((polygon, idx) => (
            <Polygon
              key={`polygon-${group.id}-${idx}-${settings.labelsVisible}`}
              positions={polygon.coordinates}
              pathOptions={{
                color: settings.color,
                fillColor: settings.color,
                fillOpacity: 0.15,
                weight: 1
              }}
            >
              <Popup>
                <div>
                  <strong>{polygon.name}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{group.name} (полигон)</span>
                </div>
              </Popup>
              {settings.labelsVisible && (
                <Tooltip permanent direction="center" className="compact-label">
                  {polygon.name}
                </Tooltip>
              )}
            </Polygon>
          )) : [])
        ];
      })}
    </MapContainer>
  );
}

export default MapView;
