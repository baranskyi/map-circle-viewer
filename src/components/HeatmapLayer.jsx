import { useEffect, useState, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * HeatmapLayer - displays a heatmap of popular times for Kyiv
 *
 * Props:
 *   visible: boolean - show/hide the layer
 *   day: 0-6 (Mon-Sun)
 *   hour: 0-23
 *   opacity: 0-100 (percentage)
 *   data: heatmap data object or null (will load from public folder)
 */
export default function HeatmapLayer({
  visible = false,
  day = 0,
  hour = 12,
  opacity = 70,
  minZoom = 10,
  maxZoom = 18
}) {
  const map = useMap();
  const [data, setData] = useState(null);
  const [heatLayer, setHeatLayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/heatmap_compact.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load heatmap data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute heatmap points for current day/hour
  const heatPoints = useMemo(() => {
    if (!data || !data.hexagons) return [];

    return data.hexagons.map(hex => {
      // hex.i is [7 days][24 hours]
      const intensity = hex.i[day]?.[hour] || 0;

      // Return [lat, lng, intensity]
      // Normalize intensity (0-100) to (0-1) range
      return [hex.lat, hex.lng, intensity / 100];
    });
  }, [data, day, hour]);

  // Create/update heat layer
  useEffect(() => {
    if (!map || !visible) {
      // Remove layer if exists and not visible
      if (heatLayer) {
        map.removeLayer(heatLayer);
        setHeatLayer(null);
      }
      return;
    }

    if (heatPoints.length === 0) return;

    // Remove old layer
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }

    // Create new heat layer
    const layer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: maxZoom,
      minOpacity: 0.3,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.25: 'cyan',
        0.5: 'lime',
        0.75: 'yellow',
        1.0: 'red'
      }
    });

    layer.addTo(map);
    setHeatLayer(layer);

    // Cleanup on unmount
    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, visible, heatPoints, maxZoom]);

  // Update opacity
  useEffect(() => {
    if (heatLayer) {
      const container = heatLayer._canvas;
      if (container) {
        container.style.opacity = (opacity / 100).toString();
      }
    }
  }, [heatLayer, opacity]);

  // Don't render anything visible - the heat layer is added directly to the map
  return null;
}

/**
 * HeatmapControls - UI for controlling the heatmap
 */
export function HeatmapControls({
  visible,
  onToggle,
  day,
  onDayChange,
  hour,
  onHourChange,
  opacity,
  onOpacityChange
}) {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="heatmap-toggle"
          checked={visible}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="heatmap-toggle" className="font-medium text-sm cursor-pointer">
          🔥 Тепловая карта
        </label>
      </div>

      {visible && (
        <>
          {/* Day selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">День:</label>
            <div className="flex gap-1">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => onDayChange(i)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    day === i
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Hour slider */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Час:</label>
            <input
              type="range"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => onHourChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#f97316' }}
            />
            <span className="text-xs text-gray-600 w-10 text-right font-mono">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Ярк.:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => onOpacityChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#f97316' }}
            />
            <span className="text-xs text-gray-600 w-8">{opacity}%</span>
          </div>

          {/* Quick time presets */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Шаблон:</label>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => { onDayChange(0); onHourChange(8); }}
                className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Пн 8:00
              </button>
              <button
                onClick={() => { onDayChange(0); onHourChange(18); }}
                className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Пн 18:00
              </button>
              <button
                onClick={() => { onDayChange(5); onHourChange(14); }}
                className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Сб 14:00
              </button>
              <button
                onClick={() => { onDayChange(6); onHourChange(12); }}
                className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Вс 12:00
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
