import { useState, useEffect } from 'react';
import { AuthProvider, UserMenu } from './components/Auth';
import { useAuthStore } from './stores/authStore';
import { useDataStore } from './stores/dataStore';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import FileUpload from './components/FileUpload';
import MapSelector from './components/MapSelector';
import { defaultMapData, defaultCenter, defaultZoom } from './utils/defaultData';
import { calculateCenter } from './utils/kmzParser';

const APP_VERSION = '2.1.0';

function MapApp() {
  const { user } = useAuthStore();
  const { currentMap, groups, fetchMap, createGroup, createPoint, updateGroup, deleteGroup, loading } = useDataStore();

  // Local state for KMZ data (when not using Supabase)
  const [localMapData, setLocalMapData] = useState(defaultMapData);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);

  // Group settings: visibility, radius, color
  const [groupSettings, setGroupSettings] = useState({});

  // POI Layer visibility
  const [showMetro, setShowMetro] = useState(true);
  const [showMalls, setShowMalls] = useState(false);
  const [showFitness, setShowFitness] = useState(false);
  const [showSupermarkets, setShowSupermarkets] = useState(false);

  // Mode: 'local' (KMZ files) or 'supabase' (saved maps)
  const [mode, setMode] = useState('local');

  // Get active groups based on mode
  const activeGroups = mode === 'supabase' && currentMap ? groups : localMapData.groups;

  // Initialize group settings when groups change
  useEffect(() => {
    const settings = {};
    activeGroups.forEach(group => {
      settings[group.id] = {
        visible: false,
        polygonsVisible: true,
        labelsVisible: true,
        radius: group.default_radius || group.defaultRadius || 1000,
        color: group.color || group.defaultColor || '#FF5252'
      };
    });
    setGroupSettings(settings);
  }, [activeGroups]);

  // Handle map selection from MapSelector
  const handleMapSelect = async (mapId) => {
    const map = await fetchMap(mapId);
    if (map) {
      setMode('supabase');
      // Center on first point if exists
      const allPoints = map.groups?.flatMap(g => g.points || []) || [];
      if (allPoints.length > 0) {
        const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
        const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;
        setCenter([avgLat, avgLng]);
        setZoom(12);
      }
    }
  };

  // Handle new KMZ data loaded
  const handleDataLoaded = (newData) => {
    setLocalMapData(newData);
    setMode('local');
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

  // Toggle labels visibility
  const toggleLabels = (groupId) => {
    setGroupSettings(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        labelsVisible: !prev[groupId].labelsVisible
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
    setLocalMapData(defaultMapData);
    setMode('local');
    setCenter(defaultCenter);
    setZoom(defaultZoom);
  };

  // Toggle all groups visibility
  const toggleAllGroups = (visible) => {
    setGroupSettings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(groupId => {
        updated[groupId] = {
          ...updated[groupId],
          visible
        };
      });
      return updated;
    });
  };

  // Transform groups for MapView (normalize structure)
  const normalizedGroups = activeGroups.map(group => ({
    ...group,
    id: group.id,
    name: group.name,
    defaultRadius: group.default_radius || group.defaultRadius || 1000,
    defaultColor: group.color || group.defaultColor || '#FF5252',
    points: (group.points || []).map(point => ({
      ...point,
      lat: point.lat,
      lng: point.lng,
      name: point.name
    })),
    polygons: group.polygons || []
  }));

  return (
    <div className="h-screen w-screen relative">
      <MapView
        groups={normalizedGroups}
        groupSettings={groupSettings}
        center={center}
        zoom={zoom}
        showMetro={showMetro}
        showMalls={showMalls}
        showFitness={showFitness}
        showSupermarkets={showSupermarkets}
      />

      <div className="absolute top-4 left-4 z-[1000] max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">Map Circle Viewer</h1>
            <UserMenu />
          </div>

          {/* Map Selector (for authenticated users) */}
          {user && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <MapSelector onMapSelect={handleMapSelect} />
              {currentMap && mode === 'supabase' && (
                <div className="mt-2 pt-2 border-t border-blue-100">
                  <div className="text-sm font-medium text-blue-700">{currentMap.name}</div>
                  <button
                    onClick={() => {
                      setMode('local');
                      useDataStore.getState().setCurrentMap(null);
                    }}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Закрити карту
                  </button>
                </div>
              )}
            </div>
          )}

          {/* File Upload (KMZ) */}
          <FileUpload
            onDataLoaded={handleDataLoaded}
            onReset={resetToDefault}
          />

          {/* Loading indicator */}
          {loading && (
            <div className="text-center py-2 text-gray-400 text-sm">
              Завантаження...
            </div>
          )}

          {/* POI Layers */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Інфраструктура</h3>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={showMetro}
                onChange={() => setShowMetro(!showMetro)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">🚇 Метро Києва</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMalls}
                onChange={() => setShowMalls(!showMalls)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">🏬 Торгові центри</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={showFitness}
                onChange={() => setShowFitness(!showFitness)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">🏋️ Фітнес-клуби</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={showSupermarkets}
                onChange={() => setShowSupermarkets(!showSupermarkets)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">🛒 Супермаркети</span>
            </label>
          </div>

          {/* Control Panel */}
          <ControlPanel
            groups={normalizedGroups}
            groupSettings={groupSettings}
            onToggle={toggleGroup}
            onTogglePolygons={togglePolygons}
            onToggleLabels={toggleLabels}
            onRadiusChange={updateRadius}
            onColorChange={updateColor}
            onToggleAll={toggleAllGroups}
          />

          <div className="mt-4 pt-3 border-t text-xs text-gray-400 text-center">
            v{APP_VERSION} {mode === 'supabase' && '• Supabase'}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MapApp />
    </AuthProvider>
  );
}

export default App;
