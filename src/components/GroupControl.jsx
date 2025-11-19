function GroupControl({ group, settings, onToggle, onRadiusChange, onColorChange }) {
  if (!settings) return null;

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
          ({group.points.length})
        </span>
      </div>

      {/* Controls (only shown when group is visible) */}
      {settings.visible && (
        <div className="space-y-2 mt-2">
          {/* Radius slider */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-12">Radius:</label>
            <input
              type="range"
              min="1000"
              max="5000"
              step="500"
              value={settings.radius}
              onChange={(e) => onRadiusChange(e.target.value)}
              className="flex-1 h-2"
            />
            <span className="text-xs text-gray-600 w-14 text-right">
              {settings.radius}m
            </span>
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
        </div>
      )}
    </div>
  );
}

export default GroupControl;
