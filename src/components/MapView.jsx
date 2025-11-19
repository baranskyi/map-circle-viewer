import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';

// Component to update map view when center/zoom changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
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

        return group.points.map((point, idx) => (
          <Circle
            key={`${group.id}-${idx}`}
            center={[point.lat, point.lng]}
            radius={settings.radius}
            pathOptions={{
              color: settings.color,
              fillColor: settings.color,
              fillOpacity: 0.5,
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
          </Circle>
        ));
      })}
    </MapContainer>
  );
}

export default MapView;
