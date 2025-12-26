import { useEffect, useState, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * HeatmapInstructionModal - Modal with heatmap methodology explanation
 */
export function HeatmapInstructionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <h3 className="font-bold text-lg">🔥 Тепловая карта: як це працює</h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Data Flow Diagram */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">📊 Схема отримання даних:</h4>
            <div className="flex flex-col items-center gap-2 text-xs">
              {/* Step 1 */}
              <div className="flex items-center gap-3 w-full">
                <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-center flex-1">
                  <div className="font-bold text-blue-700">OpenStreetMap</div>
                  <div className="text-blue-600">15,766 POI Києва</div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-center flex-1">
                  <div className="font-bold text-green-700">Overpass API</div>
                  <div className="text-green-600">Координати + типи</div>
                </div>
              </div>

              <div className="text-gray-400 text-lg">↓</div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 w-full">
                <div className="bg-purple-100 border border-purple-300 rounded-lg px-3 py-2 text-center flex-1">
                  <div className="font-bold text-purple-700">Паттерни активності</div>
                  <div className="text-purple-600">За типом закладу</div>
                </div>
                <div className="text-gray-400">+</div>
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-center flex-1">
                  <div className="font-bold text-yellow-700">Модуляція</div>
                  <div className="text-yellow-600">Локація + варіація</div>
                </div>
              </div>

              <div className="text-gray-400 text-lg">↓</div>

              {/* Step 3 */}
              <div className="bg-orange-100 border border-orange-300 rounded-lg px-3 py-2 text-center w-full">
                <div className="font-bold text-orange-700">H3 Гексагони (999 клітинок)</div>
                <div className="text-orange-600">Агрегація 7 днів × 24 години = 168 значень на клітинку</div>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">📍 Джерела даних:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">🍽️ Ресторани, кафе</span>
                <span className="text-gray-500 ml-1">— пік обід/вечеря</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">🏢 Офіси</span>
                <span className="text-gray-500 ml-1">— пік 9:00-18:00</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">🚇 Метро, транспорт</span>
                <span className="text-gray-500 ml-1">— ранковий/вечірній пік</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">🏋️ Фітнес</span>
                <span className="text-gray-500 ml-1">— ранок та вечір</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">🛒 ТРЦ, магазини</span>
                <span className="text-gray-500 ml-1">— пік вихідні</span>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">🌳 Парки</span>
                <span className="text-gray-500 ml-1">— вечір та вихідні</span>
              </div>
            </div>
          </div>

          {/* Calculation Principle */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">🧮 Принцип розрахунку:</h4>
            <div className="text-xs text-gray-600 space-y-1.5 bg-gray-50 rounded-lg p-3">
              <p><strong>1.</strong> Кожен POI отримує базовий паттерн активності за своїм типом (0-100%)</p>
              <p><strong>2.</strong> Додається випадкова варіація: ±50% інтенсивності, ±2 години зсуву піку</p>
              <p><strong>3.</strong> Модуляція за локацією: центр міста × 1.2, окраїни × 0.5-0.8</p>
              <p><strong>4.</strong> POI агрегуються в H3-гексагони (~460м діаметр)</p>
              <p><strong>5. Результат:</strong> середня інтенсивність для кожного гексагону за годину/день</p>
            </div>
          </div>

          {/* Color Legend */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">🎨 Легенда кольорів:</h4>
            <div className="flex items-center gap-1 text-xs">
              <div className="flex-1 h-4 rounded" style={{ background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Низька активність</span>
              <span>Висока активність</span>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-700 mb-2 text-sm">💡 Як користуватися:</h4>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Оберіть день тижня кнопками Пн-Нд</li>
              <li>• Рухайте слайдер години для перегляду динаміки</li>
              <li>• Регулюйте яскравість для кращої видимості</li>
              <li>• Порівняйте буднів (Пн-Пт) з вихідними (Сб-Нд)</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 italic">
            * Дані моделюються на основі типових паттернів відвідуваності для кожного типу закладів.
            Це оціночна модель для дослідницьких цілей, а не реальні дані відвідуваності.
          </p>
        </div>
      </div>
    </div>
  );
}

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
        const response = await fetch('/heatmap_data.json');
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
  const [showInstruction, setShowInstruction] = useState(false);
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return (
    <div className="space-y-3">
      {/* Toggle with instruction button */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="heatmap-toggle"
          checked={visible}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="heatmap-toggle" className="font-medium text-sm cursor-pointer">
          🔥 Теплова карта
        </label>
        <button
          onClick={() => setShowInstruction(true)}
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline ml-auto"
        >
          Інструкція
        </button>
      </div>

      {/* Instruction Modal */}
      <HeatmapInstructionModal
        isOpen={showInstruction}
        onClose={() => setShowInstruction(false)}
      />

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

        </>
      )}
    </div>
  );
}
