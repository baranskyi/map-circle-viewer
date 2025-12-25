import { useEffect, useState } from 'react';
import { CircleMarker, Circle, Popup, Tooltip } from 'react-leaflet';
import { supabase } from '../../lib/supabase';

// Brand colors for known chains
const BRAND_COLORS = {
  'Sport Life': '#FF6B00',
  'SportLife': '#FF6B00',
  'FitCurves': '#E91E63',
  'Fit Curves': '#E91E63',
  'default': '#4CAF50'
};

export default function FitnessLayer({ visible = true, radius = 500, opacity = 0.15, onDataLoaded }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFitnessClubs();
  }, []);

  // Report loaded data to parent
  useEffect(() => {
    if (!loading && onDataLoaded) {
      onDataLoaded(clubs.map(c => ({
        id: `fitness-${c.id}`,
        name: c.name_uk || c.name,
        lat: c.lat,
        lng: c.lng,
        type: 'fitness',
        typeName: 'Фітнес',
        color: BRAND_COLORS[c.brand] || BRAND_COLORS.default,
        icon: '🏋️',
        extra: c.brand
      })));
    }
  }, [clubs, loading, onDataLoaded]);

  const fetchFitnessClubs = async () => {
    try {
      const { data: layers } = await supabase
        .from('poi_layers')
        .select('id')
        .eq('name', 'Fitness Clubs')
        .limit(1);

      if (!layers || layers.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('poi_points')
        .select('*')
        .eq('layer_id', layers[0].id);

      if (error) {
        console.error('Error fetching fitness clubs:', error);
        setLoading(false);
        return;
      }

      setClubs(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const getColor = (brand) => {
    return BRAND_COLORS[brand] || BRAND_COLORS.default;
  };

  if (!visible || loading) return null;

  return (
    <>
      {clubs.map((club) => {
        const color = getColor(club.brand);
        return [
          /* Coverage circle */
          radius > 0 && (
            <Circle
              key={`coverage-${club.id}`}
              center={[club.lat, club.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                weight: 1,
                fillColor: color,
                fillOpacity: opacity,
              }}
              bubblingMouseEvents={true}
            />
          ),
          /* Club marker */
          <CircleMarker
            key={`marker-${club.id}`}
            center={[club.lat, club.lng]}
            radius={5}
            pathOptions={{
              color: '#FFFFFF',
              weight: 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div>
                <div className="font-bold">{club.name_uk || club.name}</div>
                {club.brand && club.brand !== 'Fitness Club' && (
                  <div className="text-sm text-purple-600 font-medium">{club.brand}</div>
                )}
                {club.address && (
                  <div className="text-sm text-gray-500">{club.address}</div>
                )}
                {club.website && (
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Веб-сайт
                  </a>
                )}
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -5]}>
              🏋️ {club.name_uk || club.name}
            </Tooltip>
          </CircleMarker>
        ];
      })}
    </>
  );
}
