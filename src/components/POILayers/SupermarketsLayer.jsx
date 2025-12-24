import { useEffect, useState } from 'react';
import { CircleMarker, Circle, Popup, Tooltip } from 'react-leaflet';
import { supabase } from '../../lib/supabase';

// Brand colors for known chains
const BRAND_COLORS = {
  'Silpo': '#FF6B00',
  'Сільпо': '#FF6B00',
  'ATB': '#FFD600',
  'АТБ-Маркет': '#FFD600',
  'АТБ-маркет': '#FFD600',
  'Novus': '#00A651',
  'Fora': '#E31E24',
  'Фора': '#E31E24',
  'Varus': '#1976D2',
  'METRO': '#003DA5',
  'Velyka Kyshenya': '#8E24AA',
  'Рукавичка': '#43A047',
  'default': '#607D8B'
};

export default function SupermarketsLayer({ visible = true, radius = 500 }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupermarkets();
  }, []);

  const fetchSupermarkets = async () => {
    try {
      const { data: layers } = await supabase
        .from('poi_layers')
        .select('id')
        .eq('name', 'Supermarkets')
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
        console.error('Error fetching supermarkets:', error);
        setLoading(false);
        return;
      }

      setMarkets(data || []);
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
      {markets.map((market) => {
        const color = getColor(market.brand);
        return [
          /* Coverage circle */
          radius > 0 && (
            <Circle
              key={`coverage-${market.id}`}
              center={[market.lat, market.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.1,
                dashArray: '5, 5',
              }}
            />
          ),
          /* Market marker */
          <CircleMarker
            key={`marker-${market.id}`}
            center={[market.lat, market.lng]}
            radius={4}
            pathOptions={{
              color: '#FFFFFF',
              weight: 1,
              fillColor: color,
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div>
                <div className="font-bold">{market.name_uk || market.name}</div>
                {market.brand && market.brand !== 'Supermarket' && (
                  <div className="text-sm text-green-600 font-medium">{market.brand}</div>
                )}
                {market.address && (
                  <div className="text-sm text-gray-500">{market.address}</div>
                )}
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -4]}>
              🛒 {market.name_uk || market.name}
            </Tooltip>
          </CircleMarker>
        ];
      })}
    </>
  );
}
