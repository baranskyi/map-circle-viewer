import GroupControl from './GroupControl';

function ControlPanel({ groups, groupSettings, onToggle, onTogglePolygons, onRadiusChange, onColorChange, onToggleAll }) {
  if (groups.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No groups loaded. Upload a KMZ file to get started.
      </div>
    );
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
        <h2 className="font-semibold text-sm text-gray-700">Groups</h2>
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
            {allVisible ? 'Hide All' : 'Show All'}
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
          onRadiusChange={(radius) => onRadiusChange(group.id, radius)}
          onColorChange={(color) => onColorChange(group.id, color)}
        />
      ))}

      <div className="pt-2 text-xs text-gray-500 border-t">
        Total: {groups.reduce((sum, g) => sum + g.points.length, 0)} points in {groups.length} groups
      </div>
    </div>
  );
}

export default ControlPanel;
