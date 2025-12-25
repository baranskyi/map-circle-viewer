import { useEffect, useState } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { kyivstarApi } from '../../services/api';

// Kyivstar layer colors
const LAYER_COLORS = {
  active_clients: {
    fill: '#22c55e',  // Green for active clients
    stroke: '#16a34a'
  },
  potential_clients: {
    fill: '#3b82f6',  // Blue for potential
    stroke: '#2563eb'
  }
};

export default function KyivstarLayer({ visible = true }) {
  const [hexagons, setHexagons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHexagons();
  }, []);

  const fetchHexagons = async () => {
    try {
      const data = await kyivstarApi.getActiveClients();
      setHexagons(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Kyivstar hexagons:', err);
      setLoading(false);
    }
  };

  if (!visible || loading) return null;

  return (
    <>
      {hexagons.map((hexagon) => {
        const colors = LAYER_COLORS[hexagon.layer_name] || LAYER_COLORS.active_clients;
        const coordinates = hexagon.coordinates || [];

        if (coordinates.length < 3) return null;

        return (
          <Polygon
            key={hexagon.id}
            positions={coordinates}
            pathOptions={{
              color: colors.stroke,
              weight: 1,
              fillColor: colors.fill,
              fillOpacity: 0.3,
            }}
          >
            <Tooltip direction="center" permanent={false}>
              <div className="text-xs">
                <div className="font-medium">Kyivstar Zone</div>
                <div className="text-gray-500">ID: {hexagon.hex_id}</div>
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
