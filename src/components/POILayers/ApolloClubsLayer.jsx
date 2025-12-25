import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apolloClubsApi } from '../../services/api';

// Custom Apollo icon - orange circle with "A"
const apolloIcon = L.divIcon({
  className: 'apollo-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      font-family: Arial, sans-serif;
    ">A</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

export default function ApolloClubsLayer({ visible = true }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const data = await apolloClubsApi.getAll();
      setClubs(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Apollo clubs:', err);
      setLoading(false);
    }
  };

  if (!visible || loading) return null;

  return (
    <>
      {clubs.map((club) => (
        <Marker
          key={club.id}
          position={[club.lat, club.lng]}
          icon={apolloIcon}
        >
          <Popup maxWidth={300}>
            <div className="font-sans text-xs" style={{ minWidth: '200px' }}>
              {/* Header */}
              <div
                className="py-2 px-3 rounded-t text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
              >
                {club.name}
              </div>

              {/* Content */}
              <div className="p-2 bg-gray-50">
                {/* Mall */}
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-gray-500">🏬</span>
                  <span className="font-medium text-gray-800">{club.mall}</span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-gray-500">📍</span>
                  <span className="text-gray-700">{club.address}</span>
                </div>

                {/* City */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">🏙️</span>
                  <span className="text-gray-700">{club.city}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-2 bg-orange-50 rounded-b text-center">
                <span className="text-orange-600 font-medium text-xs">
                  APOLLO NEXT Fitness Club
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
