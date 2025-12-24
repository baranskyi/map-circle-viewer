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

const APP_VERSION = '2.3.1';

function MapApp() {
  const { user } = useAuthStore();
  const { currentMap, groups, fetchMap, fetchMaps, createGroup, createPoint, updateGroup, deleteGroup, loading } = useDataStore();

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

  // POI Layer radius settings (in meters)
  const [metroRadius, setMetroRadius] = useState(500);
  const [mallsRadius, setMallsRadius] = useState(1000);
  const [fitnessRadius, setFitnessRadius] = useState(500);
  const [supermarketsRadius, setSupermarketsRadius] = useState(500);

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

  // Handle new KMZ data loaded (for non-authenticated users)
  const handleDataLoaded = (newData) => {
    setLocalMapData(newData);
    setMode('local');
    const newCenter = calculateCenter(newData.groups);
    setCenter(newCenter);
    setZoom(12);
  };

  // Handle new map created from KMZ upload (for authenticated users)
  const handleMapCreated = async (mapId) => {
    // Refresh maps list
    await fetchMaps();
    // Select the newly created map
    await handleMapSelect(mapId);
  };

  // Handle data added to existing map
  const handleDataAddedToMap = async (mapId) => {
    // Re-fetch the current map to get updated groups/points
    await fetchMap(mapId);
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
        metroRadius={metroRadius}
        mallsRadius={mallsRadius}
        fitnessRadius={fitnessRadius}
        supermarketsRadius={supermarketsRadius}
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
            onMapCreated={handleMapCreated}
            currentMapId={mode === 'supabase' ? currentMap?.id : null}
            onDataAddedToMap={handleDataAddedToMap}
          />

          {/* Loading indicator */}
          {loading && (
            <div className="text-center py-2 text-gray-400 text-sm">
              Завантаження...
            </div>
          )}

          {/* POI Layers */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Інфраструктура</h3>

            {/* Metro */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMetro}
                  onChange={() => setShowMetro(!showMetro)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🚇 Метро Києва
                  <span className="flex gap-0.5 ml-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E4181C' }} title="М1 Червона"></span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0072BC' }} title="М2 Синя"></span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#009E49' }} title="М3 Зелена"></span>
                  </span>
                </span>
              </label>
              {showMetro && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={metroRadius}
                      onChange={(e) => setMetroRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setMetroRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${metroRadius === r ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Malls */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMalls}
                  onChange={() => setShowMalls(!showMalls)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🏬 Торгові центри
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#9C27B0' }} title="ТЦ"></span>
                </span>
              </label>
              {showMalls && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={mallsRadius}
                      onChange={(e) => setMallsRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setMallsRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${mallsRadius === r ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fitness */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFitness}
                  onChange={() => setShowFitness(!showFitness)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🏋️ Фітнес-клуби
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#4CAF50' }} title="Фітнес"></span>
                </span>
              </label>
              {showFitness && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={fitnessRadius}
                      onChange={(e) => setFitnessRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setFitnessRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${fitnessRadius === r ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Supermarkets */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSupermarkets}
                  onChange={() => setShowSupermarkets(!showSupermarkets)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm flex items-center gap-1">
                  🛒 Супермаркети
                  <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: '#FF6B00' }} title="Супермаркети"></span>
                </span>
              </label>
              {showSupermarkets && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="100"
                      value={supermarketsRadius}
                      onChange={(e) => setSupermarketsRadius(Math.min(2000, Math.max(200, parseInt(e.target.value) || 200)))}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">м</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 500, 1000, 2000].map(r => (
                      <button
                        key={r}
                        onClick={() => setSupermarketsRadius(r)}
                        className={`px-2 py-0.5 text-xs rounded ${supermarketsRadius === r ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {r === 0 ? 'Вимк' : `${r}м`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
