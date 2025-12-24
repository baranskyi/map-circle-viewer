// Available icon types
const ICON_OPTIONS = [
  { type: 'circle', label: '●', title: 'Круг' },
  { type: 'square', label: '■', title: 'Квадрат' },
  { type: 'diamond', label: '◆', title: 'Ромб' },
  { type: 'pin', label: '▼', title: 'Пін' },
  { type: 'star', label: '★', title: 'Зірка' }
];

function GroupControl({ group, settings, onToggle, onTogglePolygons, onToggleLabels, onRadiusChange, onColorChange, onIconChange }) {
  if (!settings) return null;

  const hasPolygons = group.polygons && group.polygons.length > 0;
  const currentIcon = settings.iconType || 'circle';

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      {/* Group header with toggle */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id={`toggle-${group.id}`}
          checked={settings.visible}
          onChange={onToggle}
          className="w-4 h-4 rounded"
        />
        <label
          htmlFor={`toggle-${group.id}`}
          className="font-medium text-sm flex-1 cursor-pointer"
        >
          {group.name}
        </label>
        <span className="text-xs text-gray-500">
          ({group.points?.length || 0}{hasPolygons ? ` + ${group.polygons.length}p` : ''})
        </span>
      </div>

      {/* Controls (only shown when group is visible) */}
      {settings.visible && (
        <div className="space-y-2 mt-2">
          {/* Radius controls */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs text-gray-600 w-12">Radius:</label>
              <input
                type="number"
                min="0"
                max="5000"
                step="100"
                value={settings.radius}
                onChange={(e) => onRadiusChange(Math.min(5000, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
              />
              <span className="text-xs text-gray-500">м</span>
            </div>
            <div className="flex gap-1 ml-12">
              {[0, 500, 1000, 2000].map(r => (
                <button
                  key={r}
                  onClick={() => onRadiusChange(r)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    settings.radius === r
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={settings.radius === r ? { backgroundColor: settings.color } : {}}
                >
                  {r === 0 ? 'Вимк' : `${r}м`}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Color:</label>
            <input
              type="color"
              value={settings.color}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <span className="text-xs text-gray-500 font-mono">
              {settings.color}
            </span>
          </div>

          {/* Icon selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Icon:</label>
            <div className="flex gap-1">
              {ICON_OPTIONS.map(({ type, label, title }) => (
                <button
                  key={type}
                  onClick={() => onIconChange && onIconChange(type)}
                  title={title}
                  className={`w-7 h-7 text-sm rounded flex items-center justify-center transition-colors ${
                    currentIcon === type
                      ? 'ring-2 ring-offset-1'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  style={currentIcon === type ? { backgroundColor: settings.color, color: 'white', ringColor: settings.color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Labels toggle */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Labels:</label>
            <input
              type="checkbox"
              id={`labels-${group.id}`}
              checked={settings.labelsVisible}
              onChange={onToggleLabels}
              className="w-4 h-4 rounded"
            />
            <label
              htmlFor={`labels-${group.id}`}
              className="text-xs text-gray-600 cursor-pointer"
            >
              {settings.labelsVisible ? 'On' : 'Off'}
            </label>
          </div>

          {/* Polygon toggle (only shown if group has polygons) */}
          {hasPolygons && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id={`polygons-${group.id}`}
                checked={settings.polygonsVisible}
                onChange={onTogglePolygons}
                className="w-3 h-3 rounded"
              />
              <label
                htmlFor={`polygons-${group.id}`}
                className="text-xs text-gray-600 cursor-pointer"
              >
                Показать полигоны ({group.polygons.length})
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GroupControl;
