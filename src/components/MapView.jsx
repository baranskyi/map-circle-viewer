import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';

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

function MapView({ groups, groupSettings, center, zoom }) {
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

      {groups.map(group => {
        const settings = groupSettings[group.id];
        if (!settings || !settings.visible) return null;

        return [
          // Render circles for points
          ...(group.points || []).map((point, idx) => (
            <Circle
              key={`circle-${group.id}-${idx}`}
              center={[point.lat, point.lng]}
              radius={settings.radius}
              pathOptions={{
                color: settings.color,
                fillColor: settings.color,
                fillOpacity: 0.2,
                weight: 2
              }}
            >
              <Popup>
                <div>
                  <strong>{point.name}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{group.name}</span>
                </div>
              </Popup>
              {settings.labelsVisible && (
                <Tooltip permanent direction="center" className="point-label">
                  {point.name}
                </Tooltip>
              )}
            </Circle>
          )),

          // Render polygons
          ...(settings.polygonsVisible && group.polygons ? group.polygons.map((polygon, idx) => (
            <Polygon
              key={`polygon-${group.id}-${idx}`}
              positions={polygon.coordinates}
              pathOptions={{
                color: settings.color,
                fillColor: settings.color,
                fillOpacity: 0.2,
                weight: 2
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
                <Tooltip permanent direction="center" className="polygon-label">
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
