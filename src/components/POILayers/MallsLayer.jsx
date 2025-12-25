import { useEffect, useState } from 'react';
import { CircleMarker, Circle, Popup, Tooltip } from 'react-leaflet';
import { supabase } from '../../lib/supabase';

const MALL_COLOR = '#9C27B0';

export default function MallsLayer({ visible = true, radius = 1000, opacity = 0.15 }) {
  const [malls, setMalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMalls();
  }, []);

  const fetchMalls = async () => {
    try {
      const { data: layers } = await supabase
        .from('poi_layers')
        .select('id')
        .eq('name', 'Shopping Malls')
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
        console.error('Error fetching malls:', error);
        setLoading(false);
        return;
      }

      setMalls(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  if (!visible || loading) return null;

  return (
    <>
      {malls.map((mall) => [
        /* Coverage circle */
        radius > 0 && (
          <Circle
            key={`coverage-${mall.id}`}
            center={[mall.lat, mall.lng]}
            radius={radius}
            pathOptions={{
              color: MALL_COLOR,
              weight: 1,
              fillColor: MALL_COLOR,
              fillOpacity: opacity,
            }}
          />
        ),
        /* Mall marker */
        <CircleMarker
          key={`marker-${mall.id}`}
          center={[mall.lat, mall.lng]}
          radius={6}
          pathOptions={{
            color: '#FFFFFF',
            weight: 2,
            fillColor: MALL_COLOR,
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div>
              <div className="font-bold">{mall.name_uk || mall.name}</div>
              {mall.address && (
                <div className="text-sm text-gray-500">{mall.address}</div>
              )}
              {mall.website && (
                <a
                  href={mall.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Веб-сайт
                </a>
              )}
            </div>
          </Popup>
          <Tooltip direction="top" offset={[0, -6]}>
            🏬 {mall.name_uk || mall.name}
          </Tooltip>
        </CircleMarker>
      ])}
    </>
  );
}
