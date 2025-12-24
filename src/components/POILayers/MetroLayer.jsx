import { useEffect, useState } from 'react';
import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { supabase } from '../../lib/supabase';

// Metro line colors
const LINE_COLORS = {
  'M1': '#E4181C', // Red
  'M2': '#0072BC', // Blue
  'M3': '#009E49', // Green
};

export default function MetroLayer({ visible = true }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetroStations();
  }, []);

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
          <CircleMarker
            key={station.id}
            center={[station.lat, station.lng]}
            radius={8}
            pathOptions={{
              color: '#FFFFFF',
              weight: 2,
              fillColor: lineColor,
              fillOpacity: 1,
            }}
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
            <Tooltip direction="top" offset={[0, -8]}>
              <span style={{ color: lineColor, fontWeight: 'bold' }}>Ⓜ</span> {station.name_uk || station.name}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
