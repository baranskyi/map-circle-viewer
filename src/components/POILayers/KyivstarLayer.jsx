import { useEffect, useState } from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { kyivstarApi } from '../../services/api';

// Color gradient for hexagons based on total people count
// Darker green = more people
const getHexagonColor = (totalPeople, fillColor) => {
  // Use original fill color from Kyivstar if available
  if (fillColor && fillColor !== '#22c55e') {
    return fillColor;
  }

  // Fallback gradient based on count
  if (totalPeople >= 100) return '#1e6422';  // Darkest green
  if (totalPeople >= 50) return '#419a44';
  if (totalPeople >= 25) return '#72b574';
  if (totalPeople >= 10) return '#a3d0a7';
  return '#d4edda';  // Lightest green
};

// Get opacity based on count
const getOpacity = (totalPeople) => {
  if (totalPeople >= 50) return 0.5;
  if (totalPeople >= 20) return 0.4;
  if (totalPeople >= 10) return 0.35;
  return 0.25;
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
        const coordinates = hexagon.coordinates || [];
        const totalPeople = hexagon.total_people || 0;
        const fillColor = getHexagonColor(totalPeople, hexagon.fill_color);
        const fillOpacity = getOpacity(totalPeople);
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
                  style={{ backgroundColor: '#22c55e' }}
                >
                  🟢 Діючі клієнти
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
                        <td className="text-right font-bold" style={{ color: '#22c55e' }}>
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
                          style={{ borderLeft: '3px solid #22c55e' }}
                        >
                          <div className="font-bold text-gray-700 text-xs leading-tight">
                            📍 {gym.address}
                          </div>
                          <div className="mt-0.5">
                            <span className="font-bold" style={{ color: '#22c55e' }}>
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
