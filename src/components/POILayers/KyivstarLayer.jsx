import { useEffect, useState } from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { kyivstarApi } from '../../services/api';

// Color gradients for different layer types
const LAYER_COLORS = {
  active_clients: {
    // Green gradient - darker = more people
    getColor: (totalPeople) => {
      if (totalPeople >= 100) return '#0d5016';
      if (totalPeople >= 50) return '#166b1e';
      if (totalPeople >= 30) return '#1e8527';
      if (totalPeople >= 20) return '#28a745';
      if (totalPeople >= 10) return '#3cb556';
      if (totalPeople >= 5) return '#5bc472';
      return '#7ed694';
    },
    badge: { bg: '#22c55e', text: '🟢 Діючі клієнти' }
  },
  terminated_clients: {
    // Red gradient - darker = more people
    getColor: (totalPeople) => {
      if (totalPeople >= 100) return '#7f1d1d';
      if (totalPeople >= 50) return '#991b1b';
      if (totalPeople >= 30) return '#b91c1c';
      if (totalPeople >= 20) return '#dc2626';
      if (totalPeople >= 10) return '#ef4444';
      if (totalPeople >= 5) return '#f87171';
      return '#fca5a5';
    },
    badge: { bg: '#dc2626', text: '🔴 Завершені клієнти' }
  }
};

// Get opacity based on count - same for both layers
const getOpacity = (totalPeople) => {
  if (totalPeople >= 100) return 0.75;
  if (totalPeople >= 50) return 0.65;
  if (totalPeople >= 30) return 0.55;
  if (totalPeople >= 20) return 0.5;
  if (totalPeople >= 10) return 0.45;
  if (totalPeople >= 5) return 0.4;
  return 0.35;
};

export default function KyivstarLayer({ visible = true, layerType = 'active_clients', opacityMultiplier = 1 }) {
  const [hexagons, setHexagons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHexagons();
  }, [layerType]);

  const fetchHexagons = async () => {
    try {
      setLoading(true);
      const data = layerType === 'terminated_clients'
        ? await kyivstarApi.getTerminatedClients()
        : await kyivstarApi.getActiveClients();
      setHexagons(data || []);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching Kyivstar hexagons (${layerType}):`, err);
      setLoading(false);
    }
  };

  if (!visible || loading) return null;

  const layerConfig = LAYER_COLORS[layerType] || LAYER_COLORS.active_clients;

  return (
    <>
      {hexagons.map((hexagon) => {
        const coordinates = hexagon.coordinates || [];
        const totalPeople = hexagon.total_people || 0;
        const fillColor = layerConfig.getColor(totalPeople);
        const baseOpacity = getOpacity(totalPeople);
        const fillOpacity = baseOpacity * opacityMultiplier;
        const gyms = hexagon.gyms || [];

        if (coordinates.length < 3) return null;

        return (
          <Polygon
            key={hexagon.id}
            positions={coordinates}
            pathOptions={{
              color: fillColor,
              weight: 1,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
            }}
          >
            <Popup maxWidth={350}>
              <div className="font-sans text-xs" style={{ minWidth: '280px' }}>
                {/* Header */}
                <h4 className="m-0 mb-2 text-gray-800 font-bold text-sm">
                  Гексагон: {hexagon.hex_id}
                </h4>

                {/* Badge */}
                <div
                  className="py-1 px-2 rounded text-white text-center text-xs font-bold mb-2"
                  style={{ backgroundColor: layerConfig.badge.bg }}
                >
                  {layerConfig.badge.text}
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 p-2 rounded mb-2">
                  <h5 className="m-0 mb-1 text-gray-600 font-semibold text-xs">
                    📊 Загальна статистика:
                  </h5>
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td className="py-0.5">🏠 Тільки дім:</td>
                        <td className="text-right font-bold">{hexagon.home_only || 0}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">🏢 Тільки робота:</td>
                        <td className="text-right font-bold">{hexagon.work_only || 0}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">🏠🏢 Дім і робота:</td>
                        <td className="text-right font-bold">{hexagon.home_and_work || 0}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #dee2e6' }}>
                        <td className="py-0.5 font-bold">📊 Всього:</td>
                        <td className="text-right font-bold" style={{ color: layerConfig.badge.bg }}>
                          {totalPeople}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Gyms distribution */}
                {gyms.length > 0 && (
                  <div className="bg-gray-100 p-2 rounded">
                    <h5 className="m-0 mb-1 text-gray-600 font-semibold text-xs">
                      🏋️ Розподіл по спортзалах:
                    </h5>
                    <div className="max-h-32 overflow-y-auto">
                      {gyms.map((gym, idx) => (
                        <div
                          key={idx}
                          className="my-1 p-1.5 bg-white rounded text-xs"
                          style={{ borderLeft: `3px solid ${layerConfig.badge.bg}` }}
                        >
                          <div className="font-bold text-gray-700 text-xs leading-tight">
                            📍 {gym.address}
                          </div>
                          <div className="mt-0.5">
                            <span className="font-bold" style={{ color: layerConfig.badge.bg }}>
                              {gym.count} чол.
                            </span>
                            {(gym.home !== undefined) && (
                              <span className="text-gray-500 ml-2">
                                🏠{gym.home} 🏢{gym.work} 🏠🏢{gym.both}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}
