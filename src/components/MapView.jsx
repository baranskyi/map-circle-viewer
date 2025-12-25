import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Polygon, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MetroLayer, MallsLayer, FitnessLayer, SupermarketsLayer, KyivstarLayer, ApolloClubsLayer } from './POILayers';

// Available map tile layers
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    icon: '🗺️'
  },
  googleStreets: {
    name: 'Google Maps',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    icon: '🛣️'
  },
  googleSatellite: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    icon: '🛰️'
  },
  googleHybrid: {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    icon: '🌍'
  }
};

// Layer switcher control component
function LayerControl({ currentLayer, onLayerChange, leftPanelCollapsed }) {
  const [isOpen, setIsOpen] = useState(false);

  // Position depends on left panel state
  // When collapsed: next to hamburger button (~60px)
  // When expanded: to the right of panel (~340px)
  const leftPosition = leftPanelCollapsed ? '60px' : '340px';

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: '16px', marginLeft: leftPosition, transition: 'margin-left 0.2s ease' }}>
      <div className="leaflet-control leaflet-bar" style={{ border: 'none' }}>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
            title="Выбор карты"
          >
            <span>{TILE_LAYERS[currentLayer].icon}</span>
            <span className="hidden sm:inline">{TILE_LAYERS[currentLayer].name}</span>
            <span className="text-gray-400">▼</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] z-[1000]">
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => {
                    onLayerChange(key);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 ${
                    currentLayer === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{layer.icon}</span>
                  <span>{layer.name}</span>
                  {currentLayer === key && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

// Highlighted icon types (larger, with glow effect)
const HIGHLIGHTED_ICON_TYPES = {
  circle: (color) => L.divIcon({
    className: 'custom-marker highlighted',
    html: `<div style="width:20px;height:20px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 0 12px ${color}, 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }),
  pin: (color) => L.divIcon({
    className: 'custom-marker highlighted',
    html: `<div style="width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:24px solid ${color};filter:drop-shadow(0 0 8px ${color}) drop-shadow(0 2px 3px rgba(0,0,0,0.3));"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }),
  square: (color) => L.divIcon({
    className: 'custom-marker highlighted',
    html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;box-shadow:0 0 12px ${color}, 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  }),
  diamond: (color) => L.divIcon({
    className: 'custom-marker highlighted',
    html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;transform:rotate(45deg);box-shadow:0 0 12px ${color}, 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  }),
  star: (color) => L.divIcon({
    className: 'custom-marker highlighted',
    html: `<div style="color:${color};font-size:24px;text-shadow:0 0 12px ${color}, 0 0 2px white, 0 2px 3px rgba(0,0,0,0.3);">★</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
};

// Get highlighted icon by type
const getHighlightedIcon = (type, color) => {
  const iconFn = HIGHLIGHTED_ICON_TYPES[type] || HIGHLIGHTED_ICON_TYPES.circle;
  return iconFn(color);
};

// Component to track map bounds and report visible points
function BoundsTracker({ groups, groupSettings, infrastructurePoints, onVisiblePointsChange, onMapReady }) {
  const map = useMapEvents({
    moveend: () => updateVisiblePoints(),
    zoomend: () => updateVisiblePoints(),
    load: () => {
      updateVisiblePoints();
      onMapReady?.(map);
    }
  });

  const updateVisiblePoints = useCallback(() => {
    if (!map) return;

    const bounds = map.getBounds();
    const visiblePoints = [];

    // Track user groups points
    groups.forEach(group => {
      const settings = groupSettings[group.id];
      if (!settings || !settings.visible) return;

      (group.points || []).forEach(point => {
        if (bounds.contains([point.lat, point.lng])) {
          visiblePoints.push({
            id: point.id || `${group.id}-${point.lat}-${point.lng}`,
            name: point.name,
            lat: point.lat,
            lng: point.lng,
            groupId: group.id,
            groupName: group.name,
            color: settings.color,
            type: 'user'
          });
        }
      });
    });

    // Track infrastructure points (already filtered by visibility in parent)
    infrastructurePoints.forEach(point => {
      if (bounds.contains([point.lat, point.lng])) {
        visiblePoints.push({
          ...point,
          groupName: point.typeName
        });
      }
    });

    onVisiblePointsChange?.(visiblePoints);
  }, [map, groups, groupSettings, infrastructurePoints, onVisiblePointsChange]);

  useEffect(() => {
    updateVisiblePoints();
  }, [groups, groupSettings, infrastructurePoints, updateVisiblePoints]);

  useEffect(() => {
    if (map) {
      onMapReady?.(map);
      updateVisiblePoints();
    }
  }, [map, onMapReady, updateVisiblePoints]);

  return null;
}

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
  showKyivstarActive = false,
  showKyivstarTerminated = false,
  showApolloClubs = false,
  metroRadius = 500,
  mallsRadius = 1000,
  fitnessRadius = 500,
  supermarketsRadius = 500,
  apolloClubsRadius = 500,
  metroOpacity = 0.15,
  mallsOpacity = 0.15,
  fitnessOpacity = 0.15,
  supermarketsOpacity = 0.15,
  kyivstarActiveOpacity = 1,
  kyivstarTerminatedOpacity = 1,
  apolloClubsOpacity = 0.15,
  // New props for visible points panel
  onVisiblePointsChange,
  highlightedPointId,
  onMapReady,
  // Left panel state for layer switcher positioning
  leftPanelCollapsed = false
}) {
  const [currentLayer, setCurrentLayer] = useState('osm');
  const layer = TILE_LAYERS[currentLayer];

  // Infrastructure points storage
  const [metroPoints, setMetroPoints] = useState([]);
  const [mallPoints, setMallPoints] = useState([]);
  const [fitnessPoints, setFitnessPoints] = useState([]);
  const [supermarketPoints, setSupermarketPoints] = useState([]);
  const [apolloPoints, setApolloPoints] = useState([]);

  // Combine all infrastructure points based on visibility
  const infrastructurePoints = useCallback(() => {
    const points = [];
    if (showMetro) points.push(...metroPoints);
    if (showMalls) points.push(...mallPoints);
    if (showFitness) points.push(...fitnessPoints);
    if (showSupermarkets) points.push(...supermarketPoints);
    if (showApolloClubs) points.push(...apolloPoints);
    return points;
  }, [showMetro, showMalls, showFitness, showSupermarkets, showApolloClubs,
      metroPoints, mallPoints, fitnessPoints, supermarketPoints, apolloPoints]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        key={currentLayer}
        attribution={layer.attribution}
        url={layer.url}
        maxZoom={20}
      />

      <MapUpdater center={center} zoom={zoom} />

      {/* Track visible points for side panel */}
      <BoundsTracker
        groups={groups}
        groupSettings={groupSettings}
        infrastructurePoints={infrastructurePoints()}
        onVisiblePointsChange={onVisiblePointsChange}
        onMapReady={onMapReady}
      />

      {/* Layer switcher control */}
      <LayerControl currentLayer={currentLayer} onLayerChange={setCurrentLayer} leftPanelCollapsed={leftPanelCollapsed} />

      {/* POI Layers */}
      <MetroLayer visible={showMetro} radius={metroRadius} opacity={metroOpacity} onDataLoaded={setMetroPoints} />
      <MallsLayer visible={showMalls} radius={mallsRadius} opacity={mallsOpacity} onDataLoaded={setMallPoints} />
      <FitnessLayer visible={showFitness} radius={fitnessRadius} opacity={fitnessOpacity} onDataLoaded={setFitnessPoints} />
      <SupermarketsLayer visible={showSupermarkets} radius={supermarketsRadius} opacity={supermarketsOpacity} onDataLoaded={setSupermarketPoints} />
      <KyivstarLayer visible={showKyivstarActive} layerType="active_clients" opacityMultiplier={kyivstarActiveOpacity} />
      <KyivstarLayer visible={showKyivstarTerminated} layerType="terminated_clients" opacityMultiplier={kyivstarTerminatedOpacity} />
      <ApolloClubsLayer visible={showApolloClubs} radius={apolloClubsRadius} opacity={apolloClubsOpacity} onDataLoaded={setApolloPoints} />

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
              bubblingMouseEvents={true}
            />
          )) : []),

          // Render point markers with icons
          ...(group.points || []).map((point, idx) => {
            const pointId = point.id || `${group.id}-${point.lat}-${point.lng}`;
            const isHighlighted = highlightedPointId === pointId;
            const icon = isHighlighted
              ? getHighlightedIcon(iconType, settings.color)
              : getIcon(iconType, settings.color);

            return (
              <Marker
                key={`marker-${group.id}-${idx}-${iconType}-${settings.color}-${isHighlighted}`}
                position={[point.lat, point.lng]}
                icon={icon}
                zIndexOffset={isHighlighted ? 2000 : 1000}
              >
                <Popup>
                  <div>
                    <strong>{point.name}</strong>
                    <br />
                    <span className="text-sm text-gray-600">{group.name}</span>
                  </div>
                </Popup>
                <Tooltip
                  direction="top"
                  offset={[0, isHighlighted ? -12 : -8]}
                  className={`compact-label ${isHighlighted ? 'highlighted-tooltip' : ''}`}
                  permanent={isHighlighted}
                >
                  {point.name}
                </Tooltip>
              </Marker>
            );
          }),

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
              <Tooltip direction="center" className="compact-label">
                {polygon.name}
              </Tooltip>
            </Polygon>
          )) : [])
        ];
      })}
    </MapContainer>
  );
}

export default MapView;
