import GroupControl from './GroupControl';

function ControlPanel({ groups, groupSettings, onToggle, onTogglePolygons, onToggleLabels, onRadiusChange, onColorChange, onIconChange, onOpacityChange, onToggleAll }) {
  if (groups.length === 0) {
    return null;
  }

  // Calculate if all groups are visible
  const allVisible = groups.every(group => groupSettings[group.id]?.visible);
  const noneVisible = groups.every(group => !groupSettings[group.id]?.visible);

  const handleMasterToggle = () => {
    // If all are visible, hide all. Otherwise show all.
    onToggleAll(!allVisible);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm text-gray-700">Групи</h2>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="master-toggle"
            checked={allVisible}
            ref={input => {
              if (input) {
                input.indeterminate = !allVisible && !noneVisible;
              }
            }}
            onChange={handleMasterToggle}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="master-toggle" className="text-xs text-gray-600 cursor-pointer">
            {allVisible ? 'Сховати все' : 'Показати все'}
          </label>
        </div>
      </div>

      {groups.map(group => (
        <GroupControl
          key={group.id}
          group={group}
          settings={groupSettings[group.id]}
          onToggle={() => onToggle(group.id)}
          onTogglePolygons={() => onTogglePolygons(group.id)}
          onToggleLabels={() => onToggleLabels(group.id)}
          onRadiusChange={(radius) => onRadiusChange(group.id, radius)}
          onColorChange={(color) => onColorChange(group.id, color)}
          onIconChange={(iconType) => onIconChange && onIconChange(group.id, iconType)}
          onOpacityChange={(opacity) => onOpacityChange && onOpacityChange(group.id, opacity)}
        />
      ))}

      <div className="pt-2 text-xs text-gray-500 border-t">
        Всього: {groups.reduce((sum, g) => sum + g.points.length, 0)} точок у {groups.length} групах
      </div>
    </div>
  );
}

export default ControlPanel;
