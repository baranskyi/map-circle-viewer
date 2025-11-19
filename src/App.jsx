import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import FileUpload from './components/FileUpload';
import { defaultMapData, defaultCenter, defaultZoom } from './utils/defaultData';
import { calculateCenter } from './utils/kmzParser';

function App() {
  const [mapData, setMapData] = useState(defaultMapData);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);

  // Group settings: visibility, radius, color
  const [groupSettings, setGroupSettings] = useState({});

  // Initialize group settings when mapData changes
  useEffect(() => {
    const settings = {};
    mapData.groups.forEach(group => {
      settings[group.id] = {
        visible: true,
        polygonsVisible: true,
        radius: group.defaultRadius || 1000,
        color: group.defaultColor || '#FF5252'
      };
    });
    setGroupSettings(settings);
  }, [mapData]);

  // Handle new KMZ data loaded
  const handleDataLoaded = (newData) => {
    setMapData(newData);
    const newCenter = calculateCenter(newData.groups);
    setCenter(newCenter);
    setZoom(12);
  };

  // Toggle group visibility
  const toggleGroup = (groupId) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        visible: !prev[groupId].visible
      }
    }));
  };

  // Toggle polygons visibility
  const togglePolygons = (groupId) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        polygonsVisible: !prev[groupId].polygonsVisible
      }
    }));
  };

  // Update group radius
  const updateRadius = (groupId, radius) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        radius: parseInt(radius, 10)
      }
    }));
  };

  // Update group color
  const updateColor = (groupId, color) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        color
      }
    }));
  };

  // Reset to default data
  const resetToDefault = () => {
    setMapData(defaultMapData);
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  return (
    <div className="h-screen w-screen relative">
      <MapView
        groups={mapData.groups}
        groupSettings={groupSettings}
        center={center}
        zoom={zoom}
      />

      <div className="absolute top-4 left-4 z-[1000] max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <h1 className="text-lg font-bold mb-4">Map Circle Viewer</h1>

          <FileUpload
            onDataLoaded={handleDataLoaded}
            onReset={resetToDefault}
          />

          <ControlPanel
            groups={mapData.groups}
            groupSettings={groupSettings}
            onToggle={toggleGroup}
            onTogglePolygons={togglePolygons}
            onRadiusChange={updateRadius}
            onColorChange={updateColor}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
