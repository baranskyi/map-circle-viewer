import { useEffect, useState } from 'react';
import { Marker, Circle, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';

// Metro line colors
const LINE_COLORS = {
  'M1': '#E4181C', // Red
  'M2': '#0072BC', // Blue
  'M3': '#009E49', // Green
};

// Create metro icon with line color
const createMetroIcon = (color) => L.divIcon({
  className: 'metro-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      font-family: Arial, sans-serif;
    ">М</div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

export default function MetroLayer({ visible = true, radius = 500, opacity = 0.15, onDataLoaded }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetroStations();
  }, []);

  // Report loaded data to parent
  useEffect(() => {
    if (!loading && onDataLoaded) {
      const metadata = stations[0]?.metadata || {};
      onDataLoaded(stations.map(s => ({
        id: `metro-${s.id}`,
        name: s.name_uk || s.name,
        lat: s.lat,
        lng: s.lng,
        type: 'metro',
        typeName: 'Метро',
        color: LINE_COLORS[s.metadata?.line] || '#666666',
        icon: 'М'
      })));
    }
  }, [stations, loading, onDataLoaded]);

  const fetchMetroStations = async () => {
    try {
      // Get Metro layer ID
      const { data: layers } = await supabase
        .from('poi_layers')
        .select('id')
        .eq('name', 'Metro Stations')
        .limit(1);

      if (!layers || layers.length === 0) {
        console.warn('Metro layer not found');
        setLoading(false);
        return;
      }

      const layerId = layers[0].id;

      // Fetch metro stations
      const { data, error } = await supabase
        .from('poi_points')
        .select('*')
        .eq('layer_id', layerId);

      if (error) {
        console.error('Error fetching metro stations:', error);
        setLoading(false);
        return;
      }

      setStations(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  if (!visible || loading) return null;

  return (
    <>
      {stations.map((station) => {
        const metadata = station.metadata || {};
        const lineColor = LINE_COLORS[metadata.line] || metadata.line_color || '#666666';

        return (
          <span key={station.id}>
            {/* Coverage circle */}
            {radius > 0 && (
              <Circle
                center={[station.lat, station.lng]}
                radius={radius}
                pathOptions={{
                  color: lineColor,
                  weight: 1,
                  fillColor: lineColor,
                  fillOpacity: opacity,
                }}
                bubblingMouseEvents={true}
              />
            )}
            {/* Station marker */}
            <Marker
              position={[station.lat, station.lng]}
              icon={createMetroIcon(lineColor)}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-lg">{station.name_uk || station.name}</div>
                  {station.name_uk && station.name !== station.name_uk && (
                    <div className="text-sm text-gray-500">{station.name}</div>
                  )}
                  <div
                    className="mt-1 text-sm font-medium px-2 py-1 rounded inline-block"
                    style={{ backgroundColor: lineColor, color: 'white' }}
                  >
                    {metadata.line_name || metadata.line || 'Metro'}
                  </div>
                  {metadata.wheelchair === 'yes' && (
                    <div className="mt-1 text-xs text-green-600">♿ Доступно для інвалідів</div>
                  )}
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -12]}>
                {station.name_uk || station.name}
              </Tooltip>
            </Marker>
          </span>
        );
      })}
    </>
  );
}
