import GroupControl from './GroupControl';

function ControlPanel({ groups, groupSettings, onToggle, onRadiusChange, onColorChange }) {
  if (groups.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No groups loaded. Upload a KMZ file to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm text-gray-700 mb-2">Groups</h2>

      {groups.map(group => (
        <GroupControl
          key={group.id}
          group={group}
          settings={groupSettings[group.id]}
          onToggle={() => onToggle(group.id)}
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
